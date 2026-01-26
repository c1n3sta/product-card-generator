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
});
