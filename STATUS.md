# 🧠 The Distributed Brain — Backend Status Report

> **Generated:** February 10, 2026
> **Purpose:** Handoff document for next implementation phase (FR-003: MapReduce)

---

## ✅ What Is DONE

### 1. Project Initialized
- `package.json` created with all dependencies listed
- Scripts configured: `dev`, `build`, `start`

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `nodemon --watch src --exec ts-node src/server.ts` | Hot-reload dev server |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run production build |

### 2. Dependencies Declared (in package.json)

| Type | Packages |
| --- | --- |
| **Prod** | `express`, `socket.io`, `better-sqlite3`, `cors`, `dotenv`, `uuid` |
| **Dev** | `typescript`, `@types/node`, `@types/express`, `@types/cors`, `ts-node`, `nodemon` |

### 3. TypeScript Configuration (`tsconfig.json`)
- **Target:** ES2022
- **Module:** CommonJS
- **Strict Mode:** Enabled
- **OutDir:** `./dist`
- **RootDir:** `./src`

### 4. Directory Structure (Created)

```
backend/
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts          ✅ Written (Entry point + HTTP + Socket.io)
    ├── app.ts             ✅ Written (Express app with CORS)
    ├── socket/
    │   └── index.ts       ✅ Written (Basic connection handler)
    ├── database/          📁 Empty (placeholder)
    └── types/             📁 Empty (placeholder)
```

### 5. Files Written — Current Contents

#### `src/app.ts`
- Creates Express app
- Applies `cors({ origin: "*" })` middleware
- Applies `express.json()` middleware
- Exports `app`

#### `src/server.ts`
- Imports `app` from `./app`
- Creates `http.createServer(app)`
- Creates `Socket.io Server` with CORS `origin: "*"`, methods `["GET", "POST"]`
- Calls `registerSocketHandlers(io)` from `./socket`
- Listens on `PORT` (env) or `3000`
- Logs: `🧠 Orchestrator running on port ${PORT}`

#### `src/socket/index.ts`
- Exports `registerSocketHandlers(io: Server)`
- Listens for `connection` event
- Logs: `⚡ Worker connected: ${socket.id}`
- Listens for `disconnect` event per socket
- Logs: `❌ Worker disconnected: ${socket.id}`

---

## ⚠️ What Is NOT Done Yet

| Item | Status | Required For |
| --- | --- | --- |
| `npm install` (actual install) | ❌ Not run | Everything — **must run first** |
| `.env` file | ❌ Not created | `PORT`, `ALLOWED_ORIGINS` |
| `src/types/` interfaces | ❌ Empty | FR-003 (ComputeTask, JobPayload, ChunkResult) |
| `src/database/` SQLite setup | ❌ Empty | FR-007, FR-008 (Leaderboard, Job History) |
| WorkerPool manager | ❌ Not started | FR-003 (track idle/busy workers) |
| Matrix chunking logic | ❌ Not started | FR-003 (split Matrix A into row-slices) |
| Task dispatch logic | ❌ Not started | FR-003 (emit `compute_task` to workers) |
| Result aggregation logic | ❌ Not started | FR-003 (stitch chunks into final matrix) |
| Fault tolerance | ❌ Not started | FR-005 (re-queue on disconnect) |

---

## 🎯 NEXT TASK: Implement FR-003 (MapReduce Task Distribution)

### What FR-003 Requires (from BACKEND_SPECS.md)

> Server chunks Matrix A into N row-slices, dispatches `{ chunkId, matrixAChunk, matrixBFull }` to each available worker in parallel via Socket.io events.

### Implementation Plan — Files Needed

```
backend/src/
├── types/
│   └── index.ts           ← Define: JobPayload, ComputeTask, ChunkResult, WorkerInfo
├── socket/
│   ├── index.ts           ← Update: route events to handlers
│   └── handlers.ts        ← New: handleJobSubmit, handleTaskComplete
├── services/
│   ├── workerPool.ts      ← New: WorkerPool class (register, remove, getIdle, setBusy)
│   ├── chunker.ts         ← New: splitMatrix(matrixA, rows, cols, numChunks) → chunks[]
│   └── aggregator.ts      ← New: mergeResults(chunks[]) → finalMatrix
└── server.ts              ← No changes needed
```

### TypeScript Interfaces Needed

```typescript
interface JobPayload {
  jobId: string;
  rowsA: number;
  colsA: number;  // must equal rowsB
  colsB: number;
}

interface ComputeTask {
  jobId: string;
  chunkId: number;
  matrixAChunk: number[];   // Float32 row-slice, flattened
  matrixBFull: number[];    // Float32 full matrix B, flattened
  rowsAChunk: number;       // rows in this chunk
  colsA: number;            // cols of A (= rows of B)
  colsB: number;            // cols of B
}

interface ChunkResult {
  jobId: string;
  chunkId: number;
  result: number[];         // Float32 result slice, flattened
  computeTimeMs: number;
}

interface WorkerInfo {
  socketId: string;
  status: "idle" | "computing" | "disconnected";
  currentChunkId: number | null;
  currentJobId: string | null;
}
```

### Socket.io Event Flow (FR-003)

```
Dashboard                    Server                      Workers
   │                           │                            │
   ├── submit_job ────────────►│                            │
   │   { rowsA, colsA, colsB }│                            │
   │                           ├── generate matrices        │
   │                           ├── split A into N chunks    │
   │                           ├── compute_task ──────────►│ (worker 1)
   │                           ├── compute_task ──────────►│ (worker 2)
   │                           ├── compute_task ──────────►│ (worker N)
   │                           │                            │
   │                           │◄──────── task_complete ────┤ (worker 1)
   │                           │◄──────── task_complete ────┤ (worker 2)
   │                           │◄──────── task_complete ────┤ (worker N)
   │                           │                            │
   │                           ├── aggregate results        │
   │◄──────── job_complete ────┤                            │
   │   { finalMatrix, metrics }│                            │
```

---

## 🔧 Immediate Action Required

Before any feature work, run these commands:

```powershell
cd e:\Work\Hackathon_Internships\Avalon\project\Distributed_Brain_Avalon2026\backend
npm install
```

Then verify the scaffold works:

```powershell
npm run dev
# Expected output: 🧠 Orchestrator running on port 3000
```

---

## 📐 Architecture Decisions (Locked In)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Module system | CommonJS (`require`) | `better-sqlite3` is native C++, simpler with CJS |
| Database | `better-sqlite3` raw SQL | SYSTEM_PROMPT forbids ORMs; raw SQL for performance |
| CORS | `origin: "*"` (dev) | Remote workers on any network; lock down in prod |
| Worker IDs | `socket.id` | Ephemeral; no auth needed for hackathon |
| Matrix format | Flattened `number[]` | Maps directly to `Float32Array` for WebGPU buffers |
| Chunk strategy | Row-slice of Matrix A | Each chunk × full B = independent computation |