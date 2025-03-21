import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  command: text("command").notNull(),
  output: text("output"),
  error: text("error"),
  status: text("status").notNull().default("success"),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  namespace: text("namespace").notNull().default("default"),
  context: text("context").notNull().default("minikube"),
});

export const insertCommandSchema = createInsertSchema(commands).pick({
  userId: true,
  command: true,
  output: true,
  error: true,
  status: true,
  namespace: true,
  context: true,
});

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Command execution schema
export const executeCommandSchema = z.object({
  command: z.string().min(1, "Command is required"),
  namespace: z.string().optional(),
  context: z.string().optional(),
});

export type ExecuteCommandRequest = z.infer<typeof executeCommandSchema>;
