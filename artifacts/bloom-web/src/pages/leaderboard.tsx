import { useGetLeaderboard, useGetFriendsLeaderboard, getGetLeaderboardQueryKey, getGetFriendsLeaderboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeedlingAvatar } from "@/components/seedling-avatar";
import { Trophy, Medal, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Leaderboard() {
  const { user } = useAuth();
  
  const { data: globalData, isLoading: isGlobalLoading } = useGetLeaderboard({
    query: { queryKey: getGetLeaderboardQueryKey() }
  });

  const { data: friendsData, isLoading: isFriendsLoading } = useGetFriendsLeaderboard({
    query: { queryKey: getGetFriendsLeaderboardQueryKey() }
  });

  const renderList = (entries: any[] | undefined, isLoading: boolean) => {
    if (isLoading) return <div className="text-center py-12 text-muted-foreground font-medium">Loading rankings...</div>;
    if (!entries || entries.length === 0) return <div className="text-center py-12 text-muted-foreground font-medium">No entries yet.</div>;

    return (
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const isCurrentUser = user?.id === entry.userId;
          let RankIcon = null;
          if (index === 0) RankIcon = <Crown className="w-8 h-8 text-yellow-500" />;
          else if (index === 1) RankIcon = <Medal className="w-8 h-8 text-gray-400" />;
          else if (index === 2) RankIcon = <Medal className="w-8 h-8 text-amber-600" />;

          return (
            <Card key={entry.userId} className={`overflow-hidden transition-all ${isCurrentUser ? 'border-primary bg-primary/5 shadow-md' : 'hover-elevate bg-card border-border'}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 text-center font-black text-2xl text-muted-foreground">
                  {RankIcon ? RankIcon : `#${index + 1}`}
                </div>
                
                <div className="w-16 h-16 shrink-0 bg-white rounded-full overflow-hidden border-2 border-border shadow-sm flex items-center justify-center">
                  <SeedlingAvatar coins={entry.coins} avatarData={entry.avatarData} className="w-14 h-14" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate">
                    {entry.displayName} {isCurrentUser && <span className="text-sm font-normal text-primary ml-2">(You)</span>}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-medium text-yellow-600">
                      <span className="font-bold">{entry.coins}</span> coins
                    </span>
                    <span className="flex items-center gap-1 font-medium text-orange-600">
                      <span className="font-bold">{entry.streakCount}</span> streak
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-primary">
                    {entry.animalCount}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Animals</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Hall of Fame</h1>
        <p className="text-muted-foreground text-lg">Ranked by unique animals collected.</p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl h-14">
          <TabsTrigger value="global" className="text-md font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Global Top 50</TabsTrigger>
          <TabsTrigger value="friends" className="text-md font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Friends Only</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          {renderList(globalData, isGlobalLoading)}
        </TabsContent>
        
        <TabsContent value="friends">
          {renderList(friendsData, isFriendsLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
