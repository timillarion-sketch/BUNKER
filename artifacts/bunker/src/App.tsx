import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import { BottomNav }   from "@/components/layout/BottomNav";
import Login           from "@/pages/Login";
import PromptFeed      from "@/pages/PromptFeed";
import Characters      from "@/pages/Characters";
import Chat            from "@/pages/Chat";
import Browser         from "@/pages/Browser";
import ChatsList       from "@/pages/ChatsList";
import Feed            from "@/pages/Feed";
import Profile         from "@/pages/Profile";
import NotFound        from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <main className="mx-auto max-w-md bg-black min-h-screen shadow-2xl relative overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      {children}
      <BottomNav />
    </ProtectedLayout>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Switch>
      {/* ── Facade home ── */}
      <Route path="/">
        <MainLayout><PromptFeed /></MainLayout>
      </Route>

      {/* ── Secret: AI Lobby — accessed via long press on ПРОМПТЫ header ── */}
      <Route path="/lobby">
        <MainLayout><Characters /></MainLayout>
      </Route>

      {/* ── Visible tabs ── */}
      <Route path="/browser">
        <MainLayout><Browser /></MainLayout>
      </Route>
      <Route path="/chats">
        <MainLayout><ChatsList /></MainLayout>
      </Route>
      <Route path="/feed">
        <MainLayout><Feed /></MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout><Profile /></MainLayout>
      </Route>

      {/* ── Detail views (no nav bar) ── */}
      <Route path="/chat/:id">
        <ProtectedLayout><Chat /></ProtectedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
