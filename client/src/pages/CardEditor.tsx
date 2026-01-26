import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Canvas, Image, Text } from "fabric";

interface CardEditorProps {
  cardId: number;
}

export default function CardEditor({ cardId }: CardEditorProps) {
  const [location, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [accentColor, setAccentColor] = useState("#0057B7");
  const [isSaving, setIsSaving] = useState(false);

  const { data: card, isLoading: cardLoading } = trpc.products.getCard.useQuery({ productId: cardId });
  const { data: layers } = trpc.products.getCardLayers.useQuery({ cardId });
  const updateCardMutation = trpc.products.updateCard.useMutation();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Add background
    if (layers?.find((l) => l.layerType === "background")) {
      const bgLayer = layers.find((l) => l.layerType === "background");
      if (bgLayer?.imageUrl) {
              Image.fromURL(bgLayer.imageUrl).then((img: any) => {
            img.scaleToWidth(canvas.width!);
            canvas.backgroundImage = img;
            canvas.renderAll();
          });
      }
    }

    // Add product image
    if (layers?.find((l) => l.layerType === "product_image")) {
      const imgLayer = layers.find((l) => l.layerType === "product_image");
      if (imgLayer?.imageUrl) {
        Image.fromURL(imgLayer.imageUrl).then((img: any) => {
          img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 });
          canvas.add(img);
          canvas.renderAll();
        });
      }
    }

    // Add text layers
    const titleLayer = layers?.find((l) => l.layerType === "text_title");
    if (titleLayer?.textContent) {
      const text = new Text(titleLayer.textContent, {
        left: 50,
        top: 400,
        fontSize: 32,
        fontWeight: "bold",
        fill: accentColor,
      });
      canvas.add(text);
    }

    const descLayer = layers?.find((l) => l.layerType === "text_description");
    if (descLayer?.textContent) {
      const text = new Text(descLayer.textContent, {
        left: 50,
        top: 450,
        fontSize: 16,
        fill: "#333333",
        width: 700,
      });
      canvas.add(text);
    }

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [layers, accentColor]);

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

    const dataUrl = fabricCanvasRef.current.toDataURL({ format: "png", quality: 0.95, multiplier: 1 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `card-${cardId}.png`;
    link.click();
    toast.success("Card exported!");
  };

  if (cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Card Editor</h1>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card className="p-4 bg-white">
              <canvas ref={canvasRef} className="w-full border border-slate-200 rounded" />
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Design</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accent-color" className="text-sm font-medium">
                    Accent Color
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCard} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Export</h2>
              <Button onClick={handleExportCard} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Card
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Layers</h2>
              <div className="space-y-2 text-sm">
                {layers?.map((layer) => (
                  <div key={layer.id} className="p-2 bg-slate-100 rounded flex items-center justify-between">
                    <span className="font-medium capitalize">{layer.layerType.replace(/_/g, " ")}</span>
                    <span className="text-xs px-2 py-1 bg-slate-200 rounded">{layer.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
