/**
 * SQLite database setup and initialization
 * 
 * This module handles:
 * - Database connection
 * - Table creation
 * - Job persistence
 * - Leaderboard tracking
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { JobMetadata, LeaderboardEntry } from '../types';

const DB_PATH = process.env.DATABASE_PATH || './data/brain.db';

// Ensure data directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance

/**
 * Initialize database schema
 */
export function initDatabase(): void {
  console.log('📦 Initializing database...');

  // Create jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      rows_a INTEGER NOT NULL,
      cols_a INTEGER NOT NULL,
      cols_b INTEGER NOT NULL,
      workers_used INTEGER NOT NULL,
      chunks_count INTEGER NOT NULL,
      total_time_ms REAL NOT NULL,
      avg_chunk_time_ms REAL NOT NULL,
      throughput_mops REAL NOT NULL,
      efficiency_ratio REAL NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Create leaderboard table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      worker_id TEXT PRIMARY KEY,
      total_compute_ms REAL NOT NULL DEFAULT 0,
      tasks_completed INTEGER NOT NULL DEFAULT 0,
      sessions_joined INTEGER NOT NULL DEFAULT 1,
      last_seen TEXT NOT NULL
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_compute ON leaderboard(total_compute_ms DESC);
  `);

  console.log('✅ Database initialized successfully');
}

/**
 * Save job metadata to database
 */
export function saveJob(job: JobMetadata): void {
  const stmt = db.prepare(`
    INSERT INTO jobs (
      id, rows_a, cols_a, cols_b, workers_used, chunks_count,
      total_time_ms, avg_chunk_time_ms, throughput_mops, efficiency_ratio, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    job.id,
    job.rowsA,
    job.colsA,
    job.colsB,
    job.workersUsed,
    job.chunksCount,
    job.totalTimeMs,
    job.avgChunkTimeMs,
    job.throughputMops,
    job.efficiencyRatio,
    job.createdAt
  );
}

/**
 * Update leaderboard stats for a worker
 */
export function updateLeaderboard(
  workerId: string,
  computeTimeMs: number,
  tasksCompleted: number
): void {
  const stmt = db.prepare(`
    INSERT INTO leaderboard (worker_id, total_compute_ms, tasks_completed, last_seen)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(worker_id) DO UPDATE SET
      total_compute_ms = total_compute_ms + ?,
      tasks_completed = tasks_completed + ?,
      sessions_joined = sessions_joined + 1,
      last_seen = datetime('now')
  `);

  stmt.run(workerId, computeTimeMs, tasksCompleted, computeTimeMs, tasksCompleted);
}

/**
 * Get top N workers from leaderboard
 */
export function getTopWorkers(limit: number = 10): LeaderboardEntry[] {
  const stmt = db.prepare(`
    SELECT worker_id, total_compute_ms, tasks_completed, sessions_joined, last_seen
    FROM leaderboard
    ORDER BY total_compute_ms DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as Array<{
    worker_id: string;
    total_compute_ms: number;
    tasks_completed: number;
    sessions_joined: number;
    last_seen: string;
  }>;

  return rows.map(row => ({
    workerId: row.worker_id,
    totalComputeMs: row.total_compute_ms,
    tasksCompleted: row.tasks_completed,
    sessionsJoined: row.sessions_joined,
    lastSeen: row.last_seen
  }));
}

/**
 * Get recent jobs
 */
export function getRecentJobs(limit: number = 10): JobMetadata[] {
  const stmt = db.prepare(`
    SELECT * FROM jobs
    ORDER BY created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as Array<{
    id: string;
    rows_a: number;
    cols_a: number;
    cols_b: number;
    workers_used: number;
    chunks_count: number;
    total_time_ms: number;
    avg_chunk_time_ms: number;
    throughput_mops: number;
    efficiency_ratio: number;
    created_at: string;
  }>;

  return rows.map(row => ({
    id: row.id,
    rowsA: row.rows_a,
    colsA: row.cols_a,
    colsB: row.cols_b,
    workersUsed: row.workers_used,
    chunksCount: row.chunks_count,
    totalTimeMs: row.total_time_ms,
    avgChunkTimeMs: row.avg_chunk_time_ms,
    throughputMops: row.throughput_mops,
    efficiencyRatio: row.efficiency_ratio,
    createdAt: row.created_at
  }));
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
  console.log('📦 Database connection closed');
}

// Initialize database on module load
initDatabase();

export default db;
