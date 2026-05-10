import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

import { BottomNav }          from "@/components/layout/BottomNav";
import Login                  from "@/pages/Login";
import Characters             from "@/pages/Characters";
import Chat                   from "@/pages/Chat";
import Browser                from "@/pages/Browser";
import ChatsList              from "@/pages/ChatsList";
import Feed                   from "@/pages/Feed";
import Profile                from "@/pages/Profile";
import PromptFeed             from "@/pages/PromptFeed";
import CharacterCustomizer    from "@/pages/CharacterCustomizer";
import NotFound               from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { bg } = useTheme();
  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30" style={{ background: bg }}>
      <main className="mx-auto max-w-md min-h-screen shadow-2xl relative overflow-x-hidden" style={{ background: bg }}>
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
  if (!isAuthenticated) return <Login />;

  return (
    <Switch>
      {/* ── Tab 1: Personnel ── */}
      <Route path="/">
        <MainLayout><Characters /></MainLayout>
      </Route>

      {/* ── Tab 2: Browser ── */}
      <Route path="/browser">
        <MainLayout><Browser /></MainLayout>
      </Route>

      {/* ── Tab 3: Chats ── */}
      <Route path="/chats">
        <MainLayout><ChatsList /></MainLayout>
      </Route>

      {/* ── Tab 4: Content & Factory ── */}
      <Route path="/feed">
        <MainLayout><Feed /></MainLayout>
      </Route>

      {/* ── Tab 5: Profile ── */}
      <Route path="/profile">
        <MainLayout><Profile /></MainLayout>
      </Route>

      {/* ── Prompts (accessed from Feed) ── */}
      <Route path="/prompts">
        <MainLayout><PromptFeed /></MainLayout>
      </Route>

      {/* ── Character Customizer ── */}
      <Route path="/character-create">
        <ProtectedLayout><CharacterCustomizer /></ProtectedLayout>
      </Route>

      {/* ── AI Chat (detail, no nav) ── */}
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
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
