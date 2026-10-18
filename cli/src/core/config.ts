import { z } from "zod";

/** Which store backend the project uses. */
export const BackendSchema = z.enum(["file", "falkordb"]);

/** FalkorDB connection settings. Secrets never live here - only env vars. */
export const FalkorSettingsSchema = z.object({
  /** e.g. redis://localhost:6379 or rediss://db.example.com:6379 */
  url: z.string().default(""),
  /** One graph per project (FalkorDB multi-tenancy). */
  graph: z.string().default(""),
  /** Username for ACL auth; empty means no-auth or password-only. */
  user: z.string().default(""),
});

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  backend: BackendSchema.default("file"),
  /** Project display name; defaults to the repository folder name. */
  name: z.string().default(""),
  /** Extra ignore patterns (gitignore syntax) applied on top of .gitignore. */
  ignore: z.array(z.string()).default([]),
  /** Entry files that get a managed cto-ai block. */
  entryFiles: z.array(z.string()).default(["AGENTS.md", "CLAUDE.md", ".cursorrules"]),
  falkordb: FalkorSettingsSchema.default({ url: "", graph: "", user: "" }),
});

export type Config = z.infer<typeof ConfigSchema>;
export type FalkorSettings = z.infer<typeof FalkorSettingsSchema>;
