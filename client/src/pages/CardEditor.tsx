import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import * as fabric from "fabric";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function CardEditor() {
  const params = useParams<{ cardId: string }>();
  const cardId = parseInt(params.cardId || "0");
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: cardData, isLoading } = trpc.cards.get.useQuery({ id: cardId });

  const updateCard = trpc.cards.update.useMutation({
    onSuccess: () => {
      toast.success("Card saved successfully");
      utils.cards.get.invalidate({ id: cardId });
    },
    onError: (error) => {
      toast.error("Failed to save card: " + error.message);
    },
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#1a1a2e",
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

    // Set background color based on accent color
    canvas.backgroundColor = cardData.accentColor || "#1a1a2e";

    // Load layers
    cardData.layers?.forEach(async (layer, index) => {
      if (layer.layerType === "background" && layer.imageUrl) {
        try {
          const img = await fabric.FabricImage.fromURL(layer.imageUrl, { crossOrigin: "anonymous" });
          img.scaleToWidth(CANVAS_WIDTH);
          img.set({
            left: 0,
            top: 0,
            selectable: true,
            evented: true,
          });
          canvas.add(img);
          canvas.sendObjectToBack(img);
        } catch (error) {
          console.error("Failed to load background image:", error);
        }
      } else if (layer.layerType === "product_image" && layer.imageUrl) {
        try {
          const img = await fabric.FabricImage.fromURL(layer.imageUrl, { crossOrigin: "anonymous" });
          const scale = Math.min(300 / img.width!, 300 / img.height!);
          img.scale(scale);
          img.set({
            left: layer.positionX || CANVAS_WIDTH / 2 - (img.width! * scale) / 2,
            top: layer.positionY || CANVAS_HEIGHT / 2 - (img.height! * scale) / 2,
            selectable: true,
            evented: true,
          });
          canvas.add(img);
        } catch (error) {
          console.error("Failed to load product image:", error);
        }
      } else if (layer.layerType === "text_title" && layer.textContent) {
        const text = new fabric.Textbox(layer.textContent, {
          left: layer.positionX || CANVAS_WIDTH / 2,
          top: layer.positionY || 50,
          width: CANVAS_WIDTH - 100,
          fontSize: layer.fontSize || 32,
          fontFamily: layer.fontFamily || "Inter",
          fontWeight: (layer.fontWeight as any) || "bold",
          fill: layer.fontColor || "#FFFFFF",
          textAlign: (layer.textAlign as any) || "center",
          originX: "center",
          selectable: true,
          evented: true,
        });
        canvas.add(text);
      } else if (layer.layerType === "text_description" && layer.textContent) {
        const text = new fabric.Textbox(layer.textContent, {
          left: layer.positionX || CANVAS_WIDTH / 2,
          top: layer.positionY || CANVAS_HEIGHT - 100,
          width: CANVAS_WIDTH - 100,
          fontSize: layer.fontSize || 16,
          fontFamily: layer.fontFamily || "Inter",
          fontWeight: (layer.fontWeight as any) || "normal",
          fill: layer.fontColor || "#FFFFFF",
          textAlign: (layer.textAlign as any) || "center",
          originX: "center",
          selectable: true,
          evented: true,
        });
        canvas.add(text);
      }
    });

    canvas.renderAll();
  }, [cardData]);

  const handleExport = useCallback(async () => {
    if (!fabricRef.current) return;

    setIsExporting(true);
    try {
      const canvas = fabricRef.current;
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

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
  }, [cardId]);

  const handleSave = useCallback(async () => {
    if (!fabricRef.current) return;

    setIsSaving(true);
    try {
      const canvas = fabricRef.current;
      const canvasData = canvas.toJSON();

      await updateCard.mutateAsync({
        id: cardId,
        canvasData,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [cardId, updateCard]);

  const handleDeleteSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.remove(selectedObject);
    setSelectedObject(null);
  }, [selectedObject]);

  const handleAddText = useCallback(() => {
    if (!fabricRef.current) return;

    const text = new fabric.Textbox("New Text", {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      width: 200,
      fontSize: 24,
      fontFamily: "Inter",
      fill: "#FFFFFF",
      textAlign: "center",
      originX: "center",
      originY: "center",
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  }, []);

  const updateSelectedText = useCallback(
    (property: string, value: any) => {
      if (!fabricRef.current || !selectedObject) return;

      selectedObject.set(property as keyof fabric.FabricObject, value);
      fabricRef.current.renderAll();
    },
    [selectedObject]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Card not found</p>
        <Button onClick={() => setLocation("/cards")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cards
        </Button>
      </div>
    );
  }

  const isTextObject = selectedObject instanceof fabric.Textbox;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Card Editor</h1>
            <p className="text-muted-foreground">
              {cardData.product?.name || `Card #${cardId}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-center overflow-auto bg-slate-900 rounded-lg p-4">
                <canvas ref={canvasRef} className="border border-slate-700 rounded shadow-xl" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {/* Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleAddText}>
                <Type className="mr-2 h-4 w-4" />
                Add Text
              </Button>
              {selectedObject && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Selected Object Properties */}
          {selectedObject && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTextObject && (
                  <>
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Slider
                        value={[(selectedObject as fabric.Textbox).fontSize || 24]}
                        onValueChange={([value]) => updateSelectedText("fontSize", value)}
                        min={8}
                        max={72}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">
                        {(selectedObject as fabric.Textbox).fontSize}px
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Color</Label>
                      <Input
                        type="color"
                        value={(selectedObject as fabric.Textbox).fill as string || "#FFFFFF"}
                        onChange={(e) => updateSelectedText("fill", e.target.value)}
                        className="h-10 w-full cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Align</Label>
                      <Select
                        value={(selectedObject as fabric.Textbox).textAlign || "center"}
                        onValueChange={(value) => updateSelectedText("textAlign", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Weight</Label>
                      <Select
                        value={(selectedObject as fabric.Textbox).fontWeight as string || "normal"}
                        onValueChange={(value) => updateSelectedText("fontWeight", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <Slider
                    value={[selectedObject.opacity || 1]}
                    onValueChange={([value]) => updateSelectedText("opacity", value)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round((selectedObject.opacity || 1) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Rotation</Label>
                  <Slider
                    value={[selectedObject.angle || 0]}
                    onValueChange={([value]) => updateSelectedText("angle", value)}
                    min={0}
                    max={360}
                    step={1}
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(selectedObject.angle || 0)}°
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Card Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    cardData.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {cardData.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accent Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: cardData.accentColor || "#3B82F6" }}
                  />
                  <span>{cardData.accentColor || "#3B82F6"}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layers</span>
                <span>{cardData.layers?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
