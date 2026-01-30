import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Image, Loader2, ArrowRight, Upload, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: cards, isLoading: cardsLoading } = trpc.cards.list.useQuery();
  const { data: jobs, isLoading: jobsLoading } = trpc.processing.listJobs.useQuery();

  const stats = [
    {
      title: "Products",
      value: products?.length ?? 0,
      icon: Package,
      description: "Imported products",
      href: "/products",
    },
    {
      title: "Cards",
      value: cards?.length ?? 0,
      icon: Image,
      description: "Generated cards",
      href: "/cards",
    },
    {
      title: "Jobs",
      value: jobs?.length ?? 0,
      icon: Loader2,
      description: "Processing jobs",
      href: "/jobs",
    },
  ];

  const recentJobs = jobs?.slice(0, 5) ?? [];
  const pendingProducts = products?.filter((p) => p.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Product Card Generator. Create professional marketing visuals from your product data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productsLoading || cardsLoading || jobsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Products
            </CardTitle>
            <CardDescription>
              Upload a CSV file with your product data to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/products")} className="w-full">
              Go to Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Cards
            </CardTitle>
            <CardDescription>
              {pendingProducts > 0
                ? `You have ${pendingProducts} products ready for card generation`
                : "Import products first to generate cards"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/products")}
              variant={pendingProducts > 0 ? "default" : "secondary"}
              className="w-full"
              disabled={pendingProducts === 0}
            >
              {pendingProducts > 0 ? "Start Generation" : "No Products Available"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your latest processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation("/jobs")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        job.status === "completed"
                          ? "bg-green-500"
                          : job.status === "running"
                          ? "bg-blue-500 animate-pulse"
                          : job.status === "failed"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{job.jobName || `Job #${job.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.processedProducts}/{job.totalProducts} products
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "running"
                        ? "bg-blue-100 text-blue-700"
                        : job.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
