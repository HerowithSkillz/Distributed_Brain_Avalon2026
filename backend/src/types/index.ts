export interface JobPayload {
  jobId: string;
  rowsA: number;
  colsA: number;
  colsB: number;
}

export interface ComputeTask {
  jobId: string;
  chunkId: number;
  matrixAChunk: number[];
  matrixBFull: number[];
  rowsAChunk: number;
  colsA: number;
  colsB: number;
}

export interface ChunkResult {
  jobId: string;
  chunkId: number;
  result: number[];
  computeTimeMs: number;
}

export interface WorkerInfo {
  socketId: string;
  status: "idle" | "computing" | "disconnected";
  currentChunkId: number | null;
  currentJobId: string | null;
}

export interface MatrixChunk {
  chunkId: number;
  matrixAChunk: number[];
  rowsAChunk: number;
}

export interface JobCompletePayload {
  jobId: string;
  result: number[];
  rowsA: number;
  colsB: number;
  totalTimeMs: number;
  workersUsed: number;
  chunksCount: number;
}

export interface JobErrorPayload {
  jobId: string;
  message: string;
}
