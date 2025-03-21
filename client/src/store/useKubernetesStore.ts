import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';
import { Command } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface OutputResult {
  command: string;
  output: string;
  error: string;
}

interface KubernetesState {
  commandInput: string;
  setCommandInput: (command: string) => void;
  outputResults: OutputResult[];
  addOutputResult: (result: OutputResult) => void;
  clearOutputResults: () => void;
  commandHistory: Command[];
  setCommandHistory: (history: Command[]) => void;
  currentNamespace: string;
  setCurrentNamespace: (namespace: string) => void;
  namespaces: string[];
  setNamespaces: (namespaces: string[]) => void;
  currentContext: string;
  setCurrentContext: (context: string) => void;
  contexts: string[];
  setContexts: (contexts: string[]) => void;
  currentPod: string | null;
  setCurrentPod: (pod: string | null) => void;
  pods: string[];
  setPods: (pods: string[]) => void;
  loadPods: () => Promise<void>;
  executeQuickCommand: (command: string) => Promise<void>;
}

export const useKubernetesStore = create<KubernetesState>()(
  persist(
    (set, get) => ({
      commandInput: '',
      setCommandInput: (command) => set({ commandInput: command }),
      
      outputResults: [],
      addOutputResult: (result) => set((state) => ({ 
        outputResults: [...state.outputResults, result] 
      })),
      clearOutputResults: () => set({ outputResults: [] }),
      
      commandHistory: [],
      setCommandHistory: (history) => set({ commandHistory: history }),
      
      currentNamespace: 'default',
      setCurrentNamespace: (namespace) => {
        set({ currentNamespace: namespace, currentPod: null });
        // When namespace changes, reload pods
        get().loadPods();
      },
      
      namespaces: ['default', 'kube-system', 'kube-public'],
      setNamespaces: (namespaces) => set({ namespaces }),
      
      currentContext: 'minikube',
      setCurrentContext: (context) => {
        set({ currentContext: context, currentPod: null });
        // When context changes, reload pods
        get().loadPods();
      },
      
      contexts: ['minikube', 'docker-desktop', 'production'],
      setContexts: (contexts) => set({ contexts }),
      
      // Pod related state
      currentPod: null,
      setCurrentPod: (pod) => set({ currentPod: pod }),
      
      pods: [],
      setPods: (pods) => set({ pods }),
      
      // Load pods for current namespace and context
      loadPods: async () => {
        try {
          const { currentNamespace, currentContext } = get();
          const res = await apiRequest(
            'GET', 
            `/api/kubernetes/pods?namespace=${currentNamespace}&context=${currentContext}`
          );
          
          const pods = await res.json();
          set({ pods });
          
          // If the current pod is not in the list anymore, reset it
          if (get().currentPod && !pods.includes(get().currentPod)) {
            set({ currentPod: null });
          }
        } catch (error) {
          const toast = useToast();
          toast.toast({
            title: 'Failed to load pods',
            description: error instanceof Error ? error.message : 'Unknown error occurred',
            variant: 'destructive',
          });
          set({ pods: [] });
        }
      },
      
      executeQuickCommand: async (command) => {
        try {
          const { currentNamespace, currentContext, currentPod } = get();
          
          const res = await apiRequest('POST', '/api/kubernetes/execute', {
            command,
            namespace: currentNamespace,
            context: currentContext,
            pod: currentPod,
          });
          
          const result = await res.json();
          
          set((state) => ({ 
            outputResults: [...state.outputResults, {
              command,
              output: result.output || '',
              error: result.error || '',
            }] 
          }));
        } catch (error) {
          // Use destructured toast outside of component function
          const toast = useToast();
          toast.toast({
            title: 'Command execution failed',
            description: error instanceof Error ? error.message : 'Unknown error occurred',
            variant: 'destructive',
          });
          
          set((state) => ({ 
            outputResults: [...state.outputResults, {
              command,
              output: '',
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            }] 
          }));
        }
      },
    }),
    {
      name: 'kubecli-kubernetes',
      partialize: (state) => ({ 
        currentNamespace: state.currentNamespace,
        currentContext: state.currentContext,
        currentPod: state.currentPod,
      }),
    }
  )
);
