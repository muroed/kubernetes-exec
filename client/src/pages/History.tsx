import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface HistoryProps {
  setActiveTab: (tab: "terminal" | "history" | "settings") => void;
}

export default function History({ setActiveTab }: HistoryProps) {
  const { isAuthenticated } = useAuthStore();
  const { setCommandInput } = useKubernetesStore();
  const { toast } = useToast();
  
  const { data: commandHistory = [], refetch } = useQuery<Command[]>({
    queryKey: ["/api/kubernetes/history"],
    enabled: isAuthenticated,
  });

  const clearHistory = async () => {
    try {
      await apiRequest("DELETE", "/api/kubernetes/history/clear", {});
      toast({
        title: "History cleared",
        description: "Command history has been cleared successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to clear history",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const runCommand = (command: string) => {
    setCommandInput(command);
    setActiveTab("terminal");
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Command History</h2>
      
      <Card>
        <CardHeader className="bg-gray-50 dark:bg-gray-800 flex flex-row items-center justify-between py-3">
          <div className="font-medium">Recent Commands</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearHistory}
            disabled={commandHistory.length === 0}
          >
            <i className="fas fa-trash-alt mr-1"></i>
            Clear History
          </Button>
        </CardHeader>
        
        <CardContent className="p-0 divide-y divide-border">
          {commandHistory.length > 0 ? (
            commandHistory.map((cmd) => (
              <div key={cmd.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      cmd.status === "success" 
                        ? "bg-success/20" 
                        : cmd.status === "error" 
                        ? "bg-error/20" 
                        : "bg-warning/20"
                    }`}>
                      <i className={`fas ${
                        cmd.status === "success" 
                          ? "fa-check text-success" 
                          : cmd.status === "error" 
                          ? "fa-times text-error" 
                          : "fa-spinner fa-spin text-warning"
                      } text-xs`}></i>
                    </div>
                    <div className="terminal-text font-medium">{cmd.command}</div>
                  </div>
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => runCommand(cmd.command)}
                            className="text-primary hover:text-secondary mr-2"
                          >
                            <i className="fas fa-redo"></i>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Run this command again</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(cmd.executedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {(cmd.output || cmd.error) && (
                  <div className="mt-2 pl-9">
                    {cmd.output && (
                      <div className="terminal-text text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <div className="truncate">
                          {cmd.output.length > 100 ? `${cmd.output.substring(0, 100)}...` : cmd.output}
                        </div>
                      </div>
                    )}
                    {cmd.error && (
                      <div className="terminal-text text-sm text-error bg-error/10 p-2 rounded">
                        <div className="truncate">{cmd.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <i className="fas fa-history text-3xl mb-2"></i>
              <p>No command history yet</p>
              <p className="text-sm mt-1">Execute commands in the terminal to see them here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
