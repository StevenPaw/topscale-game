# 🚀 Nächste Schritte - Implementation abgeschlossen!

## ✅ Was wurde erstellt:

### Frontend (Vue 3)
- ✅ Vue 3 + Pinia + Vue Router Setup
- ✅ Alle Views (Home, Lobby Join/Create/Wait, Game, Scoreboard)
- ✅ Stores (user, lobby, game, socket)
- ✅ API Service (axios)
- ✅ Socket.io Client Integration
- ✅ Custom CSS (kein Tailwind)

### WebSocket Server (Node.js)
- ✅ Express + Socket.io Server (`gameserver/server.js`)
- ✅ Lobby Management (erstellen, beitreten, kicken)
- ✅ Game Logic (Runden, Antworten, Gewinner-Auswahl)
- ✅ Docker Support
- ✅ .env Configuration

### DDEV Integration
- ✅ docker-compose.websocket.yaml (automatischer Start)
- ✅ nginx WebSocket Proxy Config
- ✅ Environment Variables

### Configuration
- ✅ package.json mit Vue 3 Dependencies
- ✅ vite.config.js mit Vue Plugin
- ✅ README.md Dokumentation

---

## 🔧 Was du jetzt tun musst:

### 1. Dependencies installieren

```bash
# Frontend Dependencies (Vue 3, Pinia, Socket.io, etc.)
ddev yarn install

# WebSocket Server Dependencies (wird automatisch von DDEV gemacht)
# Aber du kannst auch manuell machen:
cd gameserver && npm install && cd ..
```

### 2. DDEV neu starten

```bash
# Docker Compose für WebSocket wird geladen
ddev restart

# Prüfe, ob WebSocket Server läuft
ddev logs -s websocket

# Du solltest sehen:
# "🚀 Quiz Game WebSocket Server running on port 3000"
```

### 3. Vite Dev Server starten

```bash
# In einem separaten Terminal
yarn dev

# Oder via DDEV
ddev exec yarn dev
```

### 4. App testen

**Öffne in deinem Browser:**
- Vue App: http://localhost:5173
- SilverStripe: https://topscale-game.ddev.site/admin

**Test-Flow:**
1. Öffne http://localhost:5173
2. Gib einen Namen ein
3. Klicke "Create New Lobby"
4. Öffne zweiten Browser-Tab
5. Gib anderen Namen ein
6. Klicke "Join Existing Lobby"
7. Gib den Lobby-Code ein
8. Du solltest beide Spieler in der Lobby sehen!

---

## 🗄️ Backend Tasks (was DU machen musst):

Da du das Backend selbst baust, hier die TODOs:

### 1. DataObjects erstellen

Du hast bereits `Answer.php` - erstelle auch:

```
app/src/Models/
├── User.php              # Custom User (nicht Member!)
├── QuestionSet.php       # Fragensets
├── Question.php          # Einzelne Fragen
├── GameSession.php       # Spiel-Sessions
└── Round.php             # Runden
```

Nach jedem neuen DataObject:
```bash
ddev exec vendor/bin/sake dev/build flush=1
```

### 2. ModelAdmin erstellen

```php
# app/src/Admin/QuizAdmin.php
<?php
namespace App\Admin;

use SilverStripe\Admin\ModelAdmin;
use App\Models\QuestionSet;
use App\Models\Question;

class QuizAdmin extends ModelAdmin
{
    private static $managed_models = [
        QuestionSet::class,
        Question::class,
    ];
    
    private static $url_segment = 'quiz';
    private static $menu_title = 'Quiz Management';
}
```

### 3. API Controller erstellen

```php
# app/src/Controllers/APIController.php
<?php
namespace App\Controllers;

use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use App\Models\QuestionSet;
use App\Models\Question;

class APIController extends Controller
{
    private static $url_segment = 'api';
    
    private static $allowed_actions = [
        'questionsets',
        'questions',
    ];

    public function questionsets(HTTPRequest $request)
    {
        $sets = QuestionSet::get()->filter('IsActive', true);
        return $this->jsonResponse($sets->toNestedArray());
    }
    
    private function jsonResponse($data)
    {
        $this->getResponse()->addHeader('Content-Type', 'application/json');
        return json_encode($data);
    }
}
```

Register in `app/_config/routes.yml`:
```yaml
SilverStripe\Control\Director:
  rules:
    'api/$Action/$ID': 'App\Controllers\APIController'
```

### 4. Testdaten erstellen

Über den ModelAdmin (https://topscale-game.ddev.site/admin/quiz):
1. Erstelle ein QuestionSet (z.B. "Allgemeinwissen DE")
2. Füge 10+ Questions hinzu
3. Markiere QuestionSet als "IsActive"

---

## 🧪 Testing

### WebSocket Server testen

```bash
# Health check
curl http://localhost:3000/health

# Sollte antworten mit:
# {"status":"ok","lobbies":0,"players":0}
```

### Socket.io Events testen

```bash
# Installiere wscat
npm install -g wscat

# Verbinde
wscat -c ws://localhost:3000

# Sende Event (im wscat prompt):
{"type":"lobby:create","data":{"username":"TestUser"}}
```

### Vue App testen

1. Öffne Browser Console (F12)
2. Gehe zu http://localhost:5173
3. Schaue auf Console Logs
4. Du solltest sehen:
   - "Quiz Game App mounted"
   - Keine Fehler

---

## 📝 Bekannte TODOs

### Im WebSocket Server (gameserver/server.js)

Suche nach `// TODO:` Kommentaren:

1. **Fragen von API laden** (Zeile ~240):
   ```javascript
   // TODO: Fetch questions from SilverStripe API
   const response = await axios.get(`${process.env.SILVERSTRIPE_API_URL}/questions/random?set=${lobby.settings.questionSetId}&count=${lobby.settings.totalRounds}`)
   ```

2. **Stats speichern** (Zeile ~320):
   ```javascript
   // TODO: Save to database
   await axios.post(`${process.env.SILVERSTRIPE_API_URL}/game-sessions`, {...})
   ```

3. **Scores berechnen** (Zeile ~370):
   ```javascript
   // TODO: Calculate final scores and save to database
   ```

Diese TODOs kannst du implementieren, sobald deine SilverStripe API steht!

---

## 🐛 Troubleshooting

### "Cannot connect to WebSocket"

```bash
# Prüfe, ob Server läuft
ddev logs -s websocket

# Restart WebSocket
ddev restart websocket

# Manuell starten (debug)
cd gameserver
node server.js
```

### "Module not found" Fehler

```bash
# Frontend
rm -rf node_modules
yarn install

# WebSocket Server
cd gameserver
rm -rf node_modules
npm install
```

### Vite startet nicht

```bash
# Port 5173 freigeben
lsof -i :5173
kill -9 <PID>

# Oder anderen Port nutzen
yarn dev --port 5174
```

---

## 📚 Nächste Features

Wenn alles läuft, kannst du erweitern:

1. **Timer Visualisierung** - Countdown-Animation im Frontend
2. **Sound Effects** - Beim Beitreten, Antworten, Gewinner
3. **Animationen** - Smooth Transitions zwischen Views
4. **Leaderboard** - Persistente Top-Scores aus Datenbank
5. **Avatar System** - Spieler können Avatare wählen
6. **Chat System** - Lobby-Chat via Socket.io
7. **Admin Dashboard** - Live-Spiel-Monitoring

---

## ✅ Ready to Play!

Wenn alles läuft:
1. Erstelle Fragensets im Admin
2. Öffne die App
3. Erstelle eine Lobby
4. Spiele mit Freunden! 🎮

Bei Fragen oder Problemen, schau in die Logs:
```bash
ddev logs -s websocket    # WebSocket Server
ddev logs                 # SilverStripe
```

**Viel Erfolg! 🚀**
