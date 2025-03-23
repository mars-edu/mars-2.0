import type { D1Database } from "@cloudflare/workers-types";
import { Env, getEnv } from "./env.js";

class DatabaseService {
  db: D1Database | null = null;
  env: ReturnType<typeof getEnv> | null = null;

  setD1Database(db: D1Database) {
    this.db = db;
  }

  setEnv(env: Env) {
    this.env = getEnv(env);
  }

  getEnv() {
    return this.env;
  }

  getDatabase() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }
}

const dbService = new DatabaseService();

export default dbService;
