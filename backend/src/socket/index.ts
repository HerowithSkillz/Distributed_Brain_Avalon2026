import type { Server, Socket } from "socket.io";
import { handleJobSubmit, handleTaskComplete } from "./handlers";
import { WorkerPool } from "../services/workerPool";
import type { ChunkResult, JobPayload } from "../types";

const workerPool = new WorkerPool();

export const registerSocketHandlers = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    try {
      console.log(`Worker connected: ${socket.id}`);
      workerPool.registerWorker(socket.id);
    } catch (error) {
      console.error("Socket connection error", error);
    }

    socket.on("submit_job", (payload: JobPayload) => {
      try {
        handleJobSubmit(io, socket, workerPool, payload);
      } catch (error) {
        console.error("submit_job handler error", error);
      }
    });

    socket.on("task_complete", (payload: ChunkResult) => {
      try {
        handleTaskComplete(io, socket, workerPool, payload);
      } catch (error) {
        console.error("task_complete handler error", error);
      }
    });

    socket.on("disconnect", (reason) => {
      try {
        console.log(`Worker disconnected: ${socket.id} (${reason})`);
        workerPool.removeWorker(socket.id);
      } catch (error) {
        console.error("Socket disconnect error", error);
      }
    });
  });
};
