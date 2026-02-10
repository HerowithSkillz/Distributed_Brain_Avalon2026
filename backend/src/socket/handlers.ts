import type { Server, Socket } from "socket.io";
import type {
  ChunkResult,
  ComputeTask,
  JobCompletePayload,
  JobErrorPayload,
  JobPayload,
  MatrixChunk,
} from "../types";
import { mergeChunkResults } from "../services/aggregator";
import { splitMatrixA } from "../services/chunker";
import type { WorkerPool } from "../services/workerPool";

interface JobState {
  jobId: string;
  rowsA: number;
  colsB: number;
  requesterId: string;
  workersUsed: number;
  chunksExpected: number;
  chunksReceived: Map<number, ChunkResult>;
  startedAt: number;
}

const jobStates: Map<string, JobState> = new Map();

const generateMatrix = (rows: number, cols: number): number[] => {
  const size = rows * cols;
  const values: number[] = new Array(size);

  for (let i = 0; i < size; i += 1) {
    values[i] = Math.random();
  }

  return values;
};

const emitJobError = (socket: Socket, payload: JobErrorPayload): void => {
  socket.emit("job_error", payload);
};

export const handleJobSubmit = (
  io: Server,
  socket: Socket,
  workerPool: WorkerPool,
  payload: JobPayload
): void => {
  try {
    const { jobId, rowsA, colsA, colsB } = payload;

    if (!jobId || rowsA <= 0 || colsA <= 0 || colsB <= 0) {
      emitJobError(socket, {
        jobId,
        message: "Invalid matrix dimensions or jobId.",
      });
      return;
    }

    const idleWorkers = workerPool.getIdleWorkerIds();
    if (idleWorkers.length === 0) {
      emitJobError(socket, {
        jobId,
        message: "No available workers.",
      });
      return;
    }

    const chunkCount = Math.min(idleWorkers.length, rowsA);
    const matrixA = generateMatrix(rowsA, colsA);
    const matrixB = generateMatrix(colsA, colsB);
    const chunks: MatrixChunk[] = splitMatrixA(matrixA, rowsA, colsA, chunkCount);

    const jobState: JobState = {
      jobId,
      rowsA,
      colsB,
      requesterId: socket.id,
      workersUsed: chunkCount,
      chunksExpected: chunks.length,
      chunksReceived: new Map(),
      startedAt: Date.now(),
    };

    jobStates.set(jobId, jobState);

    chunks.forEach((chunk, index) => {
      const workerId = idleWorkers[index];

      workerPool.markBusy(workerId, jobId, chunk.chunkId);

      const task: ComputeTask = {
        jobId,
        chunkId: chunk.chunkId,
        matrixAChunk: chunk.matrixAChunk,
        matrixBFull: matrixB,
        rowsAChunk: chunk.rowsAChunk,
        colsA,
        colsB,
      };

      io.to(workerId).emit("compute_task", task);
    });
  } catch (error) {
    emitJobError(socket, {
      jobId: payload.jobId,
      message: "Failed to submit job.",
    });
    console.error("Submit job error", error);
  }
};

export const handleTaskComplete = (
  io: Server,
  socket: Socket,
  workerPool: WorkerPool,
  payload: ChunkResult
): void => {
  try {
    const jobState = jobStates.get(payload.jobId);
    if (!jobState) {
      return;
    }

    jobState.chunksReceived.set(payload.chunkId, payload);
    workerPool.markIdle(socket.id);

    if (jobState.chunksReceived.size !== jobState.chunksExpected) {
      return;
    }

    const chunks = Array.from(jobState.chunksReceived.values());
    const result = mergeChunkResults(chunks, jobState.rowsA, jobState.colsB);
    const totalTimeMs = Date.now() - jobState.startedAt;

    const jobComplete: JobCompletePayload = {
      jobId: jobState.jobId,
      result,
      rowsA: jobState.rowsA,
      colsB: jobState.colsB,
      totalTimeMs,
      workersUsed: jobState.workersUsed,
      chunksCount: jobState.chunksExpected,
    };

    io.to(jobState.requesterId).emit("job_complete", jobComplete);
    jobStates.delete(jobState.jobId);
  } catch (error) {
    console.error("Task complete error", error);
  }
};
