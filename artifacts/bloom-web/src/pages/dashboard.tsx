import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Flame, Coins, ShieldAlert, Target, BookOpen, GraduationCap, Globe, MessageSquare, PenTool } from "lucide-react";
import { useCheckInStreak } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

const SUBJECTS = [
  { id: "math", name: "Math", icon: <BookOpen className="h-6 w-6" />, color: "bg-blue-100 text-blue-700" },
  { id: "grammar", name: "Grammar", icon: <PenTool className="h-6 w-6" />, color: "bg-purple-100 text-purple-700" },
  { id: "history", name: "History", icon: <GraduationCap className="h-6 w-6" />, color: "bg-amber-100 text-amber-700" },
  { id: "geography", name: "Geography", icon: <Globe className="h-6 w-6" />, color: "bg-green-100 text-green-700" },
  { id: "french", name: "French", icon: <MessageSquare className="h-6 w-6" />, color: "bg-red-100 text-red-700" },
  { id: "spanish", name: "Spanish", icon: <MessageSquare className="h-6 w-6" />, color: "bg-orange-100 text-orange-700" },
  { id: "maltese", name: "Maltese", icon: <MessageSquare className="h-6 w-6" />, color: "bg-rose-100 text-rose-700" },
  { id: "italian", name: "Italian", icon: <MessageSquare className="h-6 w-6" />, color: "bg-teal-100 text-teal-700" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const checkInMutation = useCheckInStreak({
    mutation: {
      onSuccess: (data) => {
        if (data.isNewDay) {
          toast({
            title: "Streak updated!",
            description: `You are on a ${data.streakCount} day streak! Keep it up!`,
          });
        }
      }
    }
  });

  const hasCheckedInRef = useRef(false);

  useEffect(() => {
    if (user && !hasCheckedInRef.current) {
      checkInMutation.mutate({});
      hasCheckedInRef.current = true;
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Welcome back, {user.displayName}!</h1>
          <p className="text-muted-foreground mt-2 text-lg">Ready to grow your mind today?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover-elevate">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-1">Current Streak</p>
              <p className="text-4xl font-black text-orange-700 flex items-center gap-2">
                {user.streakCount} <span className="text-2xl text-orange-500">days</span>
              </p>
            </div>
            <div className="h-16 w-16 bg-orange-200 rounded-full flex items-center justify-center text-orange-500">
              <Flame className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover-elevate">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-1">Coin Balance</p>
              <p className="text-4xl font-black text-yellow-700 flex items-center gap-2">
                {user.coins}
              </p>
            </div>
            <div className="h-16 w-16 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-500">
              <Coins className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover-elevate">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Streak Freezes</p>
              <p className="text-4xl font-black text-blue-700 flex items-center gap-2">
                {user.streakFreezes} <span className="text-2xl text-blue-500">/ 3</span>
              </p>
            </div>
            <div className="h-16 w-16 bg-blue-200 rounded-full flex items-center justify-center text-blue-500">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Target className="h-6 w-6 text-secondary" /> Jump into a Subject
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUBJECTS.map((subject) => (
            <Link key={subject.id} href={`/lessons?subject=${subject.id}`}>
              <Card className="cursor-pointer hover-elevate transition-all border-border/50 overflow-hidden group h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${subject.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {subject.icon}
                  </div>
                  <span className="font-bold text-lg text-primary">{subject.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
