import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Download, 
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Type,
  Image as ImageIcon,
  Layers,
  Palette,
  Settings,
  ArrowLeft,
  Layout as LayoutIcon
} from "lucide-react";
import { toast } from "sonner";
import { Canvas, Image, Text } from "fabric";
import {
  CARD_DIMENSIONS,
  SPACING,
  TYPOGRAPHY,
  FONT_WEIGHTS,
  GOLDEN_RATIO,
  generateLayout,
  calculateImageScale,
  snapToGrid,
} from "@/utils/composition";

interface CardEditorProps {
  cardId: number;
}

type LayoutStyle = "left-focus" | "center-focus" | "right-focus";

export default function CardEditor({ cardId }: CardEditorProps) {
  const [location, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [accentColor, setAccentColor] = useState("#0057B7");
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<"select" | "text" | "image">("select");
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>("left-focus");

  const { data: card, isLoading: cardLoading } = trpc.products.getCard.useQuery({ productId: cardId });
  const { data: layers } = trpc.products.getCardLayers.useQuery({ cardId });
  const updateCardMutation = trpc.products.updateCard.useMutation();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: CARD_DIMENSIONS.width,
      height: CARD_DIMENSIONS.height,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Load layers with proper composition
    loadLayers(canvas);

    return () => {
      canvas.dispose();
    };
  }, [layers, accentColor, layoutStyle]);

  const loadLayers = async (canvas: Canvas) => {
    if (!layers) return;

    // Clear canvas
    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    // Get layout configuration
    const layout = generateLayout(layoutStyle);

    // Add background layer
    const bgLayer = layers.find((l) => l.layerType === "background");
    if (bgLayer?.imageUrl) {
      try {
        const img = await Image.fromURL(bgLayer.imageUrl);
        // Scale to fill canvas while maintaining aspect ratio
        const scale = Math.max(
          canvas.width! / (img.width || 1),
          canvas.height! / (img.height || 1)
        );
        img.scale(scale);
        img.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });
        canvas.add(img);
        canvas.sendToBack(img);
      } catch (error) {
        console.error("Failed to load background:", error);
      }
    }

    // Add product image with composition-based positioning
    const imgLayer = layers.find((l) => l.layerType === "product_image");
    if (imgLayer?.imageUrl) {
      try {
        const img = await Image.fromURL(imgLayer.imageUrl);
        
        // Calculate scale using composition utilities
        const scale = calculateImageScale(
          img.width || 1,
          img.height || 1,
          layout.productImage.maxWidth,
          layout.productImage.maxHeight,
          "contain"
        );
        
        img.scale(scale);
        img.set({
          left: layout.productImage.position.x,
          top: layout.productImage.position.y,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: true,
          hasBorders: true,
          borderColor: accentColor,
          cornerColor: accentColor,
          cornerStyle: "circle",
          transparentCorners: false,
        });
        canvas.add(img);
      } catch (error) {
        console.error("Failed to load product image:", error);
      }
    }

    // Add title text with proper typography
    const titleLayer = layers.find((l) => l.layerType === "text_title");
    if (titleLayer?.textContent) {
      const text = new Text(titleLayer.textContent, {
        left: layout.title.position.x,
        top: layout.title.position.y,
        fontSize: layout.title.fontSize,
        fontWeight: layout.title.fontWeight,
        fontFamily: "Inter, system-ui, sans-serif",
        fill: accentColor,
        width: layout.title.maxWidth,
        originX: layoutStyle === "center-focus" ? "center" : "left",
        originY: "top",
        selectable: true,
        hasControls: true,
        hasBorders: true,
        borderColor: accentColor,
        cornerColor: accentColor,
        cornerStyle: "circle",
        transparentCorners: false,
      });
      canvas.add(text);
    }

    // Add description text with proper line height
    const descLayer = layers.find((l) => l.layerType === "text_description");
    if (descLayer?.textContent) {
      const text = new Text(descLayer.textContent, {
        left: layout.description.position.x,
        top: layout.description.position.y,
        fontSize: layout.description.fontSize,
        fontFamily: "Inter, system-ui, sans-serif",
        fill: "#333333",
        width: layout.description.maxWidth,
        lineHeight: layout.description.lineHeight,
        originX: layoutStyle === "center-focus" ? "center" : "left",
        originY: "top",
        selectable: true,
        hasControls: true,
        hasBorders: true,
        borderColor: accentColor,
        cornerColor: accentColor,
        cornerStyle: "circle",
        transparentCorners: false,
      });
      canvas.add(text);
    }

    // Add snap-to-grid behavior
    canvas.on("object:moving", (e) => {
      const obj = e.target;
      if (obj) {
        obj.set({
          left: snapToGrid(obj.left || 0),
          top: snapToGrid(obj.top || 0),
        });
      }
    });

    canvas.renderAll();
  };

  const handleSaveCard = async () => {
    if (!fabricCanvasRef.current) return;

    setIsSaving(true);
    try {
      const fabricJson = JSON.stringify(fabricCanvasRef.current.toJSON());
      await updateCardMutation.mutateAsync({
        cardId,
        fabricJson,
        accentColor,
      });
      toast.success("Card saved successfully!");
    } catch (error) {
      toast.error(`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCard = () => {
    if (!fabricCanvasRef.current) return;

    const dataUrl = fabricCanvasRef.current.toDataURL({ 
      format: "png", 
      quality: 1, 
      multiplier: 2 // Export at 2x resolution for better quality
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `product-card-${cardId}.png`;
    link.click();
    toast.success("Card exported!");
  };

  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.min(zoom + 0.1, 2);
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const handleResetZoom = () => {
    if (!fabricCanvasRef.current) return;
    setZoom(1);
    fabricCanvasRef.current.setZoom(1);
    fabricCanvasRef.current.renderAll();
  };

  const handleLayoutChange = (style: LayoutStyle) => {
    setLayoutStyle(style);
    if (fabricCanvasRef.current) {
      loadLayers(fabricCanvasRef.current);
    }
  };

  if (cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/")}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6 bg-slate-700" />
            <h1 className="text-lg font-semibold text-white">Card Editor</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveCard}
              disabled={isSaving}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCard}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-2">
          <Button
            variant={selectedTool === "select" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setSelectedTool("select")}
            className="text-slate-300 hover:text-white"
            title="Select Tool"
          >
            <Layers className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === "text" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setSelectedTool("text")}
            className="text-slate-300 hover:text-white"
            title="Text Tool"
          >
            <Type className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTool === "image" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setSelectedTool("image")}
            className="text-slate-300 hover:text-white"
            title="Image Tool"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          
          <Separator className="w-8 my-2 bg-slate-700" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="text-slate-300 hover:text-white"
            title="Reset Zoom"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-8">
          <div 
            className="bg-white shadow-2xl" 
            style={{ 
              width: CARD_DIMENSIONS.width * zoom, 
              height: CARD_DIMENSIONS.height * zoom 
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Layout Selector */}
            <Card className="bg-slate-750 border-slate-700 p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <LayoutIcon className="w-4 h-4" />
                Layout Style
              </h2>
              <div className="space-y-2">
                <Button
                  variant={layoutStyle === "left-focus" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleLayoutChange("left-focus")}
                  className="w-full justify-start"
                >
                  Left Focus
                </Button>
                <Button
                  variant={layoutStyle === "center-focus" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleLayoutChange("center-focus")}
                  className="w-full justify-start"
                >
                  Center Focus
                </Button>
                <Button
                  variant={layoutStyle === "right-focus" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleLayoutChange("right-focus")}
                  className="w-full justify-start"
                >
                  Right Focus
                </Button>
              </div>
            </Card>

            {/* Design Properties */}
            <Card className="bg-slate-750 border-slate-700 p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Design
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accent-color" className="text-xs font-medium text-slate-300">
                    Accent Color
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 cursor-pointer p-1 bg-slate-700 border-slate-600"
                    />
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Layers Panel */}
            <Card className="bg-slate-750 border-slate-700 p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Layers
              </h2>
              <div className="space-y-2">
                {layers?.map((layer) => (
                  <div 
                    key={layer.id} 
                    className="p-3 bg-slate-700 rounded-lg flex items-center justify-between hover:bg-slate-600 transition cursor-pointer"
                  >
                    <span className="text-sm font-medium text-white capitalize">
                      {layer.layerType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                      {layer.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Canvas Info */}
            <Card className="bg-slate-750 border-slate-700 p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Canvas Info
              </h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="text-white">
                    {CARD_DIMENSIONS.width} × {CARD_DIMENSIONS.height}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Aspect Ratio:</span>
                  <span className="text-white">Golden Ratio (1:{GOLDEN_RATIO.toFixed(3)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom:</span>
                  <span className="text-white">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Grid:</span>
                  <span className="text-white">{SPACING.xs}px</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
