import { useEffect, useState } from "react";
import CommandInput from "@/components/kubernetes/CommandInput";
import OutputTerminal from "@/components/kubernetes/OutputTerminal";
import { useKubernetesStore } from "@/store/useKubernetesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

export default function Terminal() {
  const [commandInput, setCommandInput] = useState("");
  const [isLoadingPods, setIsLoadingPods] = useState(false);
  const { 
    outputResults, 
    addOutputResult, 
    currentNamespace, 
    setCurrentNamespace, 
    namespaces, 
    currentContext, 
    setCurrentContext,
    contexts,
    setContexts,
    pods,
    currentPod,
    setCurrentPod,
    loadPods,
    loadContexts,
    loadNamespaces
  } = useKubernetesStore();
  const { isAuthenticated, setShowAuthModal } = useAuthStore();
  const { toast } = useToast();

  // Load pods when component mounts
  useEffect(() => {
    const fetchPods = async () => {
      setIsLoadingPods(true);
      try {
        await loadPods();
      } catch (error) {
        console.error("Failed to load pods:", error);
      } finally {
        setIsLoadingPods(false);
      }
    };

    fetchPods();
  }, [loadPods]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    try {
      const res = await apiRequest("POST", "/api/kubernetes/execute", {
        command,
        namespace: currentNamespace,
        context: currentContext,
        pod: currentPod
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

  const handleRefreshPods = async () => {
    setIsLoadingPods(true);
    try {
      await loadPods();
      toast({
        title: "Pods refreshed",
        description: `Found ${pods.length} pods in namespace ${currentNamespace}`,
      });
    } catch (error) {
      toast({
        title: "Failed to refresh pods",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPods(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Context, Namespace, and Pod selectors */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center">
          <span className="mr-2">Context:</span>
          <Select value={currentContext} onValueChange={setCurrentContext}>
            <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Select context" />
            </SelectTrigger>
            <SelectContent>
              {contexts.map((ctx) => (
                <SelectItem 
                  key={ctx.name} 
                  value={ctx.name} 
                  disabled={!ctx.available}
                  className={!ctx.available ? 'text-red-500 cursor-not-allowed' : ''}
                >
                  {ctx.name} {!ctx.available && '(unavailable)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={async () => {
                await loadContexts();
                if (currentContext) {
                  await loadNamespaces(currentContext);
                }
              }}
              className="h-9 w-9"
              title="Refresh contexts"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/kubernetes/contexts?useKubeconfig=true');
                  const contexts = await response.json();
                  setContexts(contexts);
                  await loadNamespaces(currentContext);
                } catch (error) {
                  console.error('Failed to load contexts:', error);
                }
              }}
              className="h-9"
              title="Load from kubeconfig"
            >
              Load kubeconfig
            </Button>
          </div>
        </div>

        <div className="flex items-center">
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
        </div>

        <div className="flex items-center">
          <span className="mr-2">Pod:</span>
          <div className="flex items-center gap-2">
            <Select 
              value={currentPod || "none"} 
              onValueChange={(pod) => setCurrentPod(pod === "none" ? null : pod)}
            >
              <SelectTrigger className="w-[220px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="Select pod (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No pod selected</SelectItem>
                {pods.map((pod) => (
                  <SelectItem key={pod} value={pod}>{pod}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefreshPods}
              disabled={isLoadingPods}
              title="Refresh pods list"
              className="h-9 w-9"
            >
              <RefreshCw 
                className={`h-4 w-4 ${isLoadingPods ? 'animate-spin' : ''}`} 
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Command Input */}
      <CommandInput 
        value={commandInput} 
        onChange={setCommandInput}
        onExecute={executeCommand}
        isAuthenticated={isAuthenticated}
        onAuthClick={() => setShowAuthModal(true)}
        selectedPod={currentPod}
      />

      {/* Output Terminal */}
      <OutputTerminal 
        results={outputResults} 
        onClear={() => useKubernetesStore.setState({ outputResults: [] })}
      />
    </div>
  );
}