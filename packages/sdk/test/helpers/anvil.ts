import { spawn, type ChildProcess } from "node:child_process";

export interface AnvilInstance {
  rpcUrl: string;
  stop: () => Promise<void>;
}

async function waitForRpc(rpcUrl: string, timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      });
      if (res.ok) return;
    } catch {
      // anvil not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`anvil did not become ready at ${rpcUrl} within ${timeoutMs}ms`);
}

/** Spawns a local anvil instance for integration tests, against the real contract bytecode. */
export async function startAnvil(port: number): Promise<AnvilInstance> {
  const proc: ChildProcess = spawn("anvil", ["--port", String(port), "--silent"]);
  const rpcUrl = `http://127.0.0.1:${port}`;

  await waitForRpc(rpcUrl);

  return {
    rpcUrl,
    stop: () =>
      new Promise((resolve) => {
        proc.once("exit", () => resolve());
        proc.kill();
      }),
  };
}
