import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Play } from "lucide-react";
import { toast } from "sonner";

export default function CardGenerator() {
  const [csvContent, setCsvContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("#0057B7");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const { data: products, isLoading: productsLoading, refetch } = trpc.products.list.useQuery();
  const uploadMutation = trpc.products.uploadCSV.useMutation();
  const startBulkMutation = trpc.processing.startBulkGeneration.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);

      try {
        await uploadMutation.mutateAsync({ csvContent: content });
        toast.success("CSV uploaded successfully!");
        refetch();
      } catch (error) {
        toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
  };

  const handleStartGeneration = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      await startBulkMutation.mutateAsync({
        productIds: selectedProducts,
        accentColor: selectedColor,
      });
      toast.success("Bulk generation started!");
      setSelectedProducts([]);
    } catch (error) {
      toast.error(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Product Card Generator</h1>
        <p className="text-slate-600 mb-8">Create professional product cards with AI-powered design</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-semibold mb-4">1. Upload CSV</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-slate-600">Click to upload CSV</span>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">CSV must include SKU and Name columns</p>
              </div>

              {uploadMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </Card>

          {/* Color & Generation Section */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-semibold mb-4">2. Customize Design</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="color" className="text-sm font-medium">
                  Accent Color
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="flex-1"
                    placeholder="#0057B7"
                  />
                </div>
              </div>

              <Button
                onClick={handleStartGeneration}
                disabled={selectedProducts.length === 0 || startBulkMutation.isPending}
                className="w-full"
              >
                {startBulkMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Generation ({selectedProducts.length})
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Product List Section */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-semibold mb-4">3. Select Products</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Upload a CSV to see products</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
