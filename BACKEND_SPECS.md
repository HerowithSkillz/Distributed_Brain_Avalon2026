# 🛰️ The Distributed Brain – Backend Specifications

> **Focus:** Node.js, Orchestration, Socket.io Server, Database, Deployment

---

## 📋 High Priority Features (Top 5)

| Requirement_ID | Priority | Description | User Story | Expected Behaviour / Outcome |
| --- | --- | --- | --- | --- |
| FR-003 | **P0 - Critical** | MapReduce Task Distribution | As a developer, I want jobs automatically split and distributed across all workers. | Server chunks Matrix A into N row-slices, dispatches `{ chunkId, matrixAChunk, matrixBFull }` to each available worker in parallel via Socket.io events. |
| FR-005 | **P0 - Critical** | Automatic Fault Tolerance | As a requestor, I want my job to complete even if a worker disconnects mid-compute. | Server detects disconnect via Socket.io event, moves in-progress chunk back to pending queue, reassigns to next available worker within 500ms. Timeline logs the reassignment. |
| FR-007 | P1 - High | Worker Contribution Leaderboard (Server) | As a worker, I want to see how much compute I've contributed compared to others. | Server tracks `{ workerId, totalComputeMs, tasksCompleted }` per session and persists to SQLite. Broadcasts updated leaderboard data to connected dashboards for animated top-10 rendering with Bronze/Silver/Gold badges. |
| FR-016 | P1 - High | Result Verification | As a requestor, I want confidence the distributed result is mathematically correct. | Server optionally runs CPU verification on small matrices, compares with GPU result, sends match confirmation to the dashboard. Proves correctness of distributed computation. |
| FR-018 | P1 - High | Orchestrator Health Monitor | As a developer, I want to see server-side health metrics during demo. | Server exposes and broadcasts: Active Workers, Jobs in Queue, Jobs Completed, Average Response Time, and Socket.io connection status — all updating in real-time. |

## 📋 Additional Backend Requirements

| Requirement_ID | Description | User Story | Expected Behaviour / Outcome |
| --- | --- | --- | --- |
| FR-002 | Real-Time Job Submission (Server) | As a requestor, I want to submit a matrix computation job and receive results fast. | Server receives job payload (Matrix A and Matrix B dimensions) from the dashboard client, validates input, generates matrix data, initiates chunking, and returns aggregated result with full metrics upon completion. Job metadata persisted to SQLite. |
| FR-008 | Job History & Replay (Server) | As a requestor, I want to save past jobs and re-run them for benchmarking. | All completed jobs stored in SQLite with `{ jobId, dimensions, workersUsed, duration, result }`. Server exposes API/events for the dashboard to query history and trigger replays. |
| FR-010 | Network Efficiency Monitor (Server) | As a developer, I want proof the system is compute-bound not network-bound. | Server measures and exposes per-job: Compute Time, Network Transfer Time, Efficiency Ratio (`computeTime / totalTime × 100%`), and total data transferred in MB. Broadcasts to dashboard. |
| FR-013 | Security — Data-Only Protocol | As a security-conscious user, I want assurance workers never run malicious code. | Server transmits raw `Float32Array` data only. No arbitrary JavaScript or executable code is ever sent to workers. Workers execute only pre-bundled WGSL shaders compiled client-side. |

## 📋 Non-Functional Requirements (Backend)

| Requirement_ID | Description | Expected Behaviour / Outcome |
| --- | --- | --- |
| NFR-001 | Performance | Chunk dispatch latency under 100ms per worker. Result aggregation under 50ms. System should handle matrix jobs without perceptible lag. |
| NFR-002 | Scalability | WorkerPool dynamically scales from 1 to 20+ concurrent workers. Load balancer distributes chunks evenly. No hard-coded worker limits. |

---

## ⚙️ Tech Stack

| Component | Technology |
| --- | --- |
| Runtime | Node.js |
| HTTP Framework | Express |
| Communication | Socket.io (v4, Server) — configured with **CORS** to allow remote origins |
| Language | TypeScript |
| Database | **SQLite** (via `better-sqlite3` or `Prisma`) |
| Deployment | **Ngrok** (local dev tunneling) / **Render** (production) |

---

## 🗄️ Database Design (SQLite)

SQLite is chosen for its zero-configuration setup, single-file portability, and compatibility with both local development and lightweight production deployments.

### Tables

**`jobs`** — Stores completed job metadata

| Column | Type | Description |
| --- | --- | --- |
| `id` | TEXT (UUID) | Unique job identifier |
| `rows_a` | INTEGER | Matrix A row count |
| `cols_a` | INTEGER | Matrix A column count |
| `cols_b` | INTEGER | Matrix B column count |
| `workers_used` | INTEGER | Number of workers that participated |
| `chunks_count` | INTEGER | Number of chunks distributed |
| `total_time_ms` | REAL | Total job duration in milliseconds |
| `avg_chunk_time_ms` | REAL | Average compute time per chunk |
| `throughput_mops` | REAL | Throughput in Mops/sec |
| `efficiency_ratio` | REAL | Compute time / total time × 100% |
| `created_at` | TEXT (ISO 8601) | Timestamp of job completion |

**`leaderboard`** — Tracks per-worker contribution stats

| Column | Type | Description |
| --- | --- | --- |
| `worker_id` | TEXT | Unique worker identifier |
| `total_compute_ms` | REAL | Cumulative compute time contributed |
| `tasks_completed` | INTEGER | Total chunks computed |
| `sessions_joined` | INTEGER | Number of sessions participated in |
| `last_seen` | TEXT (ISO 8601) | Last activity timestamp |

---

## 🌐 Remote Connectivity & Deployment

The system is designed to work across different networks without VPN. WebSockets operate over standard HTTP/HTTPS ports (80/443), so no special firewall rules are needed.

### Local Development (Ngrok)
1. Start the Node.js server locally on port `3001`
2. Run `ngrok http 3001` to get a public HTTPS URL (e.g., `https://<id>.ngrok-free.app`)
3. Workers on any device/network connect to this URL via their browser
4. Socket.io server is configured with CORS: `origin: "*"` (dev only)

### Production (Render)
1. Deploy the Node.js server to **Render** as a Web Service
2. Render provides a stable public URL (e.g., `https://distributed-brain.onrender.com`)
3. Socket.io server configured with CORS: `origin: ["https://distributed-brain.vercel.app"]`
4. SQLite database file persists on Render's disk (or upgrade to **PostgreSQL** via Render's managed DB for production scale)

### CORS Configuration
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST"],
  },
});
```

---

## 🧩 Orchestration Architecture

### WorkerPool Management
- Maintains a live registry of connected workers via Socket.io
- Tracks per-worker state: idle, computing, disconnected
- Assigns chunks via round-robin or least-loaded strategy
- Workers can join from any network — local, remote, or mobile

### Job Pipeline
1. **Receive** — Accept job submission (matrix dimensions) from dashboard client
2. **Chunk** — Split Matrix A into N row-slices (one per available worker)
3. **Dispatch** — Emit `compute_task` events with `{ chunkId, matrixAChunk, matrixBFull }` to each worker
4. **Monitor** — Track chunk progress; detect timeouts and disconnects via 30s heartbeat
5. **Recover** — On worker failure, re-queue chunk and reassign to next available worker within 500ms
6. **Aggregate** — Collect all `task_complete` results, stitch row-slices into final matrix
7. **Persist** — Write job metadata and metrics to SQLite
8. **Respond** — Emit aggregated result + compute metrics back to the dashboard

### Fault Detection

| Mechanism | Detail |
| --- | --- |
| Socket.io `disconnect` event | Immediate detection of worker drop |
| 30s heartbeat timeout | Catches silent failures (frozen tabs, network loss) |
| Chunk reassignment | In-progress chunks moved back to pending queue automatically |

---

## 🏁 Summary

The backend is the brain of The Distributed Brain — it orchestrates the entire MapReduce pipeline from job intake to result aggregation and persistence. Built on Node.js with Socket.io for real-time bi-directional communication (configured with CORS for cross-network access), it manages a dynamic WorkerPool, shards matrix computations into parallelizable chunks, and dispatches them across all connected browser workers — regardless of their physical network. Dual-layer fault tolerance (disconnect events + heartbeat timeouts) ensures jobs complete reliably even when workers drop mid-compute. SQLite provides lightweight, zero-config persistence for job history and leaderboard stats, while Ngrok (dev) and Render (prod) expose the server publicly so any device with a browser can join the compute grid.
