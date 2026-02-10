/**
 * Shared TypeScript interfaces for The Distributed Brain
 */

export interface ComputeTask {
  chunkId: string;
  jobId: string;
  matrixAChunk: Float32Array;
  matrixBFull: Float32Array;
  rowOffset: number;
  chunkRows: number;
  colsA: number;
  colsB: number;
}

export interface TaskResult {
  chunkId: string;
  jobId: string;
  resultChunk: Float32Array;
  computeTimeMs: number;
  workerId: string;
}

export interface JobMetadata {
  id: string;
  rowsA: number;
  colsA: number;
  colsB: number;
  workersUsed: number;
  chunksCount: number;
  totalTimeMs: number;
  avgChunkTimeMs: number;
  throughputMops: number;
  efficiencyRatio: number;
  createdAt: string;
}

export interface WorkerInfo {
  id: string;
  socketId: string;
  status: 'idle' | 'computing' | 'disconnected';
  currentTaskId?: string;
  tasksCompleted: number;
  totalComputeMs: number;
  lastSeen: Date;
}

export interface LeaderboardEntry {
  workerId: string;
  totalComputeMs: number;
  tasksCompleted: number;
  sessionsJoined: number;
  lastSeen: string;
}
