import { z } from "zod";

/** Every node type the graph model knows about (v0). */
export const NodeTypeSchema = z.enum([
  "Project",
  "Dir",
  "File",
  "Note",
  "Meeting",
  "Decision",
  "Finding",
  "Session",
  "Episode",
  "Requirement",
  "Feature",
  "Skill",
  "Spec",
  "Task",
  "Person",
]);

/** Every edge type the graph model knows about (v0). */
export const EdgeTypeSchema = z.enum([
  "CONTAINS",
  "DEPENDS_ON",
  "LINKS_TO",
  "MENTIONS",
  "ABOUT",
  "DECIDED_IN",
  "LEARNED_IN",
  "PART_OF",
  "SUPERSEDES",
  "IMPLEMENTS",
  "TOUCHED",
]);

/**
 * A node in the project graph.
 *
 * `id` is a stable, human-readable key such as `file:src/cli.ts`,
 * `dir:src`, `note:context-architecture`, or `spec:03`.
 */
export const NodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  name: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).default({}),
  /** ISO 8601 timestamp; set when the node was first indexed or authored. */
  createdAt: z.string().optional(),
  /** ISO 8601 timestamp; set when the node was last changed. */
  updatedAt: z.string().optional(),
});

/**
 * A directed edge between two nodes.
 *
 * `id` should be deterministic, e.g. `file:a.ts|DEPENDS_ON|file:b.ts`.
 */
export const EdgeSchema = z.object({
  id: z.string().min(1),
  type: EdgeTypeSchema,
  from: z.string().min(1),
  to: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).default({}),
});

export type CtoNode = z.infer<typeof NodeSchema>;
export type CtoEdge = z.infer<typeof EdgeSchema>;
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;
