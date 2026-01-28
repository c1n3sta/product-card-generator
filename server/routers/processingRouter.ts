import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getJobsByUserId, getJobById, getLogsByJobId } from "../db";
import { startBulkProcessing } from "../services/bulkProcessingService";

export const processingRouter = router({
  startBulkGeneration: protectedProcedure
    .input(
      z.object({
        productIds: z.array(z.number()).min(1),
        accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
        targetMarketplace: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const job = await startBulkProcessing({
        userId: ctx.user.id,
        productIds: input.productIds,
        accentColor: input.accentColor,
        targetMarketplace: input.targetMarketplace,
      });
      return { success: true, jobId: job.id };
    }),

  listJobs: protectedProcedure.query(async ({ ctx }) => {
    return getJobsByUserId(ctx.user.id);
  }),

  getJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const job = await getJobById(input.jobId);
      if (!job || job.userId !== ctx.user.id) throw new Error("Job not found");
      return job;
    }),

  getJobLogs: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const job = await getJobById(input.jobId);
      if (!job || job.userId !== ctx.user.id) throw new Error("Job not found");
      return getLogsByJobId(input.jobId);
    }),

  getJobProgress: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input, ctx }) => {
      const jobId = parseInt(input.jobId);
      const job = await getJobById(jobId);
      if (!job || job.userId !== ctx.user.id) throw new Error("Job not found");

      const logs = await getLogsByJobId(jobId);
      const totalProducts = job.totalProducts || 1;
      
      // Count completed products (those with card_assembly step completed)
      const completedProducts = logs.filter(
        (l) => l.step === "card_assembly" && l.status === "completed"
      ).length;
      const currentProductIndex = Math.max(completedProducts, logs.length > 0 ? 1 : 0);

      // Calculate overall progress
      const overallProgress = (currentProductIndex / totalProducts) * 100;

      // Determine current step from latest log
      let currentStep: "data-extraction" | "background-removal" | "generation" | "completed" = "data-extraction";
      let stepProgress = 0;

      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog.step === "data_extraction") {
          currentStep = "data-extraction";
          stepProgress = lastLog.status === "completed" ? 100 : 50;
        } else if (lastLog.step === "background_removal") {
          currentStep = "background-removal";
          stepProgress = lastLog.status === "completed" ? 100 : 50;
        } else if (lastLog.step === "background_generation" || lastLog.step === "card_assembly") {
          currentStep = "generation";
          stepProgress = lastLog.status === "completed" ? 100 : 50;
        }
      }

      if (job.status === "completed") {
        currentStep = "completed";
        stepProgress = 100;
      }

      // Estimate time remaining (rough estimate: 30 seconds per product)
      const estimatedTimePerProduct = 30;
      const estimatedTimeRemaining = Math.max(0, (totalProducts - currentProductIndex) * estimatedTimePerProduct);

      return {
        jobId: input.jobId,
        status: job.status as "pending" | "in-progress" | "completed" | "failed",
        overallProgress: Math.min(100, overallProgress),
        currentProductIndex,
        totalProducts,
        currentStep,
        stepProgress,
        estimatedTimeRemaining,
        error: job.status === "failed" ? "Generation failed" : undefined,
      };
    }),
});
