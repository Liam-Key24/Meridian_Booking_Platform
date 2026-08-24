import "server-only";

export type ServerLogEvent = {
  event: string;
  outcome: "success" | "error" | "skipped" | "rate_limited" | "rejected";
  operationId?: string;
  businessId?: string;
  durationMs?: number;
  /** Short category only — never raw provider payloads or PII. */
  errorCategory?: string;
};

const REDACTED_KEYS =
  /password|secret|token|authorization|api[_-]?key|service[_-]?role|cookie|email|notes|allerg|ip|phone/i;

/**
 * Lightweight structured server log. Never logs passwords, secrets, raw IPs,
 * full notes/allergies, or email bodies.
 */
export function logServerEvent(entry: ServerLogEvent): void {
  const safe: Record<string, unknown> = {
    ts: new Date().toISOString(),
    event: entry.event,
    outcome: entry.outcome,
  };

  if (entry.operationId) safe.operationId = entry.operationId;
  if (entry.businessId) safe.businessId = entry.businessId;
  if (typeof entry.durationMs === "number") safe.durationMs = entry.durationMs;
  if (entry.errorCategory) {
    safe.errorCategory = redactValue(entry.errorCategory);
  }

  const line = JSON.stringify(safe);
  if (entry.outcome === "error" || entry.outcome === "rate_limited") {
    console.error(line);
  } else {
    console.info(line);
  }
}

function redactValue(value: string): string {
  if (REDACTED_KEYS.test(value) && value.length > 40) {
    return "redacted";
  }
  // Cap length so accidental PII dumps stay short
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

export function createOperationId(): string {
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
