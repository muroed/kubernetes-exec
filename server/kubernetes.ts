import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Cache for config
let configCache = {
  contextStatus: {} as Record<string, boolean>
};

// Function to check if context is available
async function checkContextAvailability(context: string): Promise<boolean> {
  try {
    await execAsync(`kubectl cluster-info --context=${context}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get contexts from kubeconfig
async function getContextsFromKubeconfig(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('kubectl config get-contexts -o name');
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error reading kubeconfig contexts:', error);
    return [];
  }
}

// Function to get namespaces from cluster
async function getNamespacesFromCluster(context: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`kubectl get namespaces --context=${context} -o name`);
    return stdout
      .trim()
      .split('\n')
      .map(ns => ns.replace('namespace/', ''));
  } catch (error) {
    console.error('Error getting namespaces:', error);
    return ["default", "kube-system", "kube-public"];
  }
}

// Function to get Kubernetes contexts
export async function getContexts(): Promise<Array<{name: string; available: boolean}>> {
  try {
    const contexts = await getContextsFromKubeconfig();
    return contexts.map(context => ({
      name: context,
      available: configCache.contextStatus[context] || false
    }));
  } catch (error) {
    console.error('Error reading contexts:', error);
    return [];
  }
}

// Function to get namespaces for a given context
export async function getNamespaces(context: string): Promise<string[]> {
  try {
    return await getNamespacesFromCluster(context);
  } catch (error) {
    console.error('Error reading namespaces:', error);
    return ["default", "kube-system", "kube-public"];
  }
}

// Function to get pods for a given namespace and context
export async function getPods(namespace: string, context: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`kubectl get pods --namespace=${namespace} --context=${context} -o name`);
    return stdout
      .trim()
      .split("\n")
      .map(pod => pod.replace("pod/", ""))
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting pods:', error);
    return [];
  }
}

// Function to execute a kubectl command
export async function executeKubernetesCommand(
  command: string,
  namespace = "default",
  context = "",
  pod: string | null = null
): Promise<{ output: string; error: string }> {
  // Validate command
  if (!validateCommand(command)) {
    return {
      output: "",
      error: "Invalid or potentially dangerous command",
    };
  }

  try {
    let fullCommand: string;

    if (pod && !command.startsWith('exec')) {
      fullCommand = `kubectl exec -i ${pod} --namespace=${namespace} --context=${context} -- ${command}`;
    } else {
      fullCommand = command;

      if (!fullCommand.includes("--namespace") && !fullCommand.includes("-n ")) {
        fullCommand += ` --namespace=${namespace}`;
      }

      if (!fullCommand.includes("--context")) {
        fullCommand += ` --context=${context}`;
      }
    }

    const { stdout, stderr } = await execAsync(fullCommand, { timeout: 10000 });

    return {
      output: stdout,
      error: stderr,
    };
  } catch (error) {
    let errorMessage = "Command execution failed";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "stderr" in error) {
      errorMessage = (error as { stderr: string }).stderr;
    }

    return {
      output: "",
      error: errorMessage,
    };
  }
}

// Function to validate a kubectl command
function validateCommand(command: string): boolean {
  if (!command.trim().startsWith("kubectl")) {
    return false;
  }

  const dangerousPatterns = [
    /;\s*rm\s/i,
    /;\s*wget\s/i,
    /;\s*curl\s/i,
    /;\s*>\s*/i,
    /;\s*<\s*/i,
    /\|\s*rm\s/i,
    /\|\s*bash\s/i,
    /--kubeconfig/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(command));
}