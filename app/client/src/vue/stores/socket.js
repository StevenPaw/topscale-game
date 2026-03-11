import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useLobbyStore } from './lobby'
import { useGameStore } from './game'
import { useUserStore } from './user'

export const useSocketStore = defineStore('socket', () => {
  // State
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionError = ref(null)

  // Get WebSocket URL based on environment
  function getSocketUrl() {
    if (import.meta.env.DEV) {
      // DDEV Development
      return 'http://localhost:3000'
    } else {
      // Production - Nginx proxies /socket.io/ to WebSocket server
      return `https://${window.location.host}`
    }
  }

  // Actions
  function connect() {
    if (socket.value) {
      console.log('Socket already connected')
      return
    }

    const wsUrl = getSocketUrl()
    console.log('Connecting to WebSocket:', wsUrl)

    socket.value = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    setupListeners()
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      console.log('Disconnected from WebSocket')
    }
  }

  function setupListeners() {
    const lobbyStore = useLobbyStore()
    const gameStore = useGameStore()
    const userStore = useUserStore()

    // Connection events
    socket.value.on('connect', () => {
      console.log('✅ WebSocket connected')
      isConnected.value = true
      connectionError.value = null
    })

    socket.value.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      isConnected.value = false
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      connectionError.value = error.message
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
      connectionError.value = error.message
    })

    // Lobby events
    socket.value.on('lobby:created', (data) => {
      console.log('Lobby created:', data)
      lobbyStore.setLobbyCode(data.code)
      lobbyStore.setIsHost(true)
      lobbyStore.players = data.players || []
      lobbyStore.spectators = data.spectators || []
      if (data.settings) {
        lobbyStore.settings = data.settings
      }
    })

    socket.value.on('lobby:joined', (data) => {
      console.log('Joined lobby:', data)
      lobbyStore.setLobbyCode(data.code)
      lobbyStore.players = data.players || []
      lobbyStore.spectators = data.spectators || []
    })

    socket.value.on('lobby:player-joined', (player) => {
      console.log('Player joined:', player)
      lobbyStore.addPlayer(player)
    })

    socket.value.on('lobby:player-left', (data) => {
      console.log('Player left:', data)
      lobbyStore.removePlayer(data.playerId)
    })

    socket.value.on('lobby:spectator-joined', (spectator) => {
      console.log('Spectator joined:', spectator)
      lobbyStore.addSpectator(spectator)
    })

    socket.value.on('lobby:settings-updated', (settings) => {
      console.log('Lobby settings updated:', settings)
      lobbyStore.updateSettings(settings)
    })

    // Game events
    socket.value.on('game:started', (data) => {
      console.log('Game started:', data)
      gameStore.startGame(data.totalRounds)
    })

    socket.value.on('round:started', (data) => {
      console.log('Round started:', data)
      gameStore.setCurrentQuestion(data.question)
      gameStore.setRoundLeader(data.roundLeader)
      gameStore.setTimeRemaining(data.timeLimit)
      gameStore.setGameState('playing')
    })

    socket.value.on('round:answer-received', (answer) => {
      console.log('Answer received:', answer)
      gameStore.addAnswer(answer)
    })

    socket.value.on('round:winner-selected', (data) => {
      console.log('Winner selected:', data)
      gameStore.updateScore(data.winnerId, data.points, data.username)
    })

    socket.value.on('round:ended', (data) => {
      console.log('Round ended:', data)
      gameStore.setGameState('round-results')
    })

    socket.value.on('game:ended', (data) => {
      console.log('Game ended:', data)
      gameStore.setGameState('finished')
      if (data.finalScores) {
        gameStore.setScores(data.finalScores)
      }
      if (data.playedQuestions) {
        gameStore.setPlayedQuestions(data.playedQuestions)
        console.log('📋 Stored played questions:', data.playedQuestions.length)
      }
    })

    socket.value.on('timer:tick', (data) => {
      gameStore.setTimeRemaining(data.timeRemaining)
    })
  }

  // Emit functions
  function createLobby(username) {
    if (!socket.value) {
      console.error('Socket not connected')
      return
    }
    socket.value.emit('lobby:create', { username })
  }

  function joinLobby(code, username, asSpectator = false) {
    if (!socket.value) {
      console.error('Socket not connected')
      return
    }
    socket.value.emit('lobby:join', { code, username, asSpectator })
  }

  function leaveLobby() {
    if (!socket.value) return
    socket.value.emit('lobby:leave')
  }

  function kickPlayer(playerId) {
    if (!socket.value) return
    socket.value.emit('lobby:kick', { playerId })
  }

  function startGame() {
    if (!socket.value) return
    socket.value.emit('game:start')
  }

  function submitAnswer(answerText) {
    if (!socket.value) return
    socket.value.emit('round:submit-answer', { answer: answerText })
  }

  function selectWinner(answerId) {
    if (!socket.value) return
    socket.value.emit('round:select-winner', { answerId })
  }

  function updateLobbySettings(settings) {
    if (!socket.value) return
    socket.value.emit('lobby:configure', settings)
  }

  function restartGame() {
    if (!socket.value) return
    socket.value.emit('game:restart')
  }

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    createLobby,
    joinLobby,
    leaveLobby,
    kickPlayer,
    startGame,
    submitAnswer,
    selectWinner,
    updateLobbySettings,
    restartGame
  }
})
