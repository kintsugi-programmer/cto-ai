import { CtoaiError, ErrorCodes } from "../core/errors";
import { openProject, requireInitialized } from "../project/open";
import { getTool, TOOL_NAMES, type ToolResult } from "../tools/catalog";
import { makeToolContext } from "../tools/resolve";

export interface QueryOptions {
  root: string;
  tool: string;
  args: Record<string, unknown>;
  maxNodes?: number;
}

/**
 * `ctoai query <tool>` - run one catalogue tool against the project graph.
 *
 * Arguments are validated against the tool's zod schema before anything runs;
 * a bad argument fails with the field name, never a stack trace.
 */
export async function runQuery(options: QueryOptions): Promise<ToolResult> {
  const { root } = options;
  requireInitialized(root);

  const tool = getTool(options.tool);
  const parsed = tool.args.safeParse(options.args);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new CtoaiError(
      ErrorCodes.INVALID_ARGUMENT,
      `invalid arguments for "${options.tool}": ${issues}`,
    );
  }

  const project = await openProject(root);
  try {
    const ctx = makeToolContext({
      store: project.store,
      root,
      maxNodes: options.maxNodes ?? 50_000,
    });
    return await tool.run(ctx, parsed.data);
  } finally {
    await project.store.close();
  }
}

export { TOOL_NAMES };
