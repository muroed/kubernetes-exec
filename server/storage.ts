import { users, type User, type InsertUser, commands, type Command, type InsertCommand } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Command operations
  createCommand(command: InsertCommand): Promise<Command>;
  getCommandHistory(userId: number): Promise<Command[]>;
  clearCommandHistory(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private commands: Map<number, Command>;
  private userIdCounter: number;
  private commandIdCounter: number;

  constructor() {
    this.users = new Map();
    this.commands = new Map();
    this.userIdCounter = 1;
    this.commandIdCounter = 1;
    
    // Add a demo user
    this.createUser({
      username: "admin",
      password: "admin123",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Command operations
  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.commandIdCounter++;
    const now = new Date();
    const command: Command = { 
      ...insertCommand, 
      id,
      executedAt: now,
    };
    this.commands.set(id, command);
    return command;
  }
  
  async getCommandHistory(userId: number): Promise<Command[]> {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.userId === userId)
      .sort((a, b) => 
        new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
      );
  }
  
  async clearCommandHistory(userId: number): Promise<void> {
    for (const [id, command] of this.commands.entries()) {
      if (command.userId === userId) {
        this.commands.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
