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

export default function Products() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
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

  const importCSV = trpc.products.importCSV.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Imported ${result.imported} products successfully`);
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} rows had errors`);
        }
        utils.products.list.invalidate();
      } else {
        toast.error("Import failed: " + result.errors.join(", "));
      }
      setIsImporting(false);
    },
    onError: (error) => {
      toast.error("Import failed: " + error.message);
      setIsImporting(false);
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
      importCSV.mutate({ csvContent: content });
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
                  Enter the product details manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sku" className="text-right">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createProduct.mutate(newProduct)}
                  disabled={!newProduct.name || createProduct.isPending}
                >
                  {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedProducts.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => bulkDelete.mutate({ ids: selectedProducts })}
                  disabled={bulkDelete.isPending}
                >
                  {bulkDelete.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
                <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={selectedPendingProducts.length === 0}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Cards ({selectedPendingProducts.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Product Cards</DialogTitle>
                      <DialogDescription>
                        Configure the card generation settings for {selectedPendingProducts.length} products.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accentColor" className="text-right">
                          Accent Color
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="flex-1"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          startGeneration.mutate({
                            productIds: selectedPendingProducts,
                            accentColor,
                          })
                        }
                        disabled={startGeneration.isPending}
                      >
                        {startGeneration.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Start Generation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Product Catalog
          </CardTitle>
          <CardDescription>
            {products?.length ?? 0} products in your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Import a CSV file or add products manually to get started.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products?.length}
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
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{product.name}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>{product.price ? `$${product.price}` : "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : product.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : product.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
