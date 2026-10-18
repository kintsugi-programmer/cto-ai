import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runRecord } from "./record";
import { toCtoaiError } from "../core/errors";
import { openProject } from "../project/open";
import { getTool, TOOL_NAMES, type ToolResult } from "../tools/catalog";
import { makeToolContext } from "../tools/resolve";

export interface McpOptions {
  root: string;
  version: string;
}

/**
 * `ctoai mcp` - the MCP server over stdio.
 *
 * Agents get the same fixed catalogue the CLI exposes. Every argument is
 * validated before anything runs, and every answer carries the path it
 * walked, so a model can show its work.
 *
 * stdout is reserved for the protocol; everything human goes to stderr.
 */
export async function serveMcp(options: McpOptions): Promise<void> {
  const { root, version } = options;

  const server = new McpServer(
    { name: "ctoai", version },
    {
      instructions:
        "ctoai is the persistent project brain for this repository. Call `resume` before " +
        "starting work, `blast_radius` before changing a file, `guards` before touching a " +
        "protected path, and `record` when a decision or finding is made. Answers include the " +
        "graph path walked; trust `not-indexed` answers and run `ctoai sync` if the repo changed.",
    },
  );

  // Read-only catalogue tools.
  for (const name of TOOL_NAMES) {
    const tool = getTool(name);
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.args as unknown as z.ZodRawShape,
      },
      async (args: unknown) => {
        const project = await openProject(root);
        try {
          const ctx = makeToolContext({ store: project.store, root });
          const parsed = (tool.args as z.ZodType).parse(args ?? {});
          const result = await tool.run(ctx, parsed);
          return mcpSuccess(result);
        } catch (error) {
          return mcpError(error);
        } finally {
          await project.store.close();
        }
      },
    );
  }

  // `record` writes memory, so it is a tool too - agents must be able to
  // remember things, which is the whole point.
  const recordArgs = z.object({
    kind: z.enum(["finding", "decision", "session"]).describe("what kind of memory"),
    text: z.string().min(1).describe("one-line summary"),
    body: z.string().optional().describe("longer detail"),
    about: z.array(z.string()).optional().describe("node ids this is about"),
    closeSession: z.boolean().optional().describe("close the open session instead of opening one"),
  });

  server.registerTool(
    "record",
    {
      description:
        "Write a finding, decision, or session back to the project memory. Pass closeSession to end the open session.",
      inputSchema: recordArgs as unknown as z.ZodRawShape,
    },
    async (args: unknown) => {
      try {
        const parsed = recordArgs.parse(args ?? {});
        if (parsed.closeSession === true) {
          const closed = await runRecord({
            root,
            kind: "session",
            text: parsed.text,
            session: "latest",
          });
          return mcpSuccess({ recorded: closed.event, closedSession: true });
        }
        const recorded = await runRecord({
          root,
          kind: parsed.kind,
          text: parsed.text,
          ...(parsed.body !== undefined ? { body: parsed.body } : {}),
          ...(parsed.about !== undefined ? { about: parsed.about } : {}),
        });
        return mcpSuccess({ recorded: recorded.event, closedSession: false });
      } catch (error) {
        return mcpError(error);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`ctoai mcp server ready (${TOOL_NAMES.length + 1} tools)\n`);
}

function mcpSuccess(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function mcpError(error: unknown) {
  const ctoai = toCtoaiError(error);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: ctoai.code, message: ctoai.message }),
      },
    ],
  };
}

export type { ToolResult };
