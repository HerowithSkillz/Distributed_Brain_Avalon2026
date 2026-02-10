import type { WorkerInfo } from "../types";

export class WorkerPool {
  private workers: Map<string, WorkerInfo> = new Map();

  registerWorker(socketId: string): void {
    if (this.workers.has(socketId)) {
      return;
    }

    this.workers.set(socketId, {
      socketId,
      status: "idle",
      currentChunkId: null,
      currentJobId: null,
    });
  }

  removeWorker(socketId: string): void {
    const existing = this.workers.get(socketId);
    if (!existing) {
      return;
    }

    this.workers.set(socketId, {
      ...existing,
      status: "disconnected",
    });
  }

  markBusy(socketId: string, jobId: string, chunkId: number): void {
    const worker = this.workers.get(socketId);
    if (!worker) {
      return;
    }

    this.workers.set(socketId, {
      ...worker,
      status: "computing",
      currentJobId: jobId,
      currentChunkId: chunkId,
    });
  }

  markIdle(socketId: string): void {
    const worker = this.workers.get(socketId);
    if (!worker) {
      return;
    }

    this.workers.set(socketId, {
      ...worker,
      status: "idle",
      currentJobId: null,
      currentChunkId: null,
    });
  }

  getIdleWorkerIds(): string[] {
    const idleWorkers: string[] = [];
    for (const worker of this.workers.values()) {
      if (worker.status === "idle") {
        idleWorkers.push(worker.socketId);
      }
    }

    return idleWorkers;
  }
}
