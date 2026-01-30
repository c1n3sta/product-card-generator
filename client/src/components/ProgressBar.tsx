import { useEffect, useState } from "react";
import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  progress?: number;
}

export interface ProgressBarProps {
  title: string;
  steps: ProgressStep[];
  overallProgress: number;
  currentProductIndex: number;
  totalProducts: number;
  estimatedTimeRemaining?: number;
  isComplete?: boolean;
  error?: string;
}

export function ProgressBar({
  title,
  steps,
  overallProgress,
  currentProductIndex,
  totalProducts,
  estimatedTimeRemaining,
  isComplete,
  error,
}: ProgressBarProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedProgress((prev) => {
        const diff = overallProgress - prev;
        if (Math.abs(diff) < 1) return overallProgress;
        return prev + diff * 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [overallProgress]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return "";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${Math.round(secs)}s`;
  };

  return (
    <Card className="p-6 bg-white">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <span className="text-sm font-medium text-slate-600">
            {currentProductIndex} / {totalProducts}
          </span>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {Math.round(displayedProgress)}%
            </span>
          </div>
          <Progress value={displayedProgress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center gap-3">
                {step.status === "completed" && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                {step.status === "in-progress" && (
                  <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                {step.status === "pending" && (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}

                <span
                  className={`text-sm font-medium ${
                    step.status === "completed"
                      ? "text-green-700"
                      : step.status === "in-progress"
                        ? "text-blue-700"
                        : step.status === "error"
                          ? "text-red-700"
                          : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>

                {step.progress !== undefined && step.status === "in-progress" && (
                  <span className="text-xs text-slate-500 ml-auto">
                    {Math.round(step.progress)}%
                  </span>
                )}
              </div>

              {step.progress !== undefined && step.status === "in-progress" && (
                <div className="ml-8">
                  <Progress value={step.progress} className="h-1" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time Estimate */}
        {estimatedTimeRemaining && estimatedTimeRemaining > 0 && !isComplete && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Estimated time remaining:{" "}
              <span className="font-semibold text-slate-900">
                {formatTime(estimatedTimeRemaining)}
              </span>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-700">
              ✓ All {totalProducts} product cards generated successfully!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
