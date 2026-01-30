import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Image, Edit, Trash2, Download, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Cards() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: cards, isLoading } = trpc.cards.list.useQuery();

  const deleteCard = trpc.cards.delete.useMutation({
    onSuccess: () => {
      toast.success("Card deleted successfully");
      utils.cards.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete card: " + error.message);
    },
  });

  const handleExport = async (cardId: number, finalImageUrl: string | null) => {
    if (finalImageUrl) {
      // Download the final image
      const link = document.createElement("a");
      link.href = finalImageUrl;
      link.download = `card-${cardId}.png`;
      link.click();
    } else {
      // Open editor to generate the card
      setLocation(`/editor/${cardId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your generated product cards.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : cards?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No cards yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Generate cards from your products to see them here.
            </p>
            <Button onClick={() => setLocation("/products")}>Go to Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card) => (
            <Card key={card.id} className="overflow-hidden group">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-slate-100 to-slate-200">
                {card.finalImageUrl ? (
                  <img
                    src={card.finalImageUrl}
                    alt={`Card ${card.id}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Preview not available</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setLocation(`/editor/${card.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleExport(card.id, card.finalImageUrl)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Card #{card.id}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      card.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : card.status === "processing"
                        ? "bg-blue-100 text-blue-700"
                        : card.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {card.marketingCopy || "No marketing copy generated"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: card.accentColor || "#3B82F6" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {card.accentColor || "#3B82F6"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCard.mutate({ id: card.id })}
                    disabled={deleteCard.isPending}
                  >
                    {deleteCard.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
