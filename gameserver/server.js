require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const axios = require('axios')
const https = require('https')

const app = express()
const httpServer = createServer(app)

// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// In-memory storage (replace with Redis for production scaling)
const lobbies = new Map()
const players = new Map()

// API Configuration
const API_URL = process.env.SILVERSTRIPE_API_URL || 'https://topscale-game.ddev.site/api'

// Create axios instance with custom config for development
const apiClient = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Only verify SSL in production
  })
})

console.log(`🚀 Quiz Game WebSocket Server running on port ${process.env.PORT || 3000}`)
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`   API URL: ${API_URL}`)
console.log(`   SSL Verification: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Disabled (dev mode)'}`)

// Helper: Fetch random question from API
async function fetchRandomQuestion(groupIds, excludeIds = []) {
  try {
    const excludeParam = excludeIds.length > 0 ? `&exclude=${excludeIds.join(',')}` : ''
    const url = `${API_URL}/game/questions/random?groupIds=${groupIds.join(',')}${excludeParam}`

    const response = await apiClient.get(url)

    if (response.data.success && response.data.question) {
      return response.data.question
    }

    return null
  } catch (error) {
    console.error('❌ Error fetching question from API:', error.message)
    return null
  }
}

// Helper: Generate 6-character lobby code
function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lobbies.has(code) ? generateLobbyCode() : code
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    lobbies: lobbies.size,
    players: players.size
  })
})

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  // Create Lobby
  socket.on('lobby:create', (data) => {
    const { username } = data
    const code = generateLobbyCode()

    const lobby = {
      code,
      host: socket.id,
      players: [{
        id: socket.id,
        username,
        isHost: true
      }],
      spectators: [],
      settings: {
        questionSetId: null,
        timeLimit: 60,
        maxPlayers: 8,
        totalRounds: 10,
        questionPacks: [1] // Default: Group ID 1
      },
      gameState: 'waiting',
      phase: 'lobby', // lobby, question, sorting, results, podium
      currentRound: 0,
      timer: null, // Store timer reference for stopping
      usedQuestionIds: [], // Track used questions to avoid repeats
      playedQuestions: [] // Track full question objects for game recap
    }

    lobbies.set(code, lobby)
    players.set(socket.id, { lobbyCode: code, username, isHost: true })

    socket.join(code)
    socket.emit('lobby:created', {
      code,
      players: lobby.players,
      spectators: lobby.spectators,
      settings: lobby.settings
    })

    // Send initial state sync
    socket.emit('lobby:state-sync', {
      phase: 'lobby',
      gameState: 'waiting',
      currentRound: 0,
      totalRounds: lobby.settings.totalRounds,
      myRole: 'player', // Host is always a player
      scores: {}
    })

    console.log(`🎮 Lobby created: ${code} by ${username}`)
  })

  // Join Lobby
  socket.on('lobby:join', (data) => {
    const { code, username, asSpectator } = data
    const lobby = lobbies.get(code.toUpperCase())

    if (!lobby) {
      socket.emit('lobby:error', { message: 'Lobby not found' })
      return
    }

    if (!asSpectator && lobby.players.length >= lobby.settings.maxPlayers) {
      socket.emit('lobby:error', { message: 'Lobby is full' })
      return
    }

    const player = {
      id: socket.id,
      username,
      isHost: false
    }

    if (asSpectator) {
      lobby.spectators.push(player)
    } else {
      lobby.players.push(player)
    }

    players.set(socket.id, { lobbyCode: code.toUpperCase(), username, isSpectator: asSpectator })

    socket.join(code.toUpperCase())

    // Send full lobby state to joining player
    socket.emit('lobby:joined', {
      code: code.toUpperCase(),
      players: lobby.players,
      spectators: lobby.spectators,
      settings: lobby.settings
    })

    // Send state sync with current game phase
    socket.emit('lobby:state-sync', {
      phase: lobby.phase || 'lobby',
      gameState: lobby.gameState,
      currentRound: lobby.currentRound,
      totalRounds: lobby.settings.totalRounds,
      myRole: asSpectator ? 'spectator' : (lobby.gameState === 'playing' ? 'spectator' : 'player'), // New players are spectators mid-game
      currentQuestion: lobby.gameState === 'playing' ? { text: 'Game in progress...' } : null,
      scores: lobby.scores || {},
      isSpectatorUntilNextRound: lobby.gameState === 'playing' && !asSpectator
    })

    // Notify others
    socket.to(code.toUpperCase()).emit(asSpectator ? 'lobby:spectator-joined' : 'lobby:player-joined', player)

    console.log(`👤 ${username} joined lobby ${code} as ${asSpectator ? 'spectator' : 'player'}, phase: ${lobby.phase}`)
  })

  // Leave Lobby
  socket.on('lobby:leave', () => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby) return

    // Remove player
    lobby.players = lobby.players.filter(p => p.id !== socket.id)
    lobby.spectators = lobby.spectators.filter(s => s.id !== socket.id)

    socket.to(playerData.lobbyCode).emit('lobby:player-left', { playerId: socket.id })
    socket.leave(playerData.lobbyCode)
    players.delete(socket.id)

    // Delete lobby if empty
    if (lobby.players.length === 0) {
      lobbies.delete(playerData.lobbyCode)
      console.log(`🗑️ Lobby ${playerData.lobbyCode} deleted (empty)`)
    } else if (lobby.host === socket.id) {
      // Transfer host
      lobby.host = lobby.players[0].id
      lobby.players[0].isHost = true
      socket.to(playerData.lobbyCode).emit('lobby:host-changed', { newHost: lobby.players[0] })
    }

    console.log(`👋 ${playerData.username} left lobby ${playerData.lobbyCode}`)
  })

  // Kick Player (host only)
  socket.on('lobby:kick', (data) => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.host !== socket.id) return

    const { playerId } = data
    const kickedPlayer = players.get(playerId)

    if (kickedPlayer) {
      lobby.players = lobby.players.filter(p => p.id !== playerId)
      io.to(playerId).emit('lobby:kicked', { message: 'You were kicked by the host' })
      io.to(playerId).socketsLeave(playerData.lobbyCode)
      players.delete(playerId)

      socket.to(playerData.lobbyCode).emit('lobby:player-left', { playerId })
      console.log(`🚫 Player kicked from lobby ${playerData.lobbyCode}`)
    }
  })

  // Configure Lobby (host only)
  socket.on('lobby:configure', (data) => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.host !== socket.id) return

    lobby.settings = { ...lobby.settings, ...data }
    io.to(playerData.lobbyCode).emit('lobby:settings-updated', lobby.settings)

    console.log(`⚙️ Lobby ${playerData.lobbyCode} settings updated`)
  })

  // Start Game (host only)
  socket.on('game:start', async () => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.host !== socket.id) return

    if (lobby.players.length < 2) {
      socket.emit('game:error', { message: 'Need at least 2 players' })
      return
    }

    lobby.gameState = 'playing'
    lobby.phase = 'question'
    lobby.currentRound = 1
    lobby.scores = {}
    lobby.currentRoundAnswers = []
    lobby.playerScales = {}
    lobby.currentRoundLeader = null
    lobby.playedQuestions = [] // Reset played questions for new game
    lobby.players.forEach(player => {
      lobby.scores[player.id] = 0
    })

    // TODO: Fetch questions from SilverStripe API

    io.to(playerData.lobbyCode).emit('game:started', {
      totalRounds: lobby.settings.totalRounds
    })

    console.log(`🚀 Game started in lobby ${playerData.lobbyCode}`)
    console.log(`🔄 Phase changed to: question (starting) in lobby ${playerData.lobbyCode}`)

    // Start first round after a short delay to allow clients to navigate
    setTimeout(async () => {
      await startRound(lobby)
    }, 1000)
  })

  // Submit Answer (players only, not moderator)
  socket.on('round:submit-answer', (data) => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.currentRoundLeader === socket.id) return

    const answer = {
      id: socket.id,
      playerId: socket.id,
      username: playerData.username,
      text: data.answer,
      scaleValue: lobby.playerScales[socket.id],
      timestamp: Date.now()
    }

    if (!lobby.currentRoundAnswers) {
      lobby.currentRoundAnswers = []
    }

    // Remove old answer if exists
    lobby.currentRoundAnswers = lobby.currentRoundAnswers.filter(a => a.playerId !== socket.id)
    lobby.currentRoundAnswers.push(answer)

    // Send answer count update to moderator
    const nonModeratorPlayers = lobby.players.filter(p => p.id !== lobby.currentRoundLeader)
    io.to(lobby.currentRoundLeader).emit('round:answer-count-update', {
      answersReceived: lobby.currentRoundAnswers.length,
      totalPlayers: nonModeratorPlayers.length
    })

    // Check if all players submitted
    if (lobby.currentRoundAnswers.length === nonModeratorPlayers.length) {
      // Stop the timer
      stopTimer(lobby)

      // Change phase to sorting
      lobby.phase = 'sorting'

      // All answers in, send to moderator for ranking
      const answersWithoutScales = lobby.currentRoundAnswers.map(a => ({
        id: a.id,
        playerId: a.playerId,
        username: a.username,
        text: a.text
      }))

      io.to(lobby.currentRoundLeader).emit('round:all-answers-submitted', {
        answers: answersWithoutScales
      })

      // Notify all players that sorting phase started (including answers for non-moderators)
      io.to(lobby.code).emit('phase:changed', {
        phase: 'sorting',
        message: 'Moderator is ranking the answers...',
        answers: answersWithoutScales
      })

      console.log(`🔄 Phase changed to: sorting in lobby ${lobby.code}`)
    }

    console.log(`✍️ Answer submitted by ${playerData.username} in lobby ${playerData.lobbyCode}`)
  })

// Update Ranking (moderator only) - Live updates for all players
  socket.on('round:update-ranking', (data) => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.currentRoundLeader !== socket.id) return

    const { rankedAnswerIds } = data // Current order being adjusted

    // Broadcast live ranking to all players (except moderator)
    socket.to(playerData.lobbyCode).emit('ranking:live-update', {
      rankedAnswerIds
    })
  })

  // Submit Ranking (moderator only)
  socket.on('round:submit-ranking', (data) => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.currentRoundLeader !== socket.id) return

    const { rankedAnswerIds } = data // Array of answer IDs in order from lowest to highest scale

    // Change phase to results
    lobby.phase = 'results'

    // Check if ranking is correct
    const correctOrder = [...lobby.currentRoundAnswers]
      .sort((a, b) => a.scaleValue - b.scaleValue)
      .map(a => a.id)

    // Count how many answers are correctly positioned
    let correctlyPositioned = 0
    rankedAnswerIds.forEach((answerId, index) => {
      if (correctOrder[index] === answerId) {
        correctlyPositioned++
      }
    })

    // Calculate proportional points: 100 max points per round
    const totalAnswers = rankedAnswerIds.length
    const pointsPerCorrect = 100 / totalAnswers
    const pointsEarned = Math.round(correctlyPositioned * pointsPerCorrect)

    // Initialize moderator score if not exists
    if (!lobby.scores[socket.id]) {
      lobby.scores[socket.id] = 0
    }

    // Add earned points to moderator's score
    lobby.scores[socket.id] += pointsEarned

    const isCorrect = correctlyPositioned === totalAnswers

    // Send results to all players with scale values revealed
    io.to(playerData.lobbyCode).emit('round:results', {
      answers: lobby.currentRoundAnswers,
      moderatorRanking: rankedAnswerIds,
      correctRanking: correctOrder,
      isCorrect,
      correctlyPositioned,
      totalAnswers,
      pointsEarned,
      moderatorId: socket.id,
      scores: lobby.scores,
      nextRound: lobby.currentRound < lobby.settings.totalRounds
    })

    io.to(lobby.code).emit('phase:changed', {
      phase: 'results',
      message: isCorrect ? 'Perfect ranking!' : 'Not quite right!'
    })

    console.log(`📊 Ranking submitted in lobby ${playerData.lobbyCode}: ${correctlyPositioned}/${totalAnswers} correct`)
    console.log(`💰 Moderator earned ${pointsEarned} points (${isCorrect ? 'Perfect!' : 'Partial'})`)
    console.log(`🔄 Phase changed to: results in lobby ${playerData.lobbyCode}`)

    // Store round results with answers in playedQuestions
    if (lobby.playedQuestions && lobby.playedQuestions.length > 0) {
      const currentRoundIndex = lobby.playedQuestions.findIndex(pq => pq.roundNumber === lobby.currentRound)
      if (currentRoundIndex !== -1) {
        lobby.playedQuestions[currentRoundIndex].answers = lobby.currentRoundAnswers
        lobby.playedQuestions[currentRoundIndex].moderatorRanking = rankedAnswerIds
        lobby.playedQuestions[currentRoundIndex].correctRanking = correctOrder
        lobby.playedQuestions[currentRoundIndex].isCorrect = isCorrect
        lobby.playedQuestions[currentRoundIndex].pointsEarned = pointsEarned
        lobby.playedQuestions[currentRoundIndex].moderatorId = socket.id
        lobby.playedQuestions[currentRoundIndex].moderatorUsername = lobby.players.find(p => p.id === socket.id)?.username
      }
    }

    // Move to next round after short delay (to show results)
    setTimeout(async () => {
      lobby.currentRound++

      if (lobby.currentRound > lobby.settings.totalRounds) {
        endGame(lobby)
      } else {
        // Start next round immediately - no navigation needed with new architecture
        console.log(`⏭️ Moving to Round ${lobby.currentRound} in lobby ${lobby.code}`)
        await startRound(lobby)
      }
    }, 3000) // 3 seconds to view results
  })

  // Restart Game (host only)
  socket.on('game:restart', () => {
    const playerData = players.get(socket.id)
    if (!playerData) return

    const lobby = lobbies.get(playerData.lobbyCode)
    if (!lobby || lobby.host !== socket.id) return

    lobby.gameState = 'waiting'
    lobby.currentRound = 0

    io.to(playerData.lobbyCode).emit('game:restarted')
    console.log(`🔄 Game restarted in lobby ${playerData.lobbyCode}`)
  })

  // Disconnect
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id)
    if (playerData) {
      const lobby = lobbies.get(playerData.lobbyCode)
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.id !== socket.id)
        lobby.spectators = lobby.spectators.filter(s => s.id !== socket.id)

        socket.to(playerData.lobbyCode).emit('lobby:player-left', { playerId: socket.id })

        if (lobby.players.length === 0) {
          lobbies.delete(playerData.lobbyCode)
        }
      }
      players.delete(socket.id)
    }
    console.log(`❌ Client disconnected: ${socket.id}`)
  })
})

// Helper: Start a new round
async function startRound(lobby) {
  console.log(`🚀 startRound called for lobby ${lobby.code}, Round ${lobby.currentRound}`)

  // Set phase to question
  lobby.phase = 'question'

  // Select moderator (rotate through players)
  const moderatorIndex = (lobby.currentRound - 1) % lobby.players.length
  lobby.currentRoundLeader = lobby.players[moderatorIndex].id

  console.log(`👑 Moderator for round ${lobby.currentRound}: ${lobby.players[moderatorIndex].username} (ID: ${lobby.currentRoundLeader})`)

  // Always initialize fresh arrays for new round
  lobby.currentRoundAnswers = []
  lobby.playerScales = {}

  // Assign unique scale values 1-10 to each player (except moderator)
  const nonModeratorPlayers = lobby.players.filter(p => p.id !== lobby.currentRoundLeader)
  const scaleValues = shuffleArray([...Array(10).keys()].map(i => i + 1)).slice(0, nonModeratorPlayers.length)

  nonModeratorPlayers.forEach((player, index) => {
    lobby.playerScales[player.id] = scaleValues[index]
    console.log(`🎲 Assigned scale value ${scaleValues[index]} to ${player.username} (ID: ${player.id})`)
  })

  // Fetch question from API based on selected question packs
  const questionPacks = lobby.settings.questionPacks || [1] // Default to group 1
  console.log(`🎲 Fetching question from packs: [${questionPacks.join(', ')}]`)
  let question = await fetchRandomQuestion(questionPacks, lobby.usedQuestionIds || [])

  if (!question) {
    // Fallback to a default question if API fails
    console.warn('⚠️ Could not fetch question from API, using fallback')
    question = {
      id: 0,
      text: 'Name a sad film',
      scaleFrom: 'I had to keep a water drop in',
      scaleTo: 'I have cried extensively'
    }
  } else {
    // Track used question to avoid repeats
    if (!lobby.usedQuestionIds) {
      lobby.usedQuestionIds = []
    }
    lobby.usedQuestionIds.push(question.id)
    console.log(`✅ Fetched question ${question.id}: "${question.text}"`)
  }

  // Store full question object for game recap
  if (!lobby.playedQuestions) {
    lobby.playedQuestions = []
  }
  lobby.playedQuestions.push({
    roundNumber: lobby.currentRound,
    question: question
  })

  // Send individualized round:started to each player
  lobby.players.forEach(player => {
    const isModerator = player.id === lobby.currentRoundLeader
    const scaleValue = isModerator ? null : lobby.playerScales[player.id]

    const roundData = {
      roundNumber: lobby.currentRound,
      totalRounds: lobby.settings.totalRounds,
      question,
      moderator: {
        id: lobby.currentRoundLeader,
        username: lobby.players[moderatorIndex].username
      },
      timeLimit: lobby.settings.timeLimit,
      totalPlayers: nonModeratorPlayers.length,
      // Individual data for this player
      isModerator: isModerator,
      myScaleValue: scaleValue
    }

    io.to(player.id).emit('round:started', roundData)
    console.log(`📤 Sent round:started to ${player.username}: isModerator=${isModerator}, scaleValue=${scaleValue}`)
  })

  // Notify phase change (broadcast to all)
  io.to(lobby.code).emit('phase:changed', {
    phase: 'question',
    message: `Round ${lobby.currentRound} started`
  })

  // Start timer
  startTimer(lobby)

  console.log(`🎲 Round ${lobby.currentRound} started in lobby ${lobby.code}, moderator: ${lobby.players[moderatorIndex].username}`)
  console.log(`🔄 Phase changed to: question (Round ${lobby.currentRound}) in lobby ${lobby.code}`)
}

// Helper: Shuffle array
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Helper: Timer
function startTimer(lobby) {
  // Clear existing timer if any
  stopTimer(lobby)

  let timeRemaining = lobby.settings.timeLimit

  lobby.timer = setInterval(() => {
    timeRemaining--
    io.to(lobby.code).emit('timer:tick', { timeRemaining })

    if (timeRemaining <= 0) {
      stopTimer(lobby)
      io.to(lobby.code).emit('round:time-up')
    }
  }, 1000)
}

// Helper: Stop timer
function stopTimer(lobby) {
  if (lobby.timer) {
    clearInterval(lobby.timer)
    lobby.timer = null
  }
}

// Helper: End game
function endGame(lobby) {
  // Stop any running timer
  stopTimer(lobby)

  // Change phase to podium
  lobby.phase = 'podium'

  // TODO: Calculate final scores and save to database

  const finalScores = {}
  // Use actual scores
  lobby.players.forEach(player => {
    finalScores[player.id] = {
      username: player.username,
      score: lobby.scores[player.id] || 0
    }
  })

  io.to(lobby.code).emit('game:ended', {
    finalScores,
    playedQuestions: lobby.playedQuestions || []
  })
  io.to(lobby.code).emit('phase:changed', {
    phase: 'podium',
    message: 'Game Over!'
  })
  lobby.gameState = 'finished'

  console.log(`🏁 Game ended in lobby ${lobby.code}`)
  console.log(`📋 Total questions played: ${lobby.playedQuestions?.length || 0}`)
}

// Start server
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quiz Game WebSocket Server running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   API URL: ${process.env.SILVERSTRIPE_API_URL || 'not set'}`)
})
