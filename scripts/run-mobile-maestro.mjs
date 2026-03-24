import { spawnSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env.local") });

const flowArg = process.argv[2] ?? ".maestro/flows/smoke.yaml";
const flowPath = path.resolve(flowArg);

const result = spawnSync("maestro", ["test", flowPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    MAESTRO_APP_ID: process.env.MAESTRO_APP_ID ?? "host.exp.Exponent",
    MAESTRO_CLI_NO_ANALYTICS: process.env.MAESTRO_CLI_NO_ANALYTICS ?? "true",
    MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED:
      process.env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED ?? "true",
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
