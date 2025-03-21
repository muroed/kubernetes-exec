import { useEffect, useState } from "react";
import CommandInput from "@/components/kubernetes/CommandInput";
import OutputTerminal from "@/components/kubernetes/OutputTerminal";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Terminal() {
  const [commandInput, setCommandInput] = useState("");
  const { 
    outputResults, 
    addOutputResult, 
    currentNamespace, 
    setCurrentNamespace, 
    namespaces, 
    currentContext, 
    contexts
  } = useKubernetesStore();
  const { isAuthenticated, setShowAuthModal } = useAuthStore();
  const { toast } = useToast();

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await apiRequest("POST", "/api/kubernetes/execute", {
        command,
        namespace: currentNamespace,
        context: currentContext
      });
      
      const result = await res.json();
      
      addOutputResult({
        command,
        output: result.output || "",
        error: result.error || ""
      });
      
      setCommandInput("");
      
    } catch (error) {
      toast({
        title: "Command execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });

      addOutputResult({
        command,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Namespace Selector */}
      <div className="mb-4 flex items-center text-sm">
        <span className="mr-2">Namespace:</span>
        <Select value={currentNamespace} onValueChange={setCurrentNamespace}>
          <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Select namespace" />
          </SelectTrigger>
          <SelectContent>
            {namespaces.map((ns) => (
              <SelectItem key={ns} value={ns}>{ns}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="ml-4 mr-2">Context:</span>
        <Select value={currentContext} onValueChange={(context) => useKubernetesStore.setState({ currentContext: context })}>
          <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Select context" />
          </SelectTrigger>
          <SelectContent>
            {contexts.map((ctx) => (
              <SelectItem key={ctx} value={ctx}>{ctx}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Command Input */}
      <CommandInput 
        value={commandInput} 
        onChange={setCommandInput}
        onExecute={executeCommand}
        isAuthenticated={isAuthenticated}
        onAuthClick={() => setShowAuthModal(true)}
      />
      
      {/* Output Terminal */}
      <OutputTerminal 
        results={outputResults} 
        onClear={() => useKubernetesStore.setState({ outputResults: [] })}
      />
    </div>
  );
}
