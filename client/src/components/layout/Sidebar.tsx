import { Button } from "@/components/ui/button";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  activeTab: "terminal" | "history" | "settings";
  setActiveTab: (tab: "terminal" | "history" | "settings") => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const { 
    commandHistory, 
    executeQuickCommand, 
    currentContext, 
    setCurrentContext, 
    contexts 
  } = useKubernetesStore();
  const { isAuthenticated } = useAuthStore();

  // Close sidebar on smaller screens when clicking away
  const handleClickAway = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <aside
      className={`w-64 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col z-10 ${
        isOpen ? "block" : "hidden"
      } ${isOpen ? "fixed md:relative inset-y-0 left-0 md:translate-x-0" : ""}`}
    >
      <nav className="p-4 flex flex-col flex-1 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </h2>
          <ul className="space-y-1">
            <li>
              <Button
                variant={activeTab === "terminal" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("terminal")}
              >
                <i className={`fas fa-terminal w-5 mr-3 ${
                  activeTab === "terminal" ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`}></i>
                <span>Terminal</span>
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "history" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("history")}
              >
                <i className={`fas fa-history w-5 mr-3 ${
                  activeTab === "history" ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`}></i>
                <span>Command History</span>
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <i className={`fas fa-cog w-5 mr-3 ${
                  activeTab === "settings" ? "text-white" : "text-gray-500 dark:text-gray-400"
                }`}></i>
                <span>Settings</span>
              </Button>
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <ul className="space-y-1">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => executeQuickCommand("kubectl get pods")}
                disabled={!isAuthenticated}
              >
                <i className="fas fa-cube w-5 mr-3 text-gray-500 dark:text-gray-400"></i>
                <span>Get Pods</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => executeQuickCommand("kubectl get services")}
                disabled={!isAuthenticated}
              >
                <i className="fas fa-network-wired w-5 mr-3 text-gray-500 dark:text-gray-400"></i>
                <span>Get Services</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => executeQuickCommand("kubectl get deployments")}
                disabled={!isAuthenticated}
              >
                <i className="fas fa-rocket w-5 mr-3 text-gray-500 dark:text-gray-400"></i>
                <span>Get Deployments</span>
              </Button>
            </li>
          </ul>
        </div>
        
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Recent Commands
            </h2>
            <ul className="space-y-1">
              {commandHistory.length > 0 ? (
                commandHistory.slice(0, 5).map((cmd, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      useKubernetesStore.setState({ commandInput: cmd.command });
                      setActiveTab("terminal");
                    }}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md overflow-hidden flex items-start"
                  >
                    <div
                      className={`flex-1 truncate terminal-text ${
                        cmd.status === "success"
                          ? "text-green-600 dark:text-green-400"
                          : cmd.status === "error"
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {cmd.command}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-gray-500 italic">No command history</li>
              )}
            </ul>
          </div>
        )}
      </nav>
      
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Context Selector</div>
        <div className="relative">
          <Select value={currentContext} onValueChange={setCurrentContext}>
            <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Select context" />
            </SelectTrigger>
            <SelectContent>
              {contexts.map((ctx) => (
                <SelectItem key={ctx} value={ctx}>{ctx}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}
