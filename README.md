# Topscale Quiz Game 🎮

Multiplayer quiz game mit Lobby-System, rundenbasiertem Gameplay und Echtzeit-Kommunikation via WebSocket.

## Features

- ✅ Lobby-System mit 6-stelligen Codes
- ✅ 2-8 Spieler + Spectator Mode
- ✅ Freitext-Antworten mit Rundenleiter-Bewertung
- ✅ Konfigurierbares QuestionSet und Zeitlimit
- ✅ Echtzeit via Socket.io
- ✅ Mobile-optimiert
- ✅ SilverStripe Backend für User, Fragen und Statistiken

## Tech Stack

**Frontend:** Vue 3, Pinia, Vue Router, Socket.io Client, Vite, Custom SCSS  
**Backend:** SilverStripe 6, Node.js + Socket.io, MySQL  
**Dev:** DDEV, Yarn, Docker

## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Start DDEV (includes SilverStripe + WebSocket server)
ddev start

# 3. Build database
ddev exec vendor/bin/sake dev/build flush=1

# 4. Start Vite dev server (separate terminal)
yarn dev

# 5. Open app
# - Vue App: http://localhost:5173
# - SilverStripe: https://topscale-game.ddev.site
# - Admin: https://topscale-game.ddev.site/admin
```

## Project Structure

```
├── .ddev/                     # DDEV config (WebSocket auto-start)
├── app/
│   ├── client/src/vue/        # Vue 3 App
│   │   ├── stores/            # Pinia (user, lobby, game, socket)
│   │   ├── views/             # Pages (Home, Lobby, Game, etc.)
│   │   └── router/            # Vue Router
│   └── src/                   # SilverStripe PHP
│       ├── Models/            # DataObjects (User, Question, etc.)
│       └── Controllers/       # API Controllers
├── gameserver/                # Node.js WebSocket Server
│   ├── server.js              # Socket.io logic
│   └── .env                   # Config
├── vite.config.js             # Vite setup (includes Vue plugin)
└── package.json               # Vue 3, Pinia, Socket.io dependencies
```

## Development Workflow

```bash
# Terminal 1: DDEV (auto-starts WebSocket)
ddev start

# Terminal 2: Vite dev server
yarn dev

# Check WebSocket logs
ddev logs -s websocket

# Build for production
yarn build
```

## WebSocket Server

Automatically starts with DDEV via `.ddev/docker-compose.websocket.yaml`.

**Standalone:**
```bash
cd gameserver
npm install
npm run dev  # or: npm start
```

**Health check:** http://localhost:3000/health

## Backend (SilverStripe)

Add DataObjects in `app/src/Models/`, then:
```bash
ddev exec vendor/bin/sake dev/build flush=1
```

## Deployment

See detailed deployment guide in [/memories/session/plan.md](/memories/session/plan.md).

**Production:** Docker (gameserver) + CloudPanel (SilverStripe) + nginx proxy for WebSocket

## Troubleshooting

**WebSocket not connecting:**
```bash
curl http://localhost:3000/health
ddev logs -s websocket
ddev restart websocket
```

**Vite errors:**
```bash
yarn install
rm -rf node_modules && yarn install
```

## Credits

Built with [SilverStripe](https://silverstripe.org/), [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), and [Socket.io](https://socket.io/)
