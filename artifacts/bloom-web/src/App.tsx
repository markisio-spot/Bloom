import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NotFound from "@/pages/not-found";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Lessons from "@/pages/lessons";
import Leaderboard from "@/pages/leaderboard";
import Shop from "@/pages/shop";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function Home() {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] bg-background text-foreground overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl md:text-8xl font-black text-primary mb-6 tracking-tighter leading-tight max-w-4xl">
          Grow Smarter <span className="text-secondary inline-block transform -rotate-2">Every Day.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 font-medium">
          Bloom is the gamified learning platform where students aged 5–18 master new skills, earn coins, collect rare animals, and climb the ranks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl hover:-translate-y-1 transition-transform">
              Start Learning for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2 hover:-translate-y-1 transition-transform">
              Log In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-primary/5 py-24 px-4 border-y border-primary/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-primary font-black text-3xl shadow-lg transform rotate-3">1</div>
              <h3 className="text-2xl font-bold text-primary">Learn with AI</h3>
              <p className="text-muted-foreground font-medium text-lg">Personalized lessons in Math, History, Languages and more. The questions adapt to your level.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg transform -rotate-3">2</div>
              <h3 className="text-2xl font-bold text-primary">Earn & Collect</h3>
              <p className="text-muted-foreground font-medium text-lg">Earn coins for every correct answer. Spend them in the shop to collect rare animals.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-destructive rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg transform rotate-6">3</div>
              <h3 className="text-2xl font-bold text-primary">Keep the Streak</h3>
              <p className="text-muted-foreground font-medium text-lg">Log in daily to grow your seedling avatar into a full bloom and dominate the leaderboard.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/lessons" component={Lessons} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/shop" component={Shop} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
