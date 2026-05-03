import { useListAnimals, useGetOwnedAnimals, usePurchaseAnimal, useBuyStreakFreeze, getListAnimalsQueryKey, getGetOwnedAnimalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ShieldAlert, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: animals, isLoading: isLoadingAnimals } = useListAnimals({
    query: { queryKey: getListAnimalsQueryKey() }
  });

  const { data: ownedAnimals, isLoading: isLoadingOwned } = useGetOwnedAnimals({
    query: { queryKey: getGetOwnedAnimalsQueryKey() }
  });

  const purchaseMutation = usePurchaseAnimal({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Animal Purchased!",
          description: `You now own a ${data.animal.name} ${data.animal.emoji}`,
        });
        queryClient.invalidateQueries({ queryKey: getGetOwnedAnimalsQueryKey() });
        // Update user coins locally might be needed if not fully handled, but getMe is reliable
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Purchase failed",
          description: error.error || "Not enough coins or already owned.",
        });
      }
    }
  });

  const buyFreezeMutation = useBuyStreakFreeze({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Streak Freeze Purchased!",
          description: `You now have ${data.streakFreezes} streak freezes.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Purchase failed",
          description: error.error || "Not enough coins or max reached.",
        });
      }
    }
  });

  const handleBuyAnimal = (animalId: number) => {
    purchaseMutation.mutate({ data: { animalId } });
  };

  const handleBuyFreeze = () => {
    buyFreezeMutation.mutate({});
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-200';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ownedSet = new Set(ownedAnimals?.map(a => a.id) || []);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">The Safari Shop</h1>
          <p className="text-muted-foreground text-lg mt-1">Spend your hard-earned coins here.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-border flex items-center gap-3">
          <Coins className="w-6 h-6 text-yellow-500" />
          <span className="text-2xl font-black text-yellow-600">{user?.coins || 0}</span>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          Power-Ups
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate transition-all border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2 shadow-sm">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Streak Freeze</h3>
                <p className="text-sm text-blue-700/80 mt-1">Protects your streak if you miss one day of learning. Max 3.</p>
              </div>
              <Button 
                onClick={handleBuyFreeze} 
                disabled={buyFreezeMutation.isPending || (user?.streakFreezes || 0) >= 3}
                className="w-full mt-4 font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {buyFreezeMutation.isPending ? "Processing..." : "Buy for 50 Coins"}
              </Button>
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                Owned: {user?.streakFreezes || 0} / 3
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          Animals
        </h2>
        {isLoadingAnimals ? (
          <div className="text-center py-12 text-muted-foreground font-medium">Loading shop...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {animals?.map((animal) => {
              const isOwned = ownedSet.has(animal.id);
              
              return (
                <Card key={animal.id} className={`flex flex-col hover-elevate transition-all ${isOwned ? 'opacity-70 grayscale-[0.2]' : ''}`}>
                  <CardHeader className="pb-4 text-center">
                    <div className="text-6xl mb-4 py-6 bg-muted/30 rounded-xl">{animal.emoji}</div>
                    <CardTitle className="text-xl font-bold">{animal.name}</CardTitle>
                    <div className="flex justify-center mt-2">
                      <Badge className={`${getRarityColor(animal.rarity)} uppercase text-xs tracking-wider border font-bold`} variant="outline">
                        {animal.rarity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">{animal.description}</p>
                  </CardContent>
                  <CardFooter>
                    {isOwned ? (
                      <Button variant="secondary" className="w-full font-bold" disabled>
                        <Check className="w-4 h-4 mr-2" /> Owned
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleBuyAnimal(animal.id)}
                        disabled={purchaseMutation.isPending || (user?.coins || 0) < animal.cost}
                        className="w-full font-bold bg-primary text-white"
                      >
                        Buy for {animal.cost}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
