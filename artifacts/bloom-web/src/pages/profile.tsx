import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateMe, useGetProgress, useClaimMonthlyGift, getGetProgressQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeedlingAvatar } from "@/components/seedling-avatar";
import { useToast } from "@/hooks/use-toast";
import { Gift, Edit2, Loader2, BookOpen } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");

  const { data: progressData, isLoading: isProgressLoading } = useGetProgress({
    query: { queryKey: getGetProgressQueryKey(), enabled: !!user }
  });

  const updateMutation = useUpdateMe({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated successfully." });
        setIsEditing(false);
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Update failed", description: error.error });
      }
    }
  });

  const claimGiftMutation = useClaimMonthlyGift({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Gift Claimed!", description: `You received ${data.coins} coins!` });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Failed to claim", description: error.error });
      }
    }
  });

  const handleSaveProfile = () => {
    if (!displayName.trim()) return;
    updateMutation.mutate({ data: { displayName } });
  };

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 7);
  const canClaimGift = !user.lastGiftDate || !user.lastGiftDate.startsWith(today);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Avatar & Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center shadow-md border-primary/10 bg-white">
            <CardContent className="pt-8 pb-6 flex flex-col items-center space-y-6">
              <div className="w-48 h-48 bg-muted/20 rounded-full border-4 border-border shadow-inner p-4 relative">
                <SeedlingAvatar coins={user.coins} avatarData={user.avatarData} className="w-full h-full" />
              </div>
              
              <div className="w-full">
                {isEditing ? (
                  <div className="space-y-3">
                    <Label className="text-left block text-sm font-bold text-muted-foreground">Display Name</Label>
                    <Input 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      className="text-center font-bold text-lg"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 font-bold" onClick={() => {setIsEditing(false); setDisplayName(user.displayName);}}>Cancel</Button>
                      <Button className="flex-1 font-bold" onClick={handleSaveProfile} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-extrabold text-primary">{user.displayName}</h2>
                    <p className="text-muted-foreground font-medium mt-1">@{user.username}</p>
                    <Button variant="outline" size="sm" className="mt-4 font-bold text-xs uppercase tracking-wider" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-3 h-3 mr-2" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 transition-opacity ${canClaimGift ? "opacity-100" : "opacity-55"}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Gift className="w-5 h-5 text-indigo-500" />
                {canClaimGift ? "Monthly Gift" : "Monthly Gift Claimed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-700/80 mb-4 font-medium">
                {canClaimGift
                  ? "Claim your free monthly coin boost to help buy more rare animals!"
                  : "You've already claimed your gift this month. Come back next month!"}
              </p>
              <Button
                onClick={() => claimGiftMutation.mutate({})}
                disabled={!canClaimGift || claimGiftMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-70"
              >
                {canClaimGift ? "Claim Gift" : "✓ Already Claimed"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress Stats */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md border-primary/10 h-full">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
              <CardTitle className="text-2xl font-extrabold text-primary flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-secondary" /> Learning Progress
              </CardTitle>
              <CardDescription className="text-md">Your journey across different subjects.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isProgressLoading ? (
                <div className="p-12 text-center text-muted-foreground font-medium">Loading progress...</div>
              ) : !progressData || progressData.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-medium">
                  No progress yet. Start a lesson to track your journey!
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {progressData.map((prog) => (
                    <div key={prog.subject} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div>
                        <h3 className="text-lg font-bold capitalize text-primary">{prog.subject}</h3>
                        <p className="text-sm text-muted-foreground font-medium mt-1">Level {prog.currentLevel}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-secondary">{prog.highestScore}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
