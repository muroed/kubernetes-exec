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
      setCurrentNamespace: (namespace) => set({ currentNamespace: namespace }),
      
      namespaces: ['default', 'kube-system', 'kube-public'],
      setNamespaces: (namespaces) => set({ namespaces }),
      
      currentContext: 'minikube',
      setCurrentContext: (context) => set({ currentContext: context }),
      
      contexts: ['minikube', 'docker-desktop', 'production'],
      setContexts: (contexts) => set({ contexts }),
      
      executeQuickCommand: async (command) => {
        try {
          const res = await apiRequest('POST', '/api/kubernetes/execute', {
            command,
            namespace: get().currentNamespace,
            context: get().currentContext,
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
      }),
    }
  )
);
