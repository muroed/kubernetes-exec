import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { watchFile } from "fs";

const execAsync = promisify(exec);
const configPath = path.join(process.cwd(), 'k8s-config.json');

// Cache for config
let configCache = {
  contexts: [] as string[],
  namespaces: {} as Record<string, string[]>,
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

// Function to load config on startup
async function loadConfigOnStartup() {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    configCache.contexts = config.contexts || [];
    configCache.namespaces = config.namespaces || {};
    
    // Check availability for each context
    for (const context of configCache.contexts) {
      configCache.contextStatus[context] = await checkContextAvailability(context);
    }
    
    console.log('K8s config loaded on startup');
  } catch (error) {
    console.error('Error loading k8s config:', error);
  }
}

// Load config on startup
loadConfigOnStartup();

// Watch k8s-config.json for changes
const configPath = path.join(process.cwd(), 'k8s-config.json');
watchFile(configPath, async (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(fileContent);
      configCache = {
        contexts: config.contexts || [],
        namespaces: config.namespaces || {}
      };
      console.log('K8s config updated');
    } catch (error) {
      console.error('Error updating k8s config:', error);
    }
  }
});

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
  context = "minikube",
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
      // If a pod is specified and the command isn't already an exec command,
      // create an exec command to run inside the pod
      fullCommand = `kubectl exec -i ${pod} --namespace=${namespace} --context=${context} -- ${command}`;
    } else {
      // Regular kubectl command (or exec command that already has a pod specified)
      fullCommand = command;
      
      // Add namespace and context flags if not already in the command
      if (!fullCommand.includes("--namespace") && !fullCommand.includes("-n ")) {
        fullCommand += ` --namespace=${namespace}`;
      }
      
      if (!fullCommand.includes("--context")) {
        fullCommand += ` --context=${context}`;
      }
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

// Function to load contexts from kubeconfig
async function loadContextsFromKubeconfig(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('kubectl config get-contexts -o name');
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error reading kubeconfig contexts:', error);
    return [];
  }
}

// Function to load contexts from configuration file
export async function loadContextsFromFile(filePath?: string, useKubeconfig: boolean = false): Promise<string[]> {
  try {
    if (useKubeconfig) {
      return await loadContextsFromKubeconfig();
    }

    // Default to the config.json file in the project root
    const configPath = filePath || path.join(process.cwd(), 'k8s-config.json');
    
    // Check if the file exists
    if (!fs.existsSync(configPath)) {
      console.log(`Config file not found at ${configPath}, using fallback contexts`);
      return ["minikube", "docker-desktop", "production"]; // Fallback contexts
    }
    
    // Read and parse the file
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    
    // Validate that the config has contexts
    if (!config.contexts || !Array.isArray(config.contexts)) {
      console.log('Invalid config file format, using fallback contexts');
      return ["minikube", "docker-desktop", "production"]; // Fallback contexts
    }
    
    // Return the contexts
    return config.contexts;
  } catch (error) {
    console.error('Error loading contexts from file:', error);
    return ["minikube", "docker-desktop", "production"]; // Fallback contexts
  }
}

// Function to get Kubernetes contexts
export async function getContexts(useKubeconfig: boolean = false): Promise<Array<{name: string; available: boolean}>> {
  try {
    const contexts = await loadContextsFromFile(undefined, useKubeconfig);
    return contexts.map(context => ({
      name: context,
      available: configCache.contextStatus[context] || false
    }));
  } catch (error) {
    console.error('Error reading contexts:', error);
    return [];
  }
}

// Function to load namespaces from configuration file
export async function loadNamespacesFromFile(context: string, filePath?: string): Promise<string[]> {
  try {
    // Default to the config.json file in the project root
    const configPath = filePath || path.join(process.cwd(), 'k8s-config.json');
    
    // Check if the file exists
    if (!fs.existsSync(configPath)) {
      console.log(`Config file not found at ${configPath}, using fallback namespaces`);
      return ["default", "kube-system", "kube-public"]; // Fallback namespaces
    }
    
    // Read and parse the file
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    
    // Validate that the config has the context with namespaces
    if (!config.namespaces || typeof config.namespaces !== 'object') {
      console.log('Invalid config file format (namespaces), using fallback namespaces');
      return ["default", "kube-system", "kube-public"]; // Fallback namespaces
    }
    
    // If the context has namespaces, return them, otherwise return defaults
    if (Array.isArray(config.namespaces[context])) {
      return config.namespaces[context];
    } else {
      return ["default", "kube-system", "kube-public"]; // Fallback namespaces
    }
  } catch (error) {
    console.error('Error loading namespaces from file:', error);
    return ["default", "kube-system", "kube-public"]; // Fallback namespaces
  }
}

// Function to get namespaces for a given context
export async function getNamespaces(context: string): Promise<string[]> {
  if (configCache.namespaces[context]) {
    return configCache.namespaces[context];
  }
  
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    configCache.namespaces = config.namespaces || {};
    return configCache.namespaces[context] || ["default", "kube-system", "kube-public"];
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
