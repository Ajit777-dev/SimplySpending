import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Spending from "@/pages/Spending";
import NotFound from "@/pages/not-found";

// Always dark mode by default
if (typeof document !== "undefined") {
  document.documentElement.classList.add("dark");
}

function Router() {
  return (
    <div className="flex flex-col min-h-dvh max-w-lg mx-auto relative">
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Spending} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
