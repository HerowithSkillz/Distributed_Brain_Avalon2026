# Backend Setup Guide

This guide provides terminal commands to set up the backend from scratch.

## Initial Setup

### 1. Create Backend Directory and Initialize Project

```bash
mkdir backend
cd backend
npm init -y
```

### 2. Install Production Dependencies

```bash
npm install express socket.io better-sqlite3 cors dotenv uuid
```

### 3. Install Development Dependencies

```bash
npm install --save-dev typescript @types/node @types/express @types/cors @types/better-sqlite3 ts-node nodemon
```

## Configuration Files

All configuration files have been created:

- `tsconfig.json` - TypeScript configuration optimized for Node.js 20+
- `nodemon.json` - Nodemon configuration for development
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules for backend

## Directory Structure

The following directory structure has been created:

```
backend/
├── src/
│   ├── server.ts          # Entry point - HTTP & Socket.io setup
│   ├── app.ts             # Express app configuration
│   ├── socket/
│   │   └── handlers.ts    # Socket.io event handlers
│   ├── database/
│   │   └── index.ts       # SQLite setup and queries
│   └── types/
│       └── index.ts       # TypeScript interfaces
├── dist/                  # Compiled JavaScript (generated)
├── data/                  # SQLite database files (gitignored)
├── node_modules/          # Dependencies (gitignored)
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── tsconfig.json          # TypeScript configuration
├── nodemon.json           # Nodemon configuration
├── package.json           # Project dependencies and scripts
└── README.md              # Documentation
```

## Running the Backend

### Development Mode (with hot reload)

```bash
npm run dev
```

### Build TypeScript to JavaScript

```bash
npm run build
```

### Production Mode

```bash
npm start
```

### Development Mode (without nodemon)

```bash
npm run start:dev
```

## Key Features Implemented

### 1. Server Setup (src/server.ts)
- ✅ HTTP server initialized
- ✅ Socket.io configured with CORS (allows all origins for development)
- ✅ Listens on port 3000 (configurable via .env)
- ✅ Console logs "Orchestrator running on port 3000"
- ✅ Graceful shutdown handling

### 2. Express App (src/app.ts)
- ✅ CORS middleware configured
- ✅ JSON body parser
- ✅ Health check endpoint: GET /health
- ✅ Status endpoint: GET /api/status

### 3. Socket.io Handlers (src/socket/handlers.ts)
- ✅ Worker connection handling
- ✅ Worker registration
- ✅ Heartbeat monitoring
- ✅ Task completion tracking
- ✅ Disconnect handling
- ✅ In-memory worker registry

### 4. Database Setup (src/database/index.ts)
- ✅ SQLite connection with better-sqlite3
- ✅ Write-Ahead Logging (WAL) enabled for performance
- ✅ Jobs table creation
- ✅ Leaderboard table creation
- ✅ Database indexes for optimization
- ✅ Helper functions for CRUD operations

### 5. TypeScript Types (src/types/index.ts)
- ✅ ComputeTask interface
- ✅ TaskResult interface
- ✅ JobMetadata interface
- ✅ WorkerInfo interface
- ✅ LeaderboardEntry interface

## Testing the Server

### 1. Check Server Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T08:26:45.787Z",
  "service": "Distributed Brain Orchestrator"
}
```

### 2. Check Server Status

```bash
curl http://localhost:3000/api/status
```

Expected response:
```json
{
  "status": "running",
  "uptime": 2.924245565,
  "timestamp": "2026-02-10T08:26:45.797Z"
}
```

## Environment Variables

Create a `.env` file (or use the provided `.env.example`):

```env
PORT=3000
ALLOWED_ORIGINS=*
DATABASE_PATH=./data/brain.db
NODE_ENV=development
```

## Next Steps

The basic backend scaffolding is complete. Next steps would include:

1. **Implement Job Distribution Logic**
   - Matrix chunking algorithm
   - Task queue management
   - Worker load balancing

2. **Add Fault Tolerance**
   - Heartbeat timeout detection
   - Chunk reassignment on worker failure
   - Connection retry logic

3. **Implement Result Aggregation**
   - Collect chunk results
   - Stitch matrix rows
   - Calculate performance metrics

4. **Add API Endpoints**
   - Job submission endpoint
   - Job history query
   - Leaderboard API
   - Health metrics

5. **Testing**
   - Unit tests for core functions
   - Integration tests for Socket.io
   - Database migration tests

6. **Deployment**
   - Configure for production (Render)
   - Set up Ngrok for local testing
   - Environment-specific CORS settings

## Troubleshooting

### Port Already in Use

If you see "Error: listen EADDRINUSE", another process is using port 3000:

```bash
# Find the process
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill <PID>
```

### Database Connection Issues

If you encounter database errors:

1. Check that the `data/` directory exists
2. Ensure write permissions for the database file
3. Check DATABASE_PATH in .env file

### TypeScript Compilation Errors

If you see TypeScript errors:

1. Run `npm run build` to see detailed errors
2. Check that all type definitions are installed
3. Verify tsconfig.json settings

## Resources

- [Express Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
