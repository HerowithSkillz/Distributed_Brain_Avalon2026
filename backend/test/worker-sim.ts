import { io } from "socket.io-client";
import type { ChunkResult, ComputeTask } from "../src/types";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";

const log = (message: string): void => {
  console.log(message);
};

const startWorker = (): void => {
  const workerSocket = io(SERVER_URL, { transports: ["websocket"] });

  workerSocket.on("connect", () => {
    log(`Worker connected: ${workerSocket.id}`);
  });

  workerSocket.on("compute_task", (task: ComputeTask) => {
    log(`Received chunk ${task.chunkId} for job ${task.jobId}`);

    setTimeout(() => {
      const result: ChunkResult = {
        jobId: task.jobId,
        chunkId: task.chunkId,
        result: new Array(task.rowsAChunk * task.colsB).fill(1),
        computeTimeMs: 100,
      };

      workerSocket.emit("task_complete", result);
      log(`Sent task_complete for chunk ${task.chunkId}`);
    }, 100);
  });

  workerSocket.on("disconnect", (reason) => {
    log(`Worker disconnected: ${reason}`);
  });
};

startWorker();
