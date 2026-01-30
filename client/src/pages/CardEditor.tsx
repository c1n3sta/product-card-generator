import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  Download,
  Save,
  Type,
  Image as ImageIcon,
  Layers,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Grid3x3,
  Sparkles,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import * as fabric from "fabric";

export default function CardEditor() {
  const params = useParams<{ cardId: string }>();
  const cardId = parseInt(params.cardId || "0");
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [layers, setLayers] = useState<any[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: cardData, isLoading } = trpc.cards.get.useQuery({ id: cardId });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1000,
      height: 1000,
      backgroundColor: "#f5f5f5",
      selection: true,
    });

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Load card data into canvas
  useEffect(() => {
    if (!fabricRef.current || !cardData) return;

    const canvas = fabricRef.current;
    canvas.clear();

    // Set canvas size based on card dimensions or default
    const canvasWidth = 1000;
    const canvasHeight = 1000;
    canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

    // Set background color
    canvas.backgroundColor = cardData.accentColor || "#1a1a2e";

    // Draw composition guides if enabled
    if (showGuides) {
      drawCompositionGuides(canvas, canvasWidth, canvasHeight);
    }

    // Load layers
    const loadedLayers: any[] = [];
    cardData.layers?.forEach(async (layer, index) => {
      loadedLayers.push(layer);

      if (layer.layerType === "background" && layer.imageUrl) {
        try {
          const img = await fabric.FabricImage.fromURL(layer.imageUrl, { crossOrigin: "anonymous" });
          img.scaleToWidth(canvasWidth);
          img.scaleToHeight(canvasHeight);
          img.set({
            left: 0,
            top: 0,
            selectable: true,
            evented: true,
            data: { layerId: layer.id, layerType: "background" },
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
        } catch (error) {
          console.error("Failed to load background image:", error);
        }
      } else if (layer.layerType === "product_image" && layer.imageUrl) {
        try {
          const img = await fabric.FabricImage.fromURL(layer.imageUrl, { crossOrigin: "anonymous" });
          
          // Use layer dimensions if available
          if (layer.width && layer.height) {
            const scaleX = layer.width / img.width!;
            const scaleY = layer.height / img.height!;
            img.set({
              scaleX,
              scaleY,
            });
          } else {
            const scale = Math.min(400 / img.width!, 400 / img.height!);
            img.scale(scale);
          }

          img.set({
            left: layer.positionX || canvasWidth / 2 - (img.getScaledWidth()) / 2,
            top: layer.positionY || canvasHeight / 2 - (img.getScaledHeight()) / 2,
            selectable: true,
            evented: true,
            data: { layerId: layer.id, layerType: "product_image" },
          });
          canvas.add(img);
        } catch (error) {
          console.error("Failed to load product image:", error);
        }
      } else if (layer.layerType === "text_title" && layer.textContent) {
        const text = new fabric.Textbox(layer.textContent, {
          left: layer.positionX || canvasWidth / 2,
          top: layer.positionY || 100,
          width: layer.width || canvasWidth - 100,
          fontSize: layer.fontSize || 48,
          fontFamily: layer.fontFamily || "Inter",
          fontWeight: (layer.fontWeight as any) || "bold",
          fill: layer.fontColor || "#FFFFFF",
          textAlign: (layer.textAlign as any) || "left",
          selectable: true,
          evented: true,
          data: { layerId: layer.id, layerType: "text_title" },
        });
        canvas.add(text);
      } else if (layer.layerType === "text_description" && layer.textContent) {
        const text = new fabric.Textbox(layer.textContent, {
          left: layer.positionX || canvasWidth / 2,
          top: layer.positionY || canvasHeight - 200,
          width: layer.width || canvasWidth - 100,
          fontSize: layer.fontSize || 24,
          fontFamily: layer.fontFamily || "Inter",
          fontWeight: (layer.fontWeight as any) || "normal",
          fill: layer.fontColor || "#FFFFFF",
          textAlign: (layer.textAlign as any) || "left",
          selectable: true,
          evented: true,
          data: { layerId: layer.id, layerType: "text_description" },
        });
        canvas.add(text);
      }
    });

    setLayers(loadedLayers);
    canvas.renderAll();
  }, [cardData, showGuides]);

  const drawCompositionGuides = (canvas: fabric.Canvas, width: number, height: number) => {
    const RULE_OF_THIRDS = 1 / 3;
    const thirdX = width * RULE_OF_THIRDS;
    const twoThirdsX = width * (2 * RULE_OF_THIRDS);
    const thirdY = height * RULE_OF_THIRDS;
    const twoThirdsY = height * (2 * RULE_OF_THIRDS);

    const guideStyle = {
      stroke: "#FF6B6B",
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      opacity: 0.5,
    };

    // Vertical lines
    canvas.add(new fabric.Line([thirdX, 0, thirdX, height], guideStyle));
    canvas.add(new fabric.Line([twoThirdsX, 0, twoThirdsX, height], guideStyle));

    // Horizontal lines
    canvas.add(new fabric.Line([0, thirdY, width, thirdY], guideStyle));
    canvas.add(new fabric.Line([0, twoThirdsY, width, twoThirdsY], guideStyle));
  };

  const handleExport = useCallback(async () => {
    if (!fabricRef.current) return;

    setIsExporting(true);
    try {
      const canvas = fabricRef.current;
      
      // Temporarily hide guides
      const guides = canvas.getObjects().filter((obj: any) => !obj.selectable);
      guides.forEach((guide) => canvas.remove(guide));

      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      // Restore guides
      if (showGuides) {
        drawCompositionGuides(canvas, canvas.width!, canvas.height!);
      }

      // Download the image
      const link = document.createElement("a");
      link.download = `product-card-${cardId}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Card exported successfully");
    } catch (error) {
      toast.error("Failed to export card");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  }, [cardId, showGuides]);

  const handleSave = useCallback(async () => {
    toast.info("Save functionality coming soon");
  }, []);

  const regenerateLayer = trpc.cards.layers.regenerate.useMutation({
    onSuccess: () => {
      toast.success("Layer regenerated successfully");
      utils.cards.get.invalidate({ id: cardId });
    },
    onError: (error) => {
      toast.error("Failed to regenerate layer: " + error.message);
    },
  });

  const handleRegenerateLayer = useCallback(async (layerId: number, layerType: string) => {
    toast.info(`Regenerating ${layerType}...`);
    regenerateLayer.mutate({
      id: layerId,
      cardId,
      layerType: layerType as any,
    });
  }, [cardId, regenerateLayer]);

  const handleDeleteLayer = useCallback((layerId: number) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    const objectToDelete = objects.find((obj: any) => obj.data?.layerId === layerId);
    
    if (objectToDelete) {
      canvas.remove(objectToDelete);
      canvas.renderAll();
      setLayers((prev) => prev.filter((l) => l.id !== layerId));
      toast.success("Layer deleted");
    }
  }, []);

  const toggleLayerVisibility = useCallback((layerId: number) => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    const objects = canvas.getObjects();
    const object = objects.find((obj: any) => obj.data?.layerId === layerId);
    
    if (object) {
      object.visible = !object.visible;
      canvas.renderAll();
      setLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: object.visible } : l))
      );
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold">Card not found</h2>
        <Button onClick={() => setLocation("/cards")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Toolbars */}
      <div className="w-16 bg-card border-r flex flex-col items-center py-4 gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/cards")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Separator />
        <Button
          variant={showGuides ? "default" : "ghost"}
          size="icon"
          onClick={() => setShowGuides(!showGuides)}
          title="Toggle Composition Guides"
        >
          <Grid3x3 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving} title="Save">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          disabled={isExporting}
          title="Export"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="relative">
          <canvas ref={canvasRef} className="border border-border shadow-2xl" />
        </div>
      </div>

      {/* Right Sidebar - Properties & Layers */}
      <div className="w-80 bg-card border-l overflow-y-auto">
        <Tabs defaultValue="layers" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="layers">
              <Layers className="mr-2 h-4 w-4" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
          </TabsList>

          <TabsContent value="layers" className="p-4 space-y-2">
            <div className="text-sm font-medium mb-4">Card Layers</div>
            {layers.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No layers available
              </div>
            ) : (
              layers.map((layer) => (
                <Card key={layer.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {layer.layerType === "background" && <ImageIcon className="h-4 w-4" />}
                      {layer.layerType === "product_image" && <ImageIcon className="h-4 w-4" />}
                      {layer.layerType.startsWith("text_") && <Type className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">
                        {layer.layerType.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleLayerVisibility(layer.id)}
                      >
                        {layer.visible !== false ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRegenerateLayer(layer.id, layer.layerType)}
                      >
                        <Sparkles className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteLayer(layer.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {layer.textContent && (
                    <div className="text-xs text-muted-foreground truncate">
                      {layer.textContent}
                    </div>
                  )}
                  {layer.imageUrl && (
                    <div className="text-xs text-muted-foreground truncate">
                      {layer.imageUrl.split("/").pop()}
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="properties" className="p-4 space-y-4">
            {selectedObject ? (
              <>
                <div className="text-sm font-medium mb-4">Object Properties</div>
                <div className="space-y-4">
                  <div>
                    <Label>Position X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.left || 0)}
                      onChange={(e) => {
                        selectedObject.set({ left: parseInt(e.target.value) });
                        fabricRef.current?.renderAll();
                      }}
                    />
                  </div>
                  <div>
                    <Label>Position Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedObject.top || 0)}
                      onChange={(e) => {
                        selectedObject.set({ top: parseInt(e.target.value) });
                        fabricRef.current?.renderAll();
                      }}
                    />
                  </div>
                  <div>
                    <Label>Opacity</Label>
                    <Slider
                      value={[(selectedObject.opacity || 1) * 100]}
                      onValueChange={([value]) => {
                        selectedObject.set({ opacity: value / 100 });
                        fabricRef.current?.renderAll();
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                Select an object to edit properties
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
