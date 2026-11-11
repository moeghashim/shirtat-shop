import { startWorker } from "./worker-test-support.ts";

const server = await startWorker(
  {
    DATABASE_URL: process.env.DATABASE_URL,
    DATA_SOURCE: process.env.DATA_SOURCE,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3021",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  },
  { binding: process.argv.includes("--binding") },
);
console.log(`Local-only workerd: ${server.baseURL}; Ctrl+C to stop. Credentials are not logged.`);
await new Promise<void>((resolve) => {
  process.once("SIGINT", resolve);
  process.once("SIGTERM", resolve);
});
await server.stop();
