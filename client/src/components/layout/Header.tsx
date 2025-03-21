import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ toggleSidebar, sidebarOpen }: HeaderProps) {
  const { isAuthenticated, logout, setShowAuthModal } = useAuthStore();
  const { currentContext, currentNamespace } = useKubernetesStore();
  const { darkMode, setDarkMode } = useSettingsStore();
  
  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <header className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 md:mr-4"
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars"></i>
          </Button>
          <div className="flex items-center">
            <i className="fas fa-dharmachakra text-primary text-2xl mr-2"></i>
            <h1 className="text-xl font-bold">KubeCLI</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
            <i className="fas fa-server text-xs text-gray-500 dark:text-gray-400 mr-1"></i>
            <span className="text-sm">{currentContext}</span>
            <span className="mx-1 text-gray-400">|</span>
            <i className="fas fa-layer-group text-xs text-gray-500 dark:text-gray-400 mr-1"></i>
            <span className="text-sm">{currentNamespace}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
          </Button>
          
          {!isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="flex items-center"
            >
              <i className="fas fa-sign-in-alt mr-1"></i>
              <span className="hidden md:inline">Login</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center"
            >
              <i className="fas fa-sign-out-alt mr-1"></i>
              <span className="hidden md:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
