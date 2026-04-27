import { existsSync } from "node:fs";

import { readKV, writeKV } from "../src/lib/0g-kv.ts";

type LoadEnvProcess = NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

function loadLocalEnv() {
  const processWithEnvLoader = process as LoadEnvProcess;

  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      processWithEnvLoader.loadEnvFile?.(file);
    }
  }
}

async function main() {
  loadLocalEnv();

  const key = `onboarding:test:${Date.now()}`;
  const value = JSON.stringify({
    age: 28,
    gender: "prefer-not-to-say",
    tags: ["travel", "music", "crypto"],
  });

  console.log(`Writing ${key} to 0G KV...`);
  const tx = await writeKV(key, value);
  console.log("Write tx:", tx);

  console.log("Reading value back...");
  const stored = await readKV(key);
  console.log(stored);
}

main().catch((error) => {
  console.error("\nKV smoke failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
