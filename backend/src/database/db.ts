import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "brain.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(
  "CREATE TABLE IF NOT EXISTS leaderboard (" +
    "worker_id TEXT PRIMARY KEY," +
    "total_compute_ms REAL NOT NULL DEFAULT 0," +
    "tasks_completed INTEGER NOT NULL DEFAULT 0," +
    "sessions_joined INTEGER NOT NULL DEFAULT 0," +
    "last_seen TEXT NOT NULL" +
    ");"
);

db.exec(
  "CREATE TABLE IF NOT EXISTS jobs (" +
    "id TEXT PRIMARY KEY," +
    "rows_a INTEGER NOT NULL," +
    "cols_a INTEGER NOT NULL," +
    "cols_b INTEGER NOT NULL," +
    "workers_used INTEGER NOT NULL," +
    "chunks_count INTEGER NOT NULL," +
    "total_time_ms REAL NOT NULL," +
    "created_at TEXT NOT NULL" +
    ");"
);

export const initDatabase = (): void => {
  db.prepare("SELECT 1").get();
};

const upsertSessionStmt = db.prepare(
  "INSERT INTO leaderboard (worker_id, total_compute_ms, tasks_completed, sessions_joined, last_seen) " +
    "VALUES (@workerId, 0, 0, 1, @lastSeen) " +
    "ON CONFLICT(worker_id) DO UPDATE SET " +
    "sessions_joined = leaderboard.sessions_joined + 1, " +
    "last_seen = excluded.last_seen"
);

const upsertContributionStmt = db.prepare(
  "INSERT INTO leaderboard (worker_id, total_compute_ms, tasks_completed, sessions_joined, last_seen) " +
    "VALUES (@workerId, @totalComputeMs, @tasksCompleted, 0, @lastSeen) " +
    "ON CONFLICT(worker_id) DO UPDATE SET " +
    "total_compute_ms = leaderboard.total_compute_ms + excluded.total_compute_ms, " +
    "tasks_completed = leaderboard.tasks_completed + excluded.tasks_completed, " +
    "last_seen = excluded.last_seen"
);

export const recordWorkerSession = (workerId: string): void => {
  const lastSeen = new Date().toISOString();
  upsertSessionStmt.run({ workerId, lastSeen });
};

export const recordWorkerContribution = (
  workerId: string,
  totalComputeMs: number,
  tasksCompleted: number
): void => {
  const lastSeen = new Date().toISOString();
  upsertContributionStmt.run({
    workerId,
    totalComputeMs,
    tasksCompleted,
    lastSeen,
  });
};
