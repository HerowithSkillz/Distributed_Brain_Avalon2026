const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8,
});

instrument(io, {
  auth: false,
  mode: "development",
});

const workers = new Map();

io.on("connection", (socket) => {
  console.log("Connection:", socket.id);

  socket.on("register-admin", () => {
    socket.join("admins");
    broadcastNetworkStatus();
    console.log("Admin connected:", socket.id);
  });

  socket.on("register-worker", (payload = {}) => {
    const { hasWebGPU = false, gpuName = "Unknown" } = payload;
    workers.set(socket.id, { hasWebGPU, gpuName, status: "idle" });
    console.log(`Worker Registered: ${gpuName} (${socket.id})`);
    broadcastNetworkStatus();
  });

  socket.on("disconnect", () => {
    if (workers.has(socket.id)) {
      workers.delete(socket.id);
      console.log("Worker Disconnected:", socket.id);
      broadcastNetworkStatus();
    }
  });

  socket.on("request-matrix-job", ({ task, data } = {}) => {
    const input = Array.isArray(data) ? data : [];
    console.log(`Job Request: \"${task}\" | Size: ${input.length}`);

    io.to("admins").emit("admin-activity", {
      time: new Date().toLocaleTimeString(),
      msg: `User (${socket.id.slice(0, 4)}...) requested: ${task}`,
    });

    let selectedWorker = null;
    for (const [id, info] of workers) {
      if (info.status === "idle") {
        selectedWorker = id;
        break;
      }
    }

    if (!selectedWorker) {
      socket.emit("job-status", {
        status: "Queued",
        msg: "All workers busy. Please try again.",
      });
      io.to("admins").emit("admin-activity", {
        time: new Date().toLocaleTimeString(),
        msg: `Job queued: no workers for User (${socket.id.slice(0, 4)}...)`,
      });
      return;
    }

    const info = workers.get(selectedWorker);
    info.status = "busy";
    workers.set(selectedWorker, info);
    broadcastNetworkStatus();

    io.to("admins").emit("admin-activity", {
      time: new Date().toLocaleTimeString(),
      msg: `Assigned task to Worker (${selectedWorker.slice(0, 4)}...)`,
    });

    io.to(selectedWorker).emit("compute-task", { task, data: input, from: socket.id });
    socket.emit("job-status", { status: "Assigned", worker: selectedWorker });
  });

  socket.on("compute-result", ({ result, from } = {}) => {
    if (workers.has(socket.id)) {
      const info = workers.get(socket.id);
      info.status = "idle";
      workers.set(socket.id, info);
      broadcastNetworkStatus();
    }

    if (from) {
      io.to(from).emit("job-finished", result || []);
    }

    io.to("admins").emit("admin-activity", {
      time: new Date().toLocaleTimeString(),
      msg: `Job finished. Result sent to User (${String(from).slice(0, 4)}...)`,
    });
  });
});

function broadcastNetworkStatus() {
  const list = Array.from(workers.entries()).map(([id, data]) => ({ id, ...data }));
  io.emit("network-status", list);
}

httpServer.listen(PORT, HOST, () => {
  console.log(`Orchestrator running at http://localhost:${PORT}`);
});
