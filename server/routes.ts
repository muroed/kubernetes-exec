import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { executeKubernetesCommand, getContexts, getNamespaces, getPods } from "./kubernetes";
import { loginSchema, executeCommandSchema } from "../shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "kubecli-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // Clear expired sessions every 24h
      }),
    })
  );

  // Authentication is disabled
  const isAuthenticated = (_req: Request, _res: Response, next: Function) => {
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsedData = loginSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(parsedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(parsedData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        username: parsedData.username,
        password: hashedPassword,
      });
      
      // Set user ID in session (TypeScript won't recognize this custom property)
      (req.session as any).userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(parsedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password using bcrypt
      const validPassword = await bcrypt.compare(parsedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user ID in session (TypeScript won't recognize this custom property)
      (req.session as any).userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Kubernetes routes
  app.get("/api/kubernetes/contexts", isAuthenticated, async (req, res) => {
    try {
      const useKubeconfig = req.query.useKubeconfig === 'true';
      const contexts = await getContexts(useKubeconfig);
      res.json(contexts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.get("/api/kubernetes/namespaces", isAuthenticated, async (req, res) => {
    try {
      const context = req.query.context as string;
      const namespaces = await getNamespaces(context);
      res.json(namespaces);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });
  
  app.get("/api/kubernetes/pods", isAuthenticated, async (req, res) => {
    try {
      const namespace = req.query.namespace as string;
      const context = req.query.context as string;
      
      if (!namespace || !context) {
        return res.status(400).json({ message: "Namespace and context are required" });
      }
      
      const pods = await getPods(namespace, context);
      res.json(pods);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.post("/api/kubernetes/execute", isAuthenticated, async (req, res) => {
    try {
      const parsedData = executeCommandSchema.parse(req.body);
      // Default user ID for command history since auth is disabled
      const userId = 1;
      
      // Execute command
      const result = await executeKubernetesCommand(
        parsedData.command,
        parsedData.namespace || "default",
        parsedData.context || "minikube",
        parsedData.pod || null
      );
      
      // Add to command history
      await storage.createCommand({
        userId,
        command: parsedData.command,
        output: result.output,
        error: result.error,
        status: result.error ? "error" : "success",
        namespace: parsedData.namespace || "default",
        context: parsedData.context || "minikube",
        pod: parsedData.pod || null,
      });
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message, error: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred", error: "Unknown error" });
      }
    }
  });

  app.get("/api/kubernetes/history", isAuthenticated, async (req, res) => {
    try {
      // Default user ID for command history since auth is disabled
      const userId = 1;
      const history = await storage.getCommandHistory(userId);
      res.json(history);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  app.delete("/api/kubernetes/history/clear", isAuthenticated, async (req, res) => {
    try {
      // Default user ID for command history since auth is disabled
      const userId = 1;
      await storage.clearCommandHistory(userId);
      res.json({ message: "Command history cleared" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  });

  

  const httpServer = createServer(app);
  return httpServer;
}
