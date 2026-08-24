export function logSlowOperation(
  operation: string,
  startedAt: number,
  context: Record<string, unknown> = {}
) {
  const durationMs = Date.now() - startedAt;

  if (durationMs < 500) {
    return;
  }

  console.warn(
    JSON.stringify({
      level: "warn",
      message: "slow_operation",
      operation,
      duration_ms: durationMs,
      ...context,
    })
  );
}
