import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface ProcessingProgress {
  jobId: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  overallProgress: number;
  currentProductIndex: number;
  totalProducts: number;
  currentStep: "data-extraction" | "background-removal" | "generation" | "completed";
  stepProgress: number;
  estimatedTimeRemaining: number;
  error?: string;
}

export function useProcessingProgress(jobId?: string | number) {
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const jobIdStr = jobId ? String(jobId) : "";

  const getProgressQuery = trpc.processing.getJobProgress.useQuery(
    { jobId: jobIdStr },
    {
      enabled: !!jobIdStr && isPolling,
      refetchInterval: 1000,
    }
  );

  useEffect(() => {
    if (jobIdStr) {
      setIsPolling(true);
    }
  }, [jobIdStr]);

  useEffect(() => {
    if (getProgressQuery.data) {
      setProgress(getProgressQuery.data);

      if (
        getProgressQuery.data.status === "completed" ||
        getProgressQuery.data.status === "failed"
      ) {
        setIsPolling(false);
      }
    }
  }, [getProgressQuery.data]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setIsPolling(false);
  }, []);

  return {
    progress,
    isLoading: getProgressQuery.isLoading,
    isPolling,
    stopPolling,
    resetProgress,
  };
}
