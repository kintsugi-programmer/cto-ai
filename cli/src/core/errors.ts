/**
 * Error codes shared by every command.
 *
 * They exist so the CLI can exit predictably (`ctoai check --ci`) and so
 * machine consumers (`--json`, MCP) can branch on `code` instead of parsing
 * message strings.
 */
export const ErrorCodes = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  UNKNOWN_TOOL: "UNKNOWN_TOOL",
  NOT_INDEXED: "NOT_INDEXED",
  INDEX_TOO_LARGE: "INDEX_TOO_LARGE",
  CONNECTION_FAILED: "CONNECTION_FAILED",
  VERIFY_FAILED: "VERIFY_FAILED",
  SPEC_NOT_FOUND: "SPEC_NOT_FOUND",
  DEPENDENCY_CYCLE: "DEPENDENCY_CYCLE",
  GUARD_VIOLATION: "GUARD_VIOLATION",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** An error carrying a stable machine-readable code. */
export class CtoaiError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "CtoaiError";
    this.code = code;
  }
}

export function isCtoaiError(error: unknown): error is CtoaiError {
  return error instanceof CtoaiError;
}

/** Wrap an unknown thrown value into a CtoaiError. */
export function toCtoaiError(error: unknown): CtoaiError {
  if (isCtoaiError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new CtoaiError(ErrorCodes.INTERNAL, error.message);
  }
  return new CtoaiError(ErrorCodes.INTERNAL, String(error));
}
