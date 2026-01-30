import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Plus,
  Trash2,
  Loader2,
  Download,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CSVPreview, type CSVRow } from "@/components/CSVPreview";

export default function Products() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [csvPreviewData, setCSVPreviewData] = useState<CSVRow[]>([]);
  const [csvContent, setCSVContent] = useState("");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    price: "",
  });

  const { data: products, isLoading } = trpc.products.list.useQuery();
  const { data: csvTemplate } = trpc.products.getCSVTemplate.useQuery();

  const previewCSV = trpc.products.previewCSV.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setCSVPreviewData(result.rows);
        setShowCSVPreview(true);
      } else {
        toast.error(result.error || "Failed to parse CSV");
      }
      setIsImporting(false);
    },
    onError: (error) => {
      toast.error("Failed to preview CSV: " + error.message);
      setIsImporting(false);
    },
  });

  const importCSVRows = trpc.products.importCSVRows.useMutation({
    onSuccess: (result) => {
      toast.success(`Imported ${result.imported} products successfully`);
      utils.products.list.invalidate();
      setShowCSVPreview(false);
      setCSVPreviewData([]);
      setCSVContent("");
    },
    onError: (error) => {
      toast.error("Import failed: " + error.message);
    },
  });

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      utils.products.list.invalidate();
      setShowAddDialog(false);
      setNewProduct({ sku: "", name: "", description: "", category: "", price: "" });
    },
    onError: (error) => {
      toast.error("Failed to create product: " + error.message);
    },
  });

  const bulkDelete = trpc.products.bulkDelete.useMutation({
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deleted} products`);
      utils.products.list.invalidate();
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast.error("Failed to delete products: " + error.message);
    },
  });

  const startGeneration = trpc.processing.startBulkGeneration.useMutation({
    onSuccess: (result) => {
      toast.success("Card generation started!");
      setShowGenerateDialog(false);
      setSelectedProducts([]);
      setLocation("/jobs");
    },
    onError: (error) => {
      toast.error("Failed to start generation: " + error.message);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCSVContent(content);
      previewCSV.mutate({ csvContent: content });
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsImporting(false);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    const validRows = csvPreviewData.filter((row) => row.errors.length === 0);
    const rowsToImport = validRows.map((row) => ({
      sku: row.sku,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
    }));

    importCSVRows.mutate({ rows: rowsToImport });
  };

  const downloadTemplate = () => {
    if (!csvTemplate) return;
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products?.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products?.map((p) => p.id) ?? []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const pendingProducts = products?.filter((p) => p.status === "pending") ?? [];
  const selectedPendingProducts = selectedProducts.filter((id) =>
    pendingProducts.some((p) => p.id === id)
  );

  return (
    <div className="space-y-6">
      {/* CSV Preview Dialog */}
      <Dialog open={showCSVPreview} onOpenChange={setShowCSVPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <CSVPreview
            rows={csvPreviewData}
            onConfirm={handleConfirmImport}
            onCancel={() => {
              setShowCSVPreview(false);
              setCSVPreviewData([]);
              setCSVContent("");
            }}
            isLoading={importCSVRows.isPending}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog and import data from CSV files.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter product details manually or import from CSV.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="PROD-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Premium Wireless Headphones"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="High-quality wireless headphones with noise cancellation..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="Electronics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="$299.99"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createProduct.mutate(newProduct)}
                  disabled={!newProduct.name || createProduct.isPending}
                >
                  {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedProducts.length} product(s) selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkDelete.mutate({ ids: selectedProducts })}
                  disabled={bulkDelete.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                {selectedPendingProducts.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setShowGenerateDialog(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cards ({selectedPendingProducts.length})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Product Cards</DialogTitle>
            <DialogDescription>
              Start AI-powered card generation for {selectedPendingProducts.length} selected product(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                startGeneration.mutate({
                  productIds: selectedPendingProducts,
                  accentColor,
                })
              }
              disabled={startGeneration.isPending}
            >
              {startGeneration.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {products?.length || 0} product(s) in your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.length === products.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku || "-"}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>{product.price || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : product.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : product.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by importing products from CSV or adding them manually.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
