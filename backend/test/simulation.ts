import { io } from "socket.io-client";
import type { ChunkResult, ComputeTask, JobCompletePayload, JobPayload } from "../src/types";

const SERVER_URL = "http://localhost:3000";

const log = (message: string): void => {
  console.log(message);
};

const startWorker = (): void => {
  const workerSocket = io(SERVER_URL, { transports: ["websocket"] });

  workerSocket.on("connect", () => {
    log(`⚙️ Worker connected: ${workerSocket.id}`);
  });

  workerSocket.on("compute_task", (task: ComputeTask) => {
    log(`🧪 Received Chunk ${task.chunkId} for job ${task.jobId}`);

    setTimeout(() => {
      const result: ChunkResult = {
        jobId: task.jobId,
        chunkId: task.chunkId,
        result: new Array(task.rowsAChunk * task.colsB).fill(1),
        computeTimeMs: 100,
      };

      workerSocket.emit("task_complete", result);
      log(`✅ Sent task_complete for chunk ${task.chunkId}`);
    }, 100);
  });

  workerSocket.on("disconnect", (reason) => {
    log(`⚠️ Worker disconnected: ${reason}`);
  });
};

const startClient = (): void => {
  const clientSocket = io(SERVER_URL, { transports: ["websocket"] });

  clientSocket.on("connect", () => {
    log(`⚙️ Client connected: ${clientSocket.id}`);

    const payload: JobPayload = {
      jobId: "job-test-4x4",
      rowsA: 4,
      colsA: 4,
      colsB: 4,
    };

    clientSocket.emit("submit_job", payload);
    log("🧪 Submitted job: 4x4 x 4x4");
  });

  clientSocket.on("job_complete", (payload: JobCompletePayload) => {
    log("✅ job_complete received");
    console.log(payload);
    clientSocket.disconnect();
  });

  clientSocket.on("job_error", (payload: { jobId: string; message: string }) => {
    log(`❌ job_error: ${payload.jobId} - ${payload.message}`);
    clientSocket.disconnect();
  });
};

startWorker();

setTimeout(() => {
  startClient();
}, 1000);
