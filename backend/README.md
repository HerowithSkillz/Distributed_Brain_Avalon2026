# Distributed Brain - Backend Orchestrator

The backend orchestrator for The Distributed Brain, a browser-based distributed computing grid that manages ephemeral WebSocket connections, shards matrix jobs, and persists data to SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your `.env` file).

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload (using nodemon)
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run start:dev` - Start development server (without nodemon)
- `npm run watch` - Watch TypeScript files and rebuild on changes

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts          # Entry point - HTTP & Socket.io setup
│   ├── app.ts             # Express app configuration
│   ├── socket/            # Socket.io event handlers
│   ├── database/          # SQLite setup and queries
│   └── types/             # TypeScript interfaces
├── dist/                  # Compiled JavaScript (generated)
├── data/                  # SQLite database files (gitignored)
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
├── nodemon.json           # Nodemon configuration
└── package.json           # Project dependencies
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: *)
- `DATABASE_PATH` - SQLite database file path (default: ./data/brain.db)
- `NODE_ENV` - Node environment (development/production)

## 🌐 API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/status` - Server status and uptime

## 🔌 Socket.io Events

### Client → Server
- `register_worker` - Register a new worker
- `heartbeat` - Worker heartbeat

### Server → Client
- `registration_ack` - Worker registration acknowledgment
- `heartbeat_ack` - Heartbeat acknowledgment

## 🛠️ Tech Stack

- **Runtime:** Node.js 20+
- **HTTP Framework:** Express
- **Communication:** Socket.io v4
- **Language:** TypeScript (Strict mode)
- **Database:** SQLite via better-sqlite3
- **Dev Tools:** ts-node, nodemon

## 📦 Dependencies

### Production
- `express` - Web framework
- `socket.io` - Real-time bidirectional communication
- `better-sqlite3` - Fast SQLite3 library
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `uuid` - UUID generation

### Development
- `typescript` - TypeScript compiler
- `@types/*` - Type definitions
- `ts-node` - TypeScript execution
- `nodemon` - Development server with auto-restart

## 🚢 Deployment

### Local Development with Ngrok
1. Start the server: `npm run dev`
2. In another terminal: `ngrok http 3000`
3. Use the generated ngrok URL for remote connections

### Production (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy as Web Service

## 📝 License

ISC
