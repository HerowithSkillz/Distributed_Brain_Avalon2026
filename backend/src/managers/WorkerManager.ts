import type { WorkerState, WorkerStatus } from "../types";

export class WorkerManager {
  private workers: Map<string, WorkerState> = new Map();

  registerWorker(workerId: string): WorkerState {
    const now = Date.now();
    const existing = this.workers.get(workerId);

    if (existing) {
      const updated: WorkerState = {
        ...existing,
        status: existing.status === "disconnected" ? "idle" : existing.status,
        lastSeen: now,
      };
      this.workers.set(workerId, updated);
      return updated;
    }

    const worker: WorkerState = {
      workerId,
      status: "idle",
      currentJobId: null,
      currentChunkId: null,
      lastSeen: now,
      totalComputeMs: 0,
      tasksCompleted: 0,
    };

    this.workers.set(workerId, worker);
    return worker;
  }

  markBusy(workerId: string, jobId: string, chunkId: number): void {
    this.updateWorker(workerId, "computing", {
      currentJobId: jobId,
      currentChunkId: chunkId,
    });
  }

  markIdle(workerId: string): void {
    this.updateWorker(workerId, "idle", {
      currentJobId: null,
      currentChunkId: null,
    });
  }

  markDisconnected(workerId: string): WorkerState | null {
    const existing = this.workers.get(workerId);
    if (!existing) {
      return null;
    }

    const updated: WorkerState = {
      ...existing,
      status: "disconnected",
      lastSeen: Date.now(),
    };

    this.workers.set(workerId, updated);
    return updated;
  }

  recordTaskComplete(workerId: string, computeMs: number): WorkerState | null {
    const existing = this.workers.get(workerId);
    if (!existing) {
      return null;
    }

    const updated: WorkerState = {
      ...existing,
      totalComputeMs: existing.totalComputeMs + computeMs,
      tasksCompleted: existing.tasksCompleted + 1,
      lastSeen: Date.now(),
    };

    this.workers.set(workerId, updated);
    return updated;
  }

  getIdleWorkerIds(): string[] {
    const idleWorkers: string[] = [];

    for (const worker of this.workers.values()) {
      if (worker.status === "idle") {
        idleWorkers.push(worker.workerId);
      }
    }

    return idleWorkers;
  }

  getActiveWorkerCount(): number {
    let count = 0;
    for (const worker of this.workers.values()) {
      if (worker.status !== "disconnected") {
        count += 1;
      }
    }

    return count;
  }

  getWorkerState(workerId: string): WorkerState | null {
    return this.workers.get(workerId) ?? null;
  }

  private updateWorker(
    workerId: string,
    status: WorkerStatus,
    overrides: Partial<WorkerState>
  ): void {
    const existing = this.workers.get(workerId);
    if (!existing) {
      return;
    }

    this.workers.set(workerId, {
      ...existing,
      ...overrides,
      status,
      lastSeen: Date.now(),
    });
  }
}
