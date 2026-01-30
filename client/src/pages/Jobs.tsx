import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Jobs() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  const { data: jobs, isLoading } = trpc.processing.listJobs.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const cancelJob = trpc.processing.cancelJob.useMutation({
    onSuccess: () => {
      toast.success("Job cancelled");
      utils.processing.listJobs.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to cancel job: " + error.message);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "cancelled":
        return <StopCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processing Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your card generation jobs and their progress.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => utils.processing.listJobs.invalidate()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No jobs yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Start generating cards from your products to see jobs here.
            </p>
            <Button onClick={() => setLocation("/products")}>Go to Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              expanded={expandedJob === job.id}
              onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              onCancel={() => cancelJob.mutate({ jobId: job.id })}
              isCancelling={cancelJob.isPending}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface JobCardProps {
  job: {
    id: number;
    jobName: string | null;
    status: string;
    totalProducts: number | null;
    processedProducts: number | null;
    failedProducts: number | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  };
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  isCancelling: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

function JobCard({
  job,
  expanded,
  onToggle,
  onCancel,
  isCancelling,
  getStatusIcon,
  getStatusColor,
}: JobCardProps) {
  const { data: progress } = trpc.processing.getJobProgress.useQuery(
    { jobId: job.id },
    {
      enabled: job.status === "running",
      refetchInterval: job.status === "running" ? 2000 : false,
    }
  );

  const { data: logs } = trpc.processing.getJobLogs.useQuery(
    { jobId: job.id },
    { enabled: expanded }
  );

  const total = job.totalProducts || 1;
  const processed = job.processedProducts || 0;
  const failed = job.failedProducts || 0;
  const progressPercent = progress?.overallProgress ?? (processed / total) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(job.status)}
            <div>
              <CardTitle className="text-base">
                {job.jobName || `Job #${job.id}`}
              </CardTitle>
              <CardDescription>
                {processed}/{total} products processed
                {failed > 0 && ` (${failed} failed)`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
            {job.status === "running" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        {job.status === "running" && (
          <div className="mt-4">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{Math.round(progressPercent)}% complete</span>
              {progress?.estimatedTimeRemaining && (
                <span>~{Math.ceil(progress.estimatedTimeRemaining / 60)} min remaining</span>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="border-t bg-muted/30">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started</span>
                <p className="font-medium">
                  {job.startedAt
                    ? new Date(job.startedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Completed</span>
                <p className="font-medium">
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Success Rate</span>
                <p className="font-medium">
                  {total > 0 ? Math.round(((processed - failed) / total) * 100) : 0}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="font-medium">
                  {job.startedAt && job.completedAt
                    ? `${Math.round(
                        (new Date(job.completedAt).getTime() -
                          new Date(job.startedAt).getTime()) /
                          1000 /
                          60
                      )} min`
                    : "-"}
                </p>
              </div>
            </div>

            {logs && logs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Processing Logs</h4>
                <div className="max-h-60 overflow-y-auto space-y-1 text-xs font-mono bg-background rounded-lg p-3 border">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 ${
                        log.status === "failed" ? "text-red-600" : ""
                      }`}
                    >
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-1 rounded ${
                          log.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : log.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {log.step}
                      </span>
                      <span>{log.message}</span>
                      {log.errorDetails && (
                        <span className="text-red-500">- {log.errorDetails}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
