import { io } from "socket.io-client";
import type { JobCompletePayload, JobPayload } from "../src/types";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";

const log = (message: string): void => {
  console.log(message);
};

const startClient = (): void => {
  const clientSocket = io(SERVER_URL, { transports: ["websocket"] });

  clientSocket.on("connect", () => {
    log(`Client connected: ${clientSocket.id}`);

    const payload: JobPayload = {
      jobId: `job-${Date.now()}`,
      rowsA: 4,
      colsA: 4,
      colsB: 4,
    };

    clientSocket.emit("submit_job", payload);
    log("Submitted job: 4x4 x 4x4");
  });

  clientSocket.on("job_complete", (payload: JobCompletePayload) => {
    log("job_complete received");
    console.log(payload);
    clientSocket.disconnect();
  });

  clientSocket.on("job_error", (payload: { jobId: string; message: string }) => {
    log(`job_error: ${payload.jobId} - ${payload.message}`);
    clientSocket.disconnect();
  });
};

startClient();
