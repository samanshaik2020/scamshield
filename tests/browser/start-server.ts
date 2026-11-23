import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import type { FullConfig } from "@playwright/test";

export default async function startServer(config: FullConfig) {
  const url = new URL(config.projects[0].use.baseURL!);
  // Start Next directly so test teardown can stop one process on Windows and Linux.
  const server = spawn(process.execPath, [
    require.resolve("next/dist/bin/next"), "start", "--hostname", url.hostname, "--port", url.port,
  ], {
    env: { ...process.env, OPENAI_API_KEY: "" }, stdio: "inherit", windowsHide: true,
  });

  let spawnError: Error | undefined;
  const done = new Promise<void>((resolve) => {
    server.once("exit", () => resolve());
    server.once("error", (error) => { spawnError = error; resolve(); });
  });
  async function stop() {
    server.kill();
    await done;
  }

  try {
    for (let attempt = 0; attempt < 90; attempt++) {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null) throw new Error("The Next.js test server stopped before it was ready.");
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) }).catch(() => undefined);
      if (response?.ok) {
        await response.body?.cancel();
        return stop;
      }
      await response?.body?.cancel();
      await delay(500);
    }
    throw new Error("The Next.js test server did not start. Run npm run build before the browser tests.");
  } catch (error) {
    await stop();
    throw error;
  }
}
