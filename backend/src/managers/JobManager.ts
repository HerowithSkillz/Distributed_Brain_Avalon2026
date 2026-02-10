import type { Server, Socket } from "socket.io";
import type {
  Chunk,
  ChunkResult,
  ComputeTask,
  JobCompletePayload,
  JobErrorPayload,
  JobPayload,
  SystemStatusPayload,
} from "../types";
import { mergeChunkResults } from "../services/aggregator";
import { splitMatrixA } from "../services/chunker";
import { recordWorkerContribution } from "../database/db";
import { WorkerManager } from "./WorkerManager";

interface JobState {
  jobId: string;
  rowsA: number;
  colsA: number;
  colsB: number;
  requesterId: string;
  workersUsed: number;
  chunksExpected: number;
  chunksReceived: Map<number, ChunkResult>;
  chunksById: Map<number, Chunk>;
  startedAt: number;
  matrixA: number[];
  matrixB: number[];
}

const generateMatrix = (rows: number, cols: number): number[] => {
  const size = rows * cols;
  const values: number[] = new Array(size);

  for (let i = 0; i < size; i += 1) {
    values[i] = Math.random();
  }

  return values;
};

export class JobManager {
  private jobStates: Map<string, JobState> = new Map();
  private pendingChunks: Chunk[] = [];
  private completedJobs = 0;
  private verifyResults: boolean;
  private maxVerifyCells: number;

  constructor(private workerManager: WorkerManager) {
    this.verifyResults =
      (process.env.VERIFY_RESULTS ?? "false").toLowerCase() === "true";
    this.maxVerifyCells = Number(process.env.MAX_VERIFY_CELLS ?? 1024);
  }

  submitJob(io: Server, socket: Socket, payload: JobPayload): void {
    try {
      const { jobId, rowsA, colsA, colsB } = payload;

      if (!jobId || rowsA <= 0 || colsA <= 0 || colsB <= 0) {
        this.emitJobError(socket, {
          jobId,
          message: "Invalid matrix dimensions or jobId.",
        });
        return;
      }

      const idleWorkers = this.workerManager.getIdleWorkerIds();
      if (idleWorkers.length === 0) {
        this.emitJobError(socket, {
          jobId,
          message: "No available workers.",
        });
        return;
      }

      const chunkCount = Math.min(idleWorkers.length, rowsA);
      const matrixA = generateMatrix(rowsA, colsA);
      const matrixB = generateMatrix(colsA, colsB);
      const chunks = splitMatrixA(matrixA, rowsA, colsA, chunkCount);

      if (chunks.length === 0) {
        this.emitJobError(socket, {
          jobId,
          message: "Failed to create matrix chunks.",
        });
        return;
      }

      const chunksById = new Map<number, Chunk>();
      const jobChunks: Chunk[] = chunks.map((chunk) => {
        const jobChunk: Chunk = {
          jobId,
          chunkId: chunk.chunkId,
          rowsAChunk: chunk.rowsAChunk,
          matrixAChunk: chunk.matrixAChunk,
          colsA,
          colsB,
        };
        chunksById.set(chunk.chunkId, jobChunk);
        return jobChunk;
      });

      const jobState: JobState = {
        jobId,
        rowsA,
        colsA,
        colsB,
        requesterId: socket.id,
        workersUsed: chunkCount,
        chunksExpected: jobChunks.length,
        chunksReceived: new Map(),
        chunksById,
        startedAt: Date.now(),
        matrixA,
        matrixB,
      };

      this.jobStates.set(jobId, jobState);
      this.pendingChunks.push(...jobChunks);
      this.dispatchPending(io);
    } catch (error) {
      this.emitJobError(socket, {
        jobId: payload.jobId,
        message: "Failed to submit job.",
      });
      console.error("Submit job error", error);
    }
  }

  handleTaskComplete(io: Server, socket: Socket, payload: ChunkResult): void {
    try {
      const jobState = this.jobStates.get(payload.jobId);
      if (!jobState) {
        return;
      }

      jobState.chunksReceived.set(payload.chunkId, payload);
      this.workerManager.markIdle(socket.id);
      this.workerManager.recordTaskComplete(socket.id, payload.computeTimeMs);
      recordWorkerContribution(socket.id, payload.computeTimeMs, 1);
      this.dispatchPending(io);

      if (jobState.chunksReceived.size !== jobState.chunksExpected) {
        return;
      }

      const chunks = Array.from(jobState.chunksReceived.values());
      const result = mergeChunkResults(chunks, jobState.rowsA, jobState.colsB);
      const totalTimeMs = Date.now() - jobState.startedAt;

      const { verified, verificationError } = this.verifyIfEnabled(
        jobState,
        result
      );

      const jobComplete: JobCompletePayload = {
        jobId: jobState.jobId,
        result,
        rowsA: jobState.rowsA,
        colsB: jobState.colsB,
        totalTimeMs,
        workersUsed: jobState.workersUsed,
        chunksCount: jobState.chunksExpected,
        verified,
        verificationError,
      };

      io.to(jobState.requesterId).emit("job_complete", jobComplete);
      this.jobStates.delete(jobState.jobId);
      this.completedJobs += 1;
    } catch (error) {
      console.error("Task complete error", error);
    }
  }

  handleWorkerDisconnect(io: Server, workerId: string): void {
    const workerState = this.workerManager.markDisconnected(workerId);
    if (!workerState) {
      return;
    }

    if (!workerState.currentJobId || workerState.currentChunkId === null) {
      return;
    }

    const jobState = this.jobStates.get(workerState.currentJobId);
    if (!jobState) {
      return;
    }

    const chunk = jobState.chunksById.get(workerState.currentChunkId);
    if (!chunk) {
      return;
    }

    this.pendingChunks.unshift(chunk);
    this.dispatchPending(io);
  }

  getSystemStatus(): SystemStatusPayload {
    return {
      activeWorkers: this.workerManager.getActiveWorkerCount(),
      jobsQueueLength: this.pendingChunks.length,
      completedJobs: this.completedJobs,
    };
  }

  private dispatchPending(io: Server): void {
    const idleWorkers = this.workerManager.getIdleWorkerIds();

    for (const workerId of idleWorkers) {
      if (this.pendingChunks.length === 0) {
        break;
      }

      const nextChunk = this.pendingChunks.shift();
      if (!nextChunk) {
        break;
      }

      const jobState = this.jobStates.get(nextChunk.jobId);
      if (!jobState) {
        continue;
      }

      const task: ComputeTask = {
        ...nextChunk,
        matrixBFull: jobState.matrixB,
      };

      this.workerManager.markBusy(workerId, nextChunk.jobId, nextChunk.chunkId);
      io.to(workerId).emit("compute_task", task);
    }
  }

  private emitJobError(socket: Socket, payload: JobErrorPayload): void {
    socket.emit("job_error", payload);
  }

  private verifyIfEnabled(
    jobState: JobState,
    result: number[]
  ): { verified?: boolean; verificationError?: string } {
    if (!this.verifyResults) {
      return {};
    }

    const cellCount = jobState.rowsA * jobState.colsB;
    if (cellCount > this.maxVerifyCells) {
      return {};
    }

    try {
      const expected = this.multiplyCpu(
        jobState.matrixA,
        jobState.matrixB,
        jobState.rowsA,
        jobState.colsA,
        jobState.colsB
      );

      const verified = this.compareMatrices(expected, result);
      return {
        verified,
        verificationError: verified ? undefined : "Verification mismatch.",
      };
    } catch (error) {
      console.error("Result verification failed", error);
      return {
        verified: false,
        verificationError: "Verification failed.",
      };
    }
  }

  private multiplyCpu(
    matrixA: number[],
    matrixB: number[],
    rowsA: number,
    colsA: number,
    colsB: number
  ): number[] {
    const result: number[] = new Array(rowsA * colsB).fill(0);

    for (let row = 0; row < rowsA; row += 1) {
      for (let col = 0; col < colsB; col += 1) {
        let sum = 0;
        const rowOffset = row * colsA;

        for (let k = 0; k < colsA; k += 1) {
          sum += matrixA[rowOffset + k] * matrixB[k * colsB + col];
        }

        result[row * colsB + col] = sum;
      }
    }

    return result;
  }

  private compareMatrices(expected: number[], actual: number[]): boolean {
    if (expected.length !== actual.length) {
      return false;
    }

    const epsilon = 1e-5;

    for (let i = 0; i < expected.length; i += 1) {
      if (Math.abs(expected[i] - actual[i]) > epsilon) {
        return false;
      }
    }

    return true;
  }
}
