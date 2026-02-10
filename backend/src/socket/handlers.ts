/**
 * Socket.io event handlers for worker management
 * 
 * This module will handle:
 * - Worker registration and tracking
 * - Task distribution
 * - Result aggregation
 * - Heartbeat monitoring
 * - Fault tolerance
 */

import { Socket } from 'socket.io';
import { WorkerInfo, TaskResult } from '../types';

// Worker registry (in-memory for now)
const workers: Map<string, WorkerInfo> = new Map();

export function handleWorkerConnection(socket: Socket): void {
  console.log(`⚡ Worker connected: ${socket.id}`);
  
  // Initialize worker info
  const workerInfo: WorkerInfo = {
    id: socket.id,
    socketId: socket.id,
    status: 'idle',
    tasksCompleted: 0,
    totalComputeMs: 0,
    lastSeen: new Date()
  };
  
  workers.set(socket.id, workerInfo);

  // Handle worker registration
  socket.on('register_worker', (data: { deviceInfo?: string }) => {
    console.log(`🔧 Worker registered: ${socket.id}`, data);
    socket.emit('registration_ack', {
      workerId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle heartbeat
  socket.on('heartbeat', () => {
    const worker = workers.get(socket.id);
    if (worker) {
      worker.lastSeen = new Date();
      socket.emit('heartbeat_ack', {
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle task completion
  socket.on('task_complete', (result: TaskResult) => {
    const worker = workers.get(socket.id);
    if (worker) {
      worker.tasksCompleted++;
      worker.totalComputeMs += result.computeTimeMs;
      worker.status = 'idle';
      console.log(`✅ Task completed by ${socket.id}: ${result.chunkId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason: string) => {
    console.log(`❌ Worker disconnected: ${socket.id}, Reason: ${reason}`);
    const worker = workers.get(socket.id);
    if (worker) {
      worker.status = 'disconnected';
    }
    // Note: We don't remove from map immediately to track stats
  });
}

export function getConnectedWorkers(): WorkerInfo[] {
  return Array.from(workers.values()).filter(w => w.status !== 'disconnected');
}

export function getWorkerById(workerId: string): WorkerInfo | undefined {
  return workers.get(workerId);
}
