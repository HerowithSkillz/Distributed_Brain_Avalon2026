export type WorkerStatus = "idle" | "computing" | "disconnected";

export interface JobPayload {
  jobId: string;
  rowsA: number;
  colsA: number;
  colsB: number;
}

export interface Job {
  jobId: string;
  rowsA: number;
  colsA: number;
  colsB: number;
  matrixA: number[];
  matrixB: number[];
  createdAt: number;
  requesterId: string;
  chunksExpected: number;
  workersUsed: number;
}

export interface MatrixChunk {
  chunkId: number;
  matrixAChunk: number[];
  rowsAChunk: number;
}

export interface Chunk {
  jobId: string;
  chunkId: number;
  matrixAChunk: number[];
  rowsAChunk: number;
  colsA: number;
  colsB: number;
}

export interface ComputeTask extends Chunk {
  matrixBFull: number[];
}

export interface ChunkResult {
  jobId: string;
  chunkId: number;
  result: number[];
  computeTimeMs: number;
  workerId?: string;
}

export interface WorkerState {
  workerId: string;
  status: WorkerStatus;
  currentChunkId: number | null;
  currentJobId: string | null;
  lastSeen: number;
  totalComputeMs: number;
  tasksCompleted: number;
}

export interface JobCompletePayload {
  jobId: string;
  result: number[];
  rowsA: number;
  colsB: number;
  totalTimeMs: number;
  workersUsed: number;
  chunksCount: number;
  verified?: boolean;
  verificationError?: string;
}

export interface JobErrorPayload {
  jobId: string;
  message: string;
}

export interface SystemStatusPayload {
  activeWorkers: number;
  jobsQueueLength: number;
  completedJobs: number;
}
