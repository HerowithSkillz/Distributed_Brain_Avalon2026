import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://192.168.1.62:3000";

function App() {
  const [page, setPage] = useState("auth");
  const [mode, setMode] = useState("register");
  const [formData, setFormData] = useState({ username: "", password: "" });

  const workerSocketRef = useRef(null);
  const userSocketRef = useRef(null);

  const [workerConnected, setWorkerConnected] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [networkWorkers, setNetworkWorkers] = useState([]);
  const [isParticipating, setIsParticipating] = useState(true);

  const [brainState, setBrainState] = useState("idle");
  const [gpuUtilization, setGpuUtilization] = useState(0);
  const [tasksSolved, setTasksSolved] = useState(0);
  const [computeTime, setComputeTime] = useState(0);
  const [transferTime, setTransferTime] = useState(0);
  const [brainEarnings, setBrainEarnings] = useState(0);

  const [requestSize, setRequestSize] = useState("1000");
  const [requestStatus, setRequestStatus] = useState("Ready to deploy.");
  const [resultPreview, setResultPreview] = useState("");
  const [requestConnected, setRequestConnected] = useState(false);
  const [adminConnected, setAdminConnected] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();

    if (mode === "register") {
      console.log("Register payload:", formData);
      return;
    }

    console.log("Login payload:", formData);
    setPage("role");
  };

  const renderSiteTitle = () => (
    <h1 className="site-title">
      <span className="site-logo" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
          <circle cx="32" cy="32" r="6" />
          <ellipse cx="32" cy="32" rx="22" ry="10" />
          <ellipse cx="32" cy="32" rx="12" ry="22" />
          <path d="M14 22c10 7 26 7 36 0" />
          <path d="M14 42c10-7 26-7 36 0" />
          <line x1="32" y1="26" x2="32" y2="8" />
          <line x1="38" y1="30" x2="54" y2="18" />
          <line x1="38" y1="34" x2="56" y2="38" />
          <line x1="32" y1="38" x2="32" y2="56" />
          <line x1="26" y1="34" x2="10" y2="46" />
          <line x1="26" y1="30" x2="8" y2="26" />
          <circle cx="32" cy="8" r="3" />
          <circle cx="54" cy="18" r="3" />
          <circle cx="56" cy="38" r="3" />
          <circle cx="32" cy="56" r="3" />
          <circle cx="10" cy="46" r="3" />
          <circle cx="8" cy="26" r="3" />
        </svg>
      </span>
      <span className="site-title-text">Distributed Brain</span>
    </h1>
  );

  useEffect(() => {
    if (page !== "donator" || !isParticipating) {
      setBrainState(isParticipating ? "idle" : "disconnected");
      return undefined;
    }

    const socket = io(SOCKET_URL);
    workerSocketRef.current = socket;

    socket.on("connect", () => {
      setWorkerConnected(true);
      setWorkerId(socket.id);
      socket.emit("register-worker", {
        hasWebGPU: true,
        gpuName: "Browser Worker",
      });
      setBrainState("idle");
    });

    socket.on("disconnect", () => {
      setWorkerConnected(false);
      setBrainState("disconnected");
    });

    socket.on("network-status", (workers = []) => {
      setNetworkWorkers(workers);
    });

    socket.on("compute-task", ({ data = [], from }) => {
      setBrainState("computing");
      const startedAt = performance.now();

      const input = Array.isArray(data) ? data : [];
      const result = input.slice(0, 5000).map((n) => Number((n * 1.015).toFixed(6)));

      const endedAt = performance.now();
      const computeMs = Math.max(1, Math.round(endedAt - startedAt));
      const transferMs = Math.max(1, Math.round(input.length / 350));
      const gpuLoad = Math.min(98, 50 + Math.floor(Math.random() * 45));

      setComputeTime(computeMs);
      setTransferTime(transferMs);
      setGpuUtilization(gpuLoad);
      setTasksSolved((prev) => prev + 1);
      setBrainEarnings((prev) => Number((prev + 0.42).toFixed(2)));

      socket.emit("compute-result", { result, from });
      setTimeout(() => setBrainState("idle"), 350);
    });

    return () => {
      socket.disconnect();
      workerSocketRef.current = null;
    };
  }, [page, isParticipating]);

  useEffect(() => {
    if (page !== "requestor") return undefined;

    const socket = io(SOCKET_URL);
    userSocketRef.current = socket;

    socket.on("connect", () => {
      setRequestConnected(true);
    });

    socket.on("disconnect", () => {
      setRequestConnected(false);
    });

    socket.on("network-status", (workers = []) => {
      setNetworkWorkers(workers);
    });

    socket.on("job-status", (msg) => {
      if (msg?.status === "Assigned") {
        setRequestStatus(`Assigned to Worker Node: ${String(msg.worker || "").slice(0, 6)}...`);
        return;
      }

      setRequestStatus(msg?.msg || "Queued. Please wait...");
    });

    socket.on("job-finished", (result = []) => {
      const preview = Array.isArray(result)
        ? result
            .slice(0, 3)
            .map((n) => Number(n).toFixed(2))
            .join(", ")
        : "";

      setRequestStatus(`Success! Computed ${Array.isArray(result) ? result.length : 0} items.`);
      setResultPreview(preview ? `[${preview}...]` : "");
    });

    return () => {
      socket.disconnect();
      userSocketRef.current = null;
    };
  }, [page]);

  useEffect(() => {
    if (page !== "server") return undefined;

    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      setAdminConnected(true);
      socket.emit("register-admin");
    });

    socket.on("disconnect", () => {
      setAdminConnected(false);
    });

    socket.on("network-status", (workers = []) => {
      setNetworkWorkers(workers);
    });

    socket.on("admin-activity", (item) => {
      if (!item) return;
      setAdminLogs((prev) => [item, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, [page]);

  const deployTask = () => {
    const socket = userSocketRef.current;
    if (!socket || !socket.connected) {
      setRequestStatus("Not connected to server.");
      return;
    }

    const size = Math.max(1, Number.parseInt(requestSize, 10) || 1000);
    const data = Array.from({ length: size }, () => Math.random());

    setRequestStatus("Deploying to grid...");
    setResultPreview("");

    socket.emit("request-matrix-job", {
      task: `Matrix Job (${size})`,
      data,
    });
  };

  const efficiencyPercent = useMemo(() => {
    const total = computeTime + transferTime;
    if (!total) return 0;
    return Math.round((computeTime / total) * 100);
  }, [computeTime, transferTime]);

  const idleWorkers = networkWorkers.filter((w) => w.status === "idle").length;

  if (page === "donator") {
    return (
      <main className="page">
        {renderSiteTitle()}

        <section className="donator-layout">
          <aside className="panel metrics-panel">
            <h3>Live Performance Metrics</h3>
            <p className="socket-state">{workerConnected ? "Connected" : "Disconnected"} to {SOCKET_URL}</p>

            <div
              className="gpu-ring"
              style={{
                background: `conic-gradient(#00f6ff ${gpuUtilization * 3.6}deg, #1d2756 0deg)`,
              }}
            >
              <div className="gpu-ring-inner">
                <span>{gpuUtilization}%</span>
              </div>
            </div>
            <p className="metric-label">GPU Utilization Heatmap</p>

            <div className="metric-card">
              <p className="metric-label">Tasks Solved Counter</p>
              <p className="metric-value">{String(tasksSolved).padStart(6, "0")}</p>
            </div>

            <div className="metric-card">
              <p className="metric-label">Network Efficiency Monitor</p>
              <div className="efficiency-row">
                <span>Compute: {computeTime}ms</span>
                <span>Transfer: {transferTime}ms</span>
              </div>
              <div className="efficiency-bar">
                <span style={{ width: `${efficiencyPercent}%` }} />
              </div>
              <p className="metric-value small">{efficiencyPercent}% Efficient</p>
            </div>
          </aside>

          <section className="panel brain-panel">
            <h3>The Global Brain</h3>
            <p className="subtitle">A live neural sphere reacting to network compute activity.</p>
            <div className={`brain-sphere ${brainState}`}>
              <span>Global Brain</span>
            </div>
            <p className="state-text">
              State: <strong>{brainState === "computing" ? "Computing" : brainState === "disconnected" ? "Disconnected" : "Idle"}</strong>
            </p>
            <p className="worker-id">Worker ID: {workerId ? `${workerId.slice(0, 8)}...` : "-"}</p>
          </section>

          <aside className="panel diagram-panel">
            <h3>Network Connection Diagram</h3>
            <div className="diagram-grid">
              <div className="node"><span className="pc-emoji">{"\u{1F4BB}"}</span><span>Receiver: Nova</span></div>
              <div className="node"><span className="pc-emoji">{"\u{1F4BB}"}</span><span>Receiver: Orion</span></div>
              <div className="node"><span className="pc-emoji">{"\u{1F4BB}"}</span><span>Receiver: Vega</span></div>
            </div>
            <div className="arrow-row">-&gt;   |   &lt;-</div>
            <div className="node donor-node"><span className="pc-emoji">{"\u{1F4BB}"}</span><span>Donator: You</span></div>
          </aside>
        </section>

        <section className="panel rewards-panel">
          <div>
            <h3>Live Leaderboard</h3>
            <ul className="leaderboard">
              <li>#1 CipherNode - 9241</li>
              <li>#2 QuantumMint - 8110</li>
              <li>#3 AtlasDonor - 7568</li>
              <li>#4 You - {tasksSolved}</li>
            </ul>
          </div>

          <div className="earnings-wrap">
            <p className="metric-label">Contribution &amp; Rewards</p>
            <p className="earnings-value">$BRAIN EARNED: {brainEarnings.toFixed(2)}</p>
            <p className="network-mini">Network: {idleWorkers} idle / {networkWorkers.length} total workers</p>
          </div>

          <div className="toggle-wrap">
            <p className="metric-label">Participation Toggle</p>
            <button
              type="button"
              className={`toggle-btn ${isParticipating ? "on" : "off"}`}
              onClick={() => setIsParticipating((prev) => !prev)}
            >
              {isParticipating ? "STOP" : "START"}
            </button>
          </div>
        </section>

        <button type="button" className="back-btn" onClick={() => setPage("role")}>Back to Roles</button>
      </main>
    );
  }

  if (page === "requestor") {
    return (
      <main className="page">
        {renderSiteTitle()}
        <section className="card requestor-card">
          <h2>Submit Job (Requestor)</h2>
          <p className="subtitle">Use the network's shared power to solve heavy tasks faster.</p>

          <p className="network-status">Network Status: {idleWorkers} GPUs Idle / {networkWorkers.length} Total</p>
          <p className="socket-state">{requestConnected ? "Connected" : "Disconnected"} to {SOCKET_URL}</p>

          <label htmlFor="matrix-size">Matrix Size</label>
          <input
            id="matrix-size"
            type="number"
            value={requestSize}
            onChange={(e) => setRequestSize(e.target.value)}
            min={1}
          />

          <button type="button" onClick={deployTask}>Deploy Task</button>

          <div className="request-status-box">
            <p className="request-status">{requestStatus}</p>
            {resultPreview ? <p className="result-preview">Preview: {resultPreview}</p> : null}
          </div>
        </section>

        <button type="button" className="back-btn" onClick={() => setPage("role")}>Back to Roles</button>
      </main>
    );
  }

  if (page === "role") {
    return (
      <main className="page">
        {renderSiteTitle()}
        <section className="card options-card">
          <h2>Choose Your Role</h2>
          <p className="subtitle">Select how you want to use the network.</p>

          <div className="option-block">
            <button type="button" className="option-btn" onClick={() => setPage("donator")}>1: Donator (Worker)</button>
            <p className="option-title">Provide Power</p>
            <p className="option-description">Help the network by providing computation from your browser to solve tasks together.</p>
          </div>

          <div className="option-block">
            <button type="button" className="option-btn" onClick={() => setPage("requestor")}>2: User (Requestor)</button>
            <p className="option-title">Get Computation Power</p>
            <p className="option-description">Use the network&apos;s shared power to solve your heavy tasks faster.</p>
          </div>

          <div className="option-block">
            <button type="button" className="option-btn" onClick={() => setPage("server")}>3: Server (Admin)</button>
            <p className="option-title">Monitor Orchestrator</p>
            <p className="option-description">Watch live network status, worker availability, and activity logs from the backend server.</p>
          </div>
        </section>
      </main>
    );
  }

  if (page === "server") {
    const idle = networkWorkers.filter((w) => w.status === "idle").length;
    const busy = networkWorkers.filter((w) => w.status === "busy").length;

    return (
      <main className="page">
        {renderSiteTitle()}
        <section className="card server-card">
          <h2>Server Admin Console</h2>
          <p className="subtitle">Connected to orchestrator and receiving live backend events.</p>
          <p className="socket-state">{adminConnected ? "Connected" : "Disconnected"} to {SOCKET_URL}</p>

          <div className="server-stats">
            <div className="metric-card">
              <p className="metric-label">Total Workers</p>
              <p className="metric-value small">{networkWorkers.length}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Idle Workers</p>
              <p className="metric-value small">{idle}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Busy Workers</p>
              <p className="metric-value small">{busy}</p>
            </div>
          </div>

          <div className="server-log-box">
            <p className="metric-label">Activity Logs</p>
            {adminLogs.length === 0 ? (
              <p className="server-log-empty">No activity yet.</p>
            ) : (
              <ul className="server-log-list">
                {adminLogs.map((log, index) => (
                  <li key={`${log.time}-${index}`}>
                    <span className="server-log-time">[{log.time}]</span> {log.msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <button type="button" className="back-btn" onClick={() => setPage("role")}>Back to Roles</button>
      </main>
    );
  }

  return (
    <main className="page">
      {renderSiteTitle()}
      <section className="card">
        <h2>{mode === "register" ? "Create Account" : "Login"}</h2>
        <p className="subtitle">
          {mode === "register"
            ? "Share your compute power with the network."
            : "Access your account and continue sharing compute power."}
        </p>

        <form onSubmit={handleAuthSubmit} className="form" autoComplete="off">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            placeholder="Enter username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="Enter password"
          />

          <button type="submit">{mode === "register" ? "Register" : "Login"}</button>

          <p className="login-text">
            {mode === "register" ? "Already a user? " : "New user? "}
            <button
              type="button"
              className="switch-btn"
              onClick={() => setMode((prev) => (prev === "register" ? "login" : "register"))}
            >
              {mode === "register" ? "Login" : "Create Account"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

export default App;
