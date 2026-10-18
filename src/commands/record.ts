import { CtoaiError, ErrorCodes } from "../core/errors";
import { type CtoEvent, type EventKind, EventKindSchema, normalizeAbout } from "../core/events";
import { openProject, requireInitialized } from "../project/open";

export interface RecordOptions {
  root: string;
  kind: string;
  text: string;
  body?: string;
  about?: string[];
  /** For `session close`: the session id to close (defaults to the open one). */
  session?: string;
}

export interface RecordResult {
  event: CtoEvent;
  /** True when this call closed a session (it became an Episode). */
  closedSession: boolean;
}

/**
 * `ctoai record` - write a finding, decision, or session back to memory.
 *
 * One JSON file per event, append-only. A `session` event is left open until
 * `--close` is passed; closing it stamps `closedAt`, which promotes it to an
 * Episode in the graph.
 */
export async function runRecord(options: RecordOptions): Promise<RecordResult> {
  const { root } = options;
  requireInitialized(root);

  const parsedKind = EventKindSchema.safeParse(options.kind);
  if (!parsedKind.success) {
    throw new CtoaiError(
      ErrorCodes.INVALID_ARGUMENT,
      `unknown event kind "${options.kind}"; use session, finding, or decision`,
    );
  }
  const kind: EventKind = parsedKind.data;

  if (options.text.trim().length === 0) {
    throw new CtoaiError(ErrorCodes.INVALID_ARGUMENT, `"--text" is required and cannot be empty`);
  }

  const { events } = await openProject(root);

  if (kind === "session" && options.session !== undefined && options.session !== "") {
    return closeSession(events, options.session);
  }

  const event = await events.append({
    kind,
    text: options.text.trim(),
    body: options.body ?? "",
    about: normalizeAbout(options.about ?? []),
    createdAt: new Date().toISOString(),
  });

  return { event, closedSession: false };
}

/**
 * Close a session: stamp `closedAt` on a copy and append it, leaving the
 * original file untouched (append-only, never rewrite).
 */
async function closeSession(
  events: { all(): Promise<CtoEvent[]>; append(e: Omit<CtoEvent, "id">): Promise<CtoEvent> },
  sessionId: string,
): Promise<RecordResult> {
  const all = await events.all();
  // Closing appends a copy stamped with the original's id in `session`, so
  // the original file is never rewritten. A session is open only when no
  // closed copy references it - otherwise the second close would succeed.
  const closedRefs = new Set(
    all
      .filter((event) => event.closedAt !== undefined)
      .map((event) => event.session)
      .filter(Boolean),
  );
  const open =
    sessionId === "latest"
      ? [...all]
          .reverse()
          .find(
            (event) =>
              event.kind === "session" && event.closedAt === undefined && !closedRefs.has(event.id),
          )
      : all.find((event) => event.id === sessionId);

  if (open === undefined) {
    throw new CtoaiError(
      ErrorCodes.INVALID_ARGUMENT,
      sessionId === "latest" ? "no open session to close" : `no session with id "${sessionId}"`,
    );
  }
  if (open.closedAt !== undefined) {
    throw new CtoaiError(ErrorCodes.INVALID_ARGUMENT, `session "${open.id}" is already closed`);
  }
  if (closedRefs.has(open.id)) {
    throw new CtoaiError(ErrorCodes.INVALID_ARGUMENT, `session "${open.id}" is already closed`);
  }

  const closed = await events.append({
    kind: "session",
    text: open.text,
    body: open.body,
    about: open.about,
    createdAt: open.createdAt,
    machine: open.machine,
    session: open.id,
    closedAt: new Date().toISOString(),
  });

  return { event: closed, closedSession: true };
}
