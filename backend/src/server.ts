import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { initDatabase } from "./database/db";
import { registerSocketHandlers } from "./handlers/socketHandler";
import { JobManager } from "./managers/JobManager";
import { WorkerManager } from "./managers/WorkerManager";

const PORT = Number(process.env.PORT ?? 3000);

initDatabase();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const workerManager = new WorkerManager();
const jobManager = new JobManager(workerManager);

registerSocketHandlers(io, workerManager, jobManager);

httpServer.listen(PORT, () => {
  console.log(`Orchestrator running on port ${PORT}`);
});

export { io };
