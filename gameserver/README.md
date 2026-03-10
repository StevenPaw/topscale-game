# Topscale Quiz Game - WebSocket Server

Real-time multiplayer quiz game server using Socket.io.

## Development (DDEV)

The WebSocket server starts automatically with `ddev start` via `.ddev/docker-compose.websocket.yaml`.

```bash
# Start DDEV (includes WebSocket server)
ddev start

# Check WebSocket server logs
ddev logs -s websocket

# Restart WebSocket server
ddev restart websocket
```

The server runs on `http://localhost:3000` and is accessible via `ws://localhost:3000`.

## Development (Manual)

```bash
cd gameserver

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start dev server (with auto-reload)
npm run dev

# Or start production mode
npm start
```

## Production Deployment

### Option 1: Docker Compose (Standalone)

```bash
cd gameserver
docker-compose up -d
```

### Option 2: System Service (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start server.js --name quiz-game-websocket

# Setup auto-start on boot
pm2 startup
pm2 save

# View logs
pm2 logs quiz-game-websocket

# Restart
pm2 restart quiz-game-websocket
```

## Environment Variables

See `.env.example` for all configuration options.

Required variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `SILVERSTRIPE_API_URL` - SilverStripe API endpoint
- `ALLOWED_ORIGINS` - CORS allowed origins

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and statistics.

## Socket.io Events

### Client → Server

- `lobby:create` - Create a new lobby
- `lobby:join` - Join existing lobby
- `lobby:leave` - Leave lobby
- `lobby:kick` - Kick player (host only)
- `lobby:configure` - Update lobby settings (host only)
- `game:start` - Start game (host only)
- `round:submit-answer` - Submit answer to round
- `round:select-winner` - Select round winner (round leader only)
- `game:restart` - Restart game (host only)

### Server → Client

- `lobby:created` - Lobby successfully created
- `lobby:joined` - Successfully joined lobby
- `lobby:player-joined` - Another player joined
- `lobby:player-left` - Player left lobby
- `lobby:spectator-joined` - Spectator joined
- `lobby:settings-updated` - Lobby settings changed
- `lobby:error` - Lobby operation error
- `game:started` - Game has started
- `round:started` - New round started
- `round:answer-received` - Answer received (round leader only)
- `round:winner-selected` - Winner selected for round
- `round:time-up` - Round time expired
- `timer:tick` - Timer update (every second)
- `game:ended` - Game finished
- `game:restarted` - Game restarted

## Architecture

```
Client (Vue 3) 
    ↕ Socket.io
WebSocket Server (Node.js)
    ↕ HTTP
SilverStripe API (Questions, Stats)
```

## Testing

```bash
# Test with wscat
npm install -g wscat
wscat -c ws://localhost:3000
```

## Logs

Development logs are output to console.

Production logs with PM2:
```bash
pm2 logs quiz-game-websocket
```

## License

MIT
