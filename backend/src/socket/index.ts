import type { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    try {
      console.log(`Worker connected: ${socket.id}`);
    } catch (error) {
      console.error("Socket connection error", error);
    }

    socket.on("disconnect", (reason) => {
      try {
        console.log(`Worker disconnected: ${socket.id} (${reason})`);
      } catch (error) {
        console.error("Socket disconnect error", error);
      }
    });
  });
};
