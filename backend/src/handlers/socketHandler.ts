import type { Server, Socket } from "socket.io";
import type { ChunkResult, JobPayload, SystemStatusPayload } from "../types";
import { recordWorkerSession } from "../database/db";
import { JobManager } from "../managers/JobManager";
import { WorkerManager } from "../managers/WorkerManager";

export const registerSocketHandlers = (
  io: Server,
  workerManager: WorkerManager,
  jobManager: JobManager
): void => {
  io.on("connection", (socket: Socket) => {
    try {
      console.log(`Socket connected: ${socket.id}`);
      workerManager.registerWorker(socket.id);
      recordWorkerSession(socket.id);
    } catch (error) {
      console.error("Socket connection error", error);
    }

    socket.on("submit_job", (payload: JobPayload) => {
      try {
        jobManager.submitJob(io, socket, payload);
      } catch (error) {
        console.error("submit_job handler error", error);
      }
    });

    socket.on("task_complete", (payload: ChunkResult) => {
      try {
        jobManager.handleTaskComplete(io, socket, payload);
      } catch (error) {
        console.error("task_complete handler error", error);
      }
    });

    socket.on("get_system_status", () => {
      try {
        const status: SystemStatusPayload = jobManager.getSystemStatus();
        socket.emit("system_status", status);
      } catch (error) {
        console.error("get_system_status handler error", error);
      }
    });

    socket.on("disconnect", (reason) => {
      try {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
        jobManager.handleWorkerDisconnect(io, socket.id);
      } catch (error) {
        console.error("Socket disconnect error", error);
      }
    });
  });
};
