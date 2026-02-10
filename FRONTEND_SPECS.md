# 🖥️ The Distributed Brain – Frontend Specifications

> **Focus:** React, WebGPU, UI/UX, Socket.io Client

---

## 📋 High Priority Features (Top 5)

| Requirement_ID | Priority | Description | User Story | Expected Behaviour / Outcome |
| --- | --- | --- | --- | --- |
| FR-001 | **P0 - Critical** | Worker Node Registration | As a user, I want to donate my browser's GPU to the compute grid with one click. | Browser detects WebGPU capability via `navigator.gpu`, sends registration event to orchestrator via Socket.io client (connecting to the public server URL), and joins the active worker pool instantly. |
| FR-002 | **P0 - Critical** | Real-Time Job Submission (Client) | As a requestor, I want to submit a matrix computation job and receive results fast. | Dashboard accepts Matrix A and Matrix B dimensions, sends job payload to the server via Socket.io, and renders the aggregated result with full metrics upon response. |
| FR-004 | **P0 - Critical** | WebGPU Compute Execution | As a worker node, I want my GPU to execute the assigned computation natively. | Worker writes data to GPU buffers via `device.createBuffer`, dispatches WGSL compute shader with `workgroup_size(64)`, reads result via `getMappedRange`, and emits the result back to the server. |
| FR-009 | P1 - High | GPU Utilization Heatmap | As a user, I want to visually see which workers are computing vs idle in real-time. | Worker cards change colour state: 🟢 Idle → 🔵 Transferring → 🔴 Computing → ⚫ Disconnected. Smooth animated transitions on every state change. |
| FR-014 | P1 - High | WebGPU Capability Detection | As a worker, I want the app to detect if my browser supports WebGPU. | On load, system checks `navigator.gpu`. If unsupported, shows clear error with browser upgrade instructions. If supported, shows GPU adapter info and marks worker as ready. |

## 📋 Additional Frontend Requirements

| Requirement_ID | Description | User Story | Expected Behaviour / Outcome |
| --- | --- | --- | --- |
| FR-006 | Live Execution Timeline | As a user, I want to see every step of my job in real-time with timestamps. | Dashboard streams live logs: Job Submitted → Chunks Created → Workers Assigned → Results Received → Final Aggregation. Each event is timestamped and colour-coded. |
| FR-008 | Job History & Replay (Client) | As a requestor, I want to save past jobs and re-run them for benchmarking. | Completed jobs fetched from the server (persisted in SQLite) and cached locally. One-click replay pre-fills submission form. Compare mode shows side-by-side metrics. |
| FR-011 | Compute Metrics Dashboard | As a requestor, I want full performance stats after every job. | Post-job summary shows: Total Time, Workers Used, Chunks Distributed, Average Chunk Time, Throughput in Mops/sec, and Speedup vs single-worker baseline. |
| FR-012 | Live Worker Grid Animation | As a user, I want to see workers join and leave the grid with smooth animations. | Worker cards animate in on connect (scale + fade in) and animate out on disconnect (scale + fade out) using Framer Motion. Each card shows Worker ID, status, and tasks completed. |
| FR-015 | Multi-Worker Scaling Demo | As a presenter, I want to demonstrate linear speedup by adding workers live. | Opening additional browser tabs (even on remote devices via the public URL) instantly adds workers to grid. Dashboard shows real-time speedup ratio as worker count increases. |
| FR-017 | Session Persistence | As a user, I want my job history and leaderboard to persist across page reloads. | Session data cached in IndexedDB via LocalForage for fast local access. Source of truth is the server-side SQLite database. Automatically restored on app reload. |

## 📋 Non-Functional Requirements (Frontend)

| Requirement_ID | Description | Expected Behaviour / Outcome |
| --- | --- | --- |
| NFR-003 | UI/UX | Dashboard should look impressive and be immediately understandable to judges. Dark theme with neon accents, real-time animations, colour-coded status indicators, and clear visual hierarchy showing the distributed compute story. |
| NFR-004 | Browser Compatibility | Workers should run on any WebGPU-enabled browser. Tested on Chrome 113+, Edge 113+. Clear unsupported message for Firefox/Safari. No native dependencies — pure browser APIs only. |

---

## ⚙️ Tech Stack

| Component | Technology |
| --- | --- |
| Frontend Framework | React + Vite + TypeScript |
| Styling & Animation | Tailwind CSS + Framer Motion |
| Compute API | WebGPU (`navigator.gpu`) + WGSL |
| Communication | Socket.io-client (v4, TypeScript) — connects to **public server URL** (Ngrok tunnel or Render deployment) |
| Local Cache | IndexedDB via LocalForage |
| Charts | Recharts |

### 🌐 Remote Connectivity (Client Side)

- The Socket.io client connects to the server's **public HTTPS URL** — no VPN required.
- In **local dev**, the server is exposed via **Ngrok** (e.g., `https://<id>.ngrok-free.app`).
- In **production**, the server is deployed on **Render** (e.g., `https://distributed-brain.onrender.com`).
- WebSockets operate over standard HTTP/HTTPS ports (80/443), so any device on any network (home Wi-Fi, mobile data, office LAN) can join the compute grid by simply opening the URL in a browser.
- The server URL is configured via an environment variable (`VITE_SERVER_URL`) at build time.

---

## 🔬 WebGPU Integration Details

| Item | Specification |
| --- | --- |
| API | `navigator.gpu` — W3C WebGPU Standard |
| Shader Language | WGSL (WebGPU Shading Language) |
| Workgroup Size | `@compute @workgroup_size(64)` per shader dispatch |
| Buffer Strategy | Three-buffer model: MatrixA (read) + MatrixB (read) + Result (write) |
| Initialization | `gpu.requestAdapter()` → `adapter.requestDevice()` → pipeline compile |
| Execution Flow | `createBuffer` → `writeBuffer` → `createCommandEncoder` → `dispatchWorkgroups` → `mapAsync` → `getMappedRange` |
| Security Model | WGSL compiled client-side only. Server sends `Float32Array` data exclusively |
| Fallback | CPU-based matrix multiply if WebGPU unavailable — maintains demo functionality |

---

## 🏁 Summary

The frontend is the face of The Distributed Brain — it turns any browser tab into a GPU compute node and presents the entire distributed pipeline through an intuitive, visually striking dashboard. By leveraging WebGPU for native GPU execution and Socket.io-client for real-time communication over a public HTTPS URL, each connected browser — whether on a laptop in Mumbai or a phone in Delhi — contributes meaningful compute power without any VPN or special network setup. The dashboard provides live worker heatmaps, animated grid views, execution timelines, and performance metrics, making the distributed supercomputer tangible and impressive to both end users and demo audiences.
