import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Terminal from "@/pages/Terminal";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AuthModal from "@/components/auth/AuthModal";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

function Router() {
  const [activeTab, setActiveTab] = useState<"terminal" | "history" | "settings">("terminal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { showAuthModal, isAuthenticated } = useAuthStore();

  // Close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden bg-bg-light dark:bg-bg-dark">
          <Switch>
            <Route path="/" component={() => {
              if (activeTab === "terminal") return <Terminal />;
              if (activeTab === "history") return <History setActiveTab={setActiveTab} />;
              if (activeTab === "settings") return <Settings />;
              return null;
            }} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      {showAuthModal && !isAuthenticated && <AuthModal />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
