🧠 The Distributed Brain – Project Requirements Document

📋 Functional & Non-Functional Requirements

| Requirement_ID | Description | User Story | Expected Behaviour / Outcome |
| --- | --- | --- | --- |
| FR-001 | Worker Node Registration | As a user, I want to donate my browser's GPU to the compute grid with one click. | Browser detects WebGPU capability via navigator.gpu, registers with orchestrator via Socket.io, and joins the active worker pool instantly. |
| FR-002 | Real-Time Job Submission | As a requestor, I want to submit a matrix computation job and receive results fast. | Dashboard accepts Matrix A and Matrix B dimensions, submits to Node.js orchestrator, receives aggregated result with full metrics. |
| FR-003 | MapReduce Task Distribution | As a developer, I want jobs automatically split and distributed across all workers. | Server chunks Matrix A into N row-slices, dispatches { chunkId, matrixAChunk, matrixBFull } to each available worker in parallel via Socket.io events. |
| FR-004 | WebGPU Compute Execution | As a worker node, I want my GPU to execute the assigned computation natively. | Worker writes data to GPU buffers via device.createBuffer, dispatches WGSL compute shader with workgroup_size(64), reads result via getMappedRange and returns to server. |
| FR-005 | Automatic Fault Tolerance | As a requestor, I want my job to complete even if a worker disconnects mid-compute. | Server detects disconnect via Socket.io event, moves in-progress chunk back to pending queue, reassigns to next available worker within 500ms. Timeline logs the reassignment. |
| FR-006 | Live Execution Timeline | As a user, I want to see every step of my job in real-time with timestamps. | Dashboard streams live logs: Job Submitted → Chunks Created → Workers Assigned → Results Received → Final Aggregation. Each event is timestamped and colour-coded. |
| FR-007 | Worker Contribution Leaderboard | As a worker, I want to see how much compute I've contributed compared to others. | Server tracks { workerId, totalComputeMs, tasksCompleted } per session. Dashboard renders animated top-10 leaderboard with Bronze/Silver/Gold badges. |
| FR-008 | Job History & Replay | As a requestor, I want to save past jobs and re-run them for benchmarking. | All completed jobs stored in IndexedDB with { jobId, dimensions, workersUsed, duration, result }. One-click replay pre-fills submission form. Compare mode shows side-by-side metrics. |
| FR-009 | GPU Utilization Heatmap | As a user, I want to visually see which workers are computing vs idle in real-time. | Worker cards change colour state: 🟢 Idle → 🔵 Transferring → 🔴 Computing → ⚫ Disconnected. Smooth animated transitions on every state change. |
| FR-010 | Network Efficiency Monitor | As a developer, I want proof the system is compute-bound not network-bound. | Dashboard measures and displays: Compute Time, Network Transfer Time, Efficiency Ratio (computeTime / totalTime × 100%), and total data transferred in MB. |
| FR-011 | Compute Metrics Dashboard | As a requestor, I want full performance stats after every job. | Post-job summary shows: Total Time, Workers Used, Chunks Distributed, Average Chunk Time, Throughput in Mops/sec, and Speedup vs single-worker baseline. |
| FR-012 | Live Worker Grid Animation | As a user, I want to see workers join and leave the grid with smooth animations. | Worker cards animate in on connect (scale + fade in) and animate out on disconnect (scale + fade out) using Framer Motion. Each card shows Worker ID, status, and tasks completed. |
| FR-013 | Security — Data-Only Protocol | As a security-conscious user, I want assurance workers never run malicious code. | Workers execute only pre-bundled WGSL shaders compiled client-side. Server transmits raw Float32Arrays only. No arbitrary JavaScript is ever sent or evaluated from server. |
| FR-014 | WebGPU Capability Detection | As a worker, I want the app to detect if my browser supports WebGPU. | On load, system checks navigator.gpu. If unsupported, shows clear error with browser upgrade instructions. If supported, shows GPU adapter info and marks worker as ready. |
| FR-015 | Multi-Worker Scaling Demo | As a presenter, I want to demonstrate linear speedup by adding workers live. | Opening additional browser tabs instantly adds workers to grid. Dashboard shows real-time speedup ratio as worker count increases. Proves distributed value proposition. |
| FR-016 | Result Verification | As a requestor, I want confidence the distributed result is mathematically correct. | Server optionally runs CPU verification on small matrices, compares with GPU result, displays match confirmation. Proves correctness of distributed computation. |
| FR-017 | Session Persistence | As a user, I want my job history and leaderboard to persist across page reloads. | All session data (job history, worker stats, leaderboard) stored in IndexedDB via LocalForage. Automatically restored on app reload. |
| FR-018 | Orchestrator Health Monitor | As a developer, I want to see server-side health metrics during demo. | Dashboard shows: Active Workers, Jobs in Queue, Jobs Completed, Average Response Time, and Socket.io connection status — all updating in real-time. |

| Requirement_ID | Description | Expected Behaviour / Outcome |
| --- | --- | --- |
| NFR-001 | Performance | System should handle matrix jobs without perceptible lag on dashboard. Chunk dispatch latency under 100ms per worker. WebGPU shader execution under 2s for 512×512 matrices. Result aggregation under 50ms. |
| NFR-002 | Scalability | System should work with 1 to 20+ concurrent workers. WorkerPool dynamically scales. Load balancer distributes chunks evenly. No hard-coded worker limits. |
| NFR-003 | UI/UX | Dashboard should look impressive and be immediately understandable to judges. Dark theme with neon accents, real-time animations, colour-coded status indicators, and clear visual hierarchy showing the distributed compute story. |
| NFR-004 | Browser Compatibility | Workers should run on any WebGPU-enabled browser. Tested on Chrome 113+, Edge 113+. Clear unsupported message for Firefox/Safari. No native dependencies — pure browser APIs only. |

⚙️ Technical Stack & Architecture

| Component | Technology / Tool | Description |
| --- | --- | --- |
| Frontend Framework | React + Vite + TypeScript | Fast, typed development environment for dashboard and worker UI |
| Styling | Tailwind CSS + Framer Motion | Dark neon theme with smooth worker card animations and state transitions |
| Compute API | WebGPU (navigator.gpu) | Native GPU compute shaders — NOT WebGL. Direct access to GPU silicon via WGSL |
| Shader Language | WGSL (WebGPU Shading Language) | Compute shaders with workgroup_size(64), var<storage, read> bindings for matrix multiply |
| Communication | Socket.io v4 (TypeScript) | Bi-directional real-time events: compute_task, task_complete, worker_disconnect |
| Backend Orchestrator | Node.js + Express + TypeScript | Job intake, WorkerPool management, chunk dispatch, result aggregation |
| Local Storage | IndexedDB via LocalForage | Persistent job history, leaderboard data, session state |
| Charts & Visualization | Recharts | Metrics dashboard, efficiency breakdown, leaderboard charts |
| Type Safety | TypeScript Interfaces | All Socket.io payloads typed: ComputeTask, TaskResult, WorkerInfo, JobResult |
| Fault Detection | Socket.io disconnect + 30s heartbeat timeout | Dual-layer worker failure detection with automatic chunk reassignment |
| Buffer Management | GPUBufferUsage.STORAGE \| COPY_DST \| COPY_SRC | Correct WebGPU buffer flags for compute + read-back pipeline |

🔬 WebGPU Integration Details

| Item | Specification |
| --- | --- |
| API | navigator.gpu — W3C WebGPU Standard |
| Shader Language | WGSL (WebGPU Shading Language) |
| Workgroup Size | @compute @workgroup_size(64) per shader dispatch |
| Buffer Strategy | Three-buffer model: MatrixA (read) + MatrixB (read) + Result (write) |
| Initialization | gpu.requestAdapter() → adapter.requestDevice() → pipeline compile |
| Execution Flow | createBuffer → writeBuffer → createCommandEncoder → dispatchWorkgroups → mapAsync → getMappedRange |
| Security Model | WGSL compiled client-side only. Server sends Float32Array data exclusively |
| Fallback | CPU-based matrix multiply if WebGPU unavailable — maintains demo functionality |

🧩 Architecture Overview

1. Frontend Layer (React + TypeScript)
	- Worker Node UI: WebGPU status, current task, compute progress
	- Dashboard UI: Job submission, live timeline, metrics, leaderboard, heatmap

2. Orchestration Layer (Node.js + Socket.io)
	- Receives jobs, chunks matrices, manages WorkerPool
	- Dispatches tasks, monitors heartbeats, handles fault recovery
	- Aggregates results, calculates metrics, broadcasts updates

3. Compute Layer (WebGPU + WGSL)
	- Pure GPU execution in worker browser tabs
	- Three-buffer pipeline per task
	- Zero CPU involvement in matrix arithmetic

4. Persistence Layer (IndexedDB)
	- Job history with full metadata
	- Leaderboard stats across sessions
	- Worker contribution records

5. Visualization Layer (Recharts + Framer Motion)
	- Real-time GPU heatmap
	- Animated leaderboard
	- Efficiency breakdown charts
	- Live execution timeline

🆚 Architectural Philosophy Comparison

| Dimension | Mindscribe | The Distributed Brain |
| --- | --- | --- |
| Compute Location | Single device (local) | Many devices (distributed) |
| GPU Usage | WebLLM on your GPU | WebGPU across all GPUs |
| Scaling Model | Vertical (better device) | Horizontal (more devices) |
| Network Dependency | None (fully offline) | Required (core feature) |
| Use Case | Personal AI assistant | Shared compute grid |
| Key Innovation | Privacy-first local LLM | Browser-based supercomputer |
| Data Sensitivity | High (mental health) | Low (pure mathematics) |
| Target User | Individual end users | Researchers, AI labs, students |

Both are valid. Mindscribe solves privacy. We solve scarcity. Different problems, different innovations.

🏁 Summary

The Distributed Brain transforms idle browser GPUs into a collaborative supercomputer. Using WebGPU compute shaders, Socket.io orchestration, and a MapReduce architecture, it enables any device to donate GPU cycles to accelerate matrix computations — the fundamental operation behind AI and scientific research.

Core Thesis: A network of 100 consumer browser GPUs can outperform a single H100 for parallelizable workloads — at zero cost, with no installation, running entirely in a web browser.

📁 Docs Structure

/docs
├── FEATURES.md          ← This file
├── ARCHITECTURE.md      ← Deep technical dive
├── DEMO_SCRIPT.md       ← 5-min presentation flow  
├── TECHNICAL_CHALLENGES.md ← Problems we solved
└── ROADMAP.md           ← Future vision