import { execSync } from "child_process";
import { writeFileSync } from "fs";

export interface D1QueryResponse<T> {
  results: T[];
  success: boolean;
  meta?: {
    served_by?: string;
    duration?: number;
    changes?: number;
    last_row_id?: number;
    changed_db?: boolean;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export function checkWranglerAuth(): void {
  try {
    const result = execSync("npx wrangler whoami", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.includes("You are logged in")) {
      console.log("✓ Authenticated with Wrangler");
    } else {
      throw new Error("Wrangler authentication check failed");
    }
  } catch (error: any) {
    console.error("✗ Wrangler authentication failed");
    console.error("\nPlease re-authenticate with:");
    console.error("  npx wrangler login");
    console.error("\nOr use API token authentication:");
    console.error("  export CLOUDFLARE_API_TOKEN=your_token");
    console.error("  export CLOUDFLARE_ACCOUNT_ID=your_account_id\n");
    throw new Error("Not authenticated with Wrangler");
  }
}

function logWranglerError(error: any, accountId: string): void {
  console.error("✗ Failed to query D1 database");

  if (error?.stderr) {
    console.error("\nWrangler error output:");
    console.error(error.stderr.toString());
  }

  if (error?.stdout) {
    console.error("\nWrangler stdout:");
    console.error(error.stdout.toString());
  }

  if (
    error?.stdout?.includes("Authentication error") ||
    error?.stdout?.includes("code: 10000")
  ) {
    console.error("\n⚠ Authentication error detected!");
    console.error("\nPlease re-authenticate with:");
    console.error("  npx wrangler login");
    console.error("\nIf that doesn't work, try using API token authentication:");
    console.error("  1. Get your API token from: https://dash.cloudflare.com/profile/api-tokens");
    console.error("  2. Create a token with 'D1 Edit' permissions");
    console.error("  3. Set environment variables:");
    console.error("     export CLOUDFLARE_API_TOKEN=your_token");
    console.error(`     export CLOUDFLARE_ACCOUNT_ID=${accountId}`);
    console.error("  4. Run the script again");
  }
}

export function runD1Query<T>(options: {
  databaseName: string;
  accountId: string;
  query: string;
}): D1QueryResponse<T> {
  const command = `npx wrangler d1 execute ${options.databaseName} --remote --json --command="${options.query.replace(/"/g, '\\"')}"`;

  try {
    const output = execSync(command, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: options.accountId,
      },
    });

    if (process.env.DEBUG) {
      console.log("Raw wrangler output:", output);
    }

    const parsed = JSON.parse(output);
    const response: D1QueryResponse<T> = Array.isArray(parsed)
      ? parsed[0]
      : parsed;

    if (!response.success) {
      throw new Error("D1 query failed");
    }

    if (!Array.isArray(response.results)) {
      throw new Error("Invalid response format from D1");
    }

    return response;
  } catch (error: any) {
    logWranglerError(error, options.accountId);

    if (error?.message?.includes("JSON")) {
      console.error("\nError parsing JSON response from wrangler");
    }

    throw error;
  }
}

export function parsePiniaState<T>(stateJson: string): T {
  let parsed: any;
  try {
    parsed = JSON.parse(stateJson);
  } catch (error) {
    throw new Error("Failed to parse PiniaState JSON blob");
  }

  return (parsed?.json ?? parsed) as T;
}

export function writeJsonFile<T>(filePath: string, data: T): string {
  const json = JSON.stringify(data, null, 2);
  writeFileSync(filePath, json, "utf-8");
  return (json.length / 1024).toFixed(1);
}
