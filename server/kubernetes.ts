import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Function to validate a kubectl command
function validateCommand(command: string): boolean {
  // Only allow kubectl commands
  if (!command.trim().startsWith("kubectl")) {
    return false;
  }
  
  // Blacklist dangerous commands
  const dangerousPatterns = [
    /;\s*rm\s/i,        // Prevent command injection with rm
    /;\s*wget\s/i,       // Prevent downloads
    /;\s*curl\s/i,       // Prevent downloads
    /;\s*>\s*/i,         // Prevent output redirection
    /;\s*<\s*/i,         // Prevent input redirection
    /\|\s*rm\s/i,        // Prevent piping to rm
    /\|\s*bash\s/i,      // Prevent piping to bash
    /--kubeconfig/i,     // Prevent custom kubeconfig
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(command));
}

// Function to execute a kubectl command
export async function executeKubernetesCommand(
  command: string,
  namespace = "default",
  context = "minikube"
): Promise<{ output: string; error: string }> {
  // Validate command
  if (!validateCommand(command)) {
    return {
      output: "",
      error: "Invalid or potentially dangerous command",
    };
  }
  
  try {
    // Add namespace and context flags if not already in the command
    let fullCommand = command;
    
    if (!fullCommand.includes("--namespace") && !fullCommand.includes("-n ")) {
      fullCommand += ` --namespace=${namespace}`;
    }
    
    if (!fullCommand.includes("--context")) {
      fullCommand += ` --context=${context}`;
    }
    
    // Set a timeout for command execution
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
      // Handle exec errors
      errorMessage = (error as { stderr: string }).stderr;
    }
    
    return {
      output: "",
      error: errorMessage,
    };
  }
}

// Function to get Kubernetes contexts
export async function getContexts(): Promise<string[]> {
  try {
    // In a real implementation, you would use the kubernetes client to get the contexts
    // For this demo, we'll return a static list
    const { stdout } = await execAsync("kubectl config get-contexts -o name");
    return stdout.trim().split("\n").filter(Boolean);
  } catch (error) {
    // If command fails, return default contexts
    return ["minikube", "docker-desktop", "production"];
  }
}

// Function to get namespaces for a given context
export async function getNamespaces(context: string): Promise<string[]> {
  try {
    // In a real implementation, you would use the kubernetes client to get the namespaces
    // For this demo, we'll return a static list
    const { stdout } = await execAsync(`kubectl get namespaces --context=${context} -o name`);
    return stdout
      .trim()
      .split("\n")
      .map(ns => ns.replace("namespace/", ""))
      .filter(Boolean);
  } catch (error) {
    // If command fails, return default namespaces
    return ["default", "kube-system", "kube-public"];
  }
}
