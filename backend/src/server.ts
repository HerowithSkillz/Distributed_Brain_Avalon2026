import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { registerSocketHandlers } from "./socket";

const PORT = 3000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log("Orchestrator running on port 3000");
});

export { io };
