import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground h-16 flex items-center px-4 md:px-6">
        <Link href={user ? "/dashboard" : "/"} className="font-bold text-2xl tracking-tight text-secondary">
          Bloom
        </Link>
        
        <div className="flex-1" />

        {user ? (
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className={`text-sm font-medium hover:text-secondary transition-colors ${location === '/dashboard' ? 'text-secondary' : 'text-primary-foreground'}`}>
              Dashboard
            </Link>
            <Link href="/lessons" className={`text-sm font-medium hover:text-secondary transition-colors ${location === '/lessons' ? 'text-secondary' : 'text-primary-foreground'}`}>
              Learn
            </Link>
            <Link href="/leaderboard" className={`text-sm font-medium hover:text-secondary transition-colors ${location === '/leaderboard' ? 'text-secondary' : 'text-primary-foreground'}`}>
              Leaderboard
            </Link>
            <Link href="/shop" className={`text-sm font-medium hover:text-secondary transition-colors ${location === '/shop' ? 'text-secondary' : 'text-primary-foreground'}`}>
              Shop
            </Link>
            <Link href="/profile" className={`text-sm font-medium hover:text-secondary transition-colors ${location === '/profile' ? 'text-secondary' : 'text-primary-foreground'}`}>
              Profile
            </Link>
            <Button variant="secondary" size="sm" onClick={logout} className="ml-4 font-bold text-primary">
              Log out
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/90 hover:text-secondary">Log in</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="font-bold text-primary">Sign up</Button>
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
