// Resolve logical test ports once, at the server/client boundary. Explicit suite
// overrides win over the shared offset; security reserves three adjacent ports.
function validPort(value: number) {
  if (!Number.isInteger(value) || value < 1024 || value > 65535) throw new Error("Invalid test port.");
  return value;
}
export function testPort(port: number) {
  const offset = Number(process.env.TEST_PORT_OFFSET ?? 0);
  if (!Number.isInteger(offset)) throw new Error("Invalid test port offset.");
  for (const [base, count, name] of [
    [3011, 1, "AUTH_TEST_PORT"],
    [3021, 1, "WORKER_TEST_PORT"],
    [3031, 3, "SECURITY_TEST_PORT"],
  ] as const) {
    if (port >= base && port < base + count && process.env[name] !== undefined) {
      const override = validPort(Number(process.env[name]));
      validPort(override + count - 1);
      return override + port - base;
    }
  }
  return validPort(port + offset);
}
export function testOrigin(origin: string) {
  const url = new URL(origin);
  if (url.hostname === "localhost" && url.port) url.port = String(testPort(Number(url.port)));
  return url.origin;
}
export function testSentinelPort() {
  const explicit = process.env.AUTH_SENTINEL_PORT ?? process.env.TEST_SENTINEL_PORT;
  return explicit === undefined ? testPort(54328) : validPort(Number(explicit));
}
