import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLobbyStore = defineStore('lobby', () => {
  // State
  const lobbyCode = ref('')
  const isHost = ref(false)
  const players = ref([])
  const spectators = ref([])
  const settings = ref({
    questionSetId: null,
    questionSetTitle: '',
    timeLimit: 60, // seconds
    maxPlayers: 8,
    totalRounds: 10
  })

  // Getters
  const playerCount = computed(() => players.value.length)
  const spectatorCount = computed(() => spectators.value.length)
  const isLobbyFull = computed(() => players.value.length >= settings.value.maxPlayers)
  const allPlayers = computed(() => [...players.value, ...spectators.value])

  // Actions
  function setLobbyCode(code) {
    lobbyCode.value = code.toUpperCase()
  }

  function setIsHost(value) {
    isHost.value = value
  }

  function addPlayer(player) {
    if (!players.value.find(p => p.id === player.id)) {
      players.value.push(player)
    }
  }

  function removePlayer(playerId) {
    players.value = players.value.filter(p => p.id !== playerId)
  }

  function addSpectator(spectator) {
    if (!spectators.value.find(s => s.id === spectator.id)) {
      spectators.value.push(spectator)
    }
  }

  function removeSpectator(spectatorId) {
    spectators.value = spectators.value.filter(s => s.id !== spectatorId)
  }

  function updateSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
  }

  function reset() {
    lobbyCode.value = ''
    isHost.value = false
    players.value = []
    spectators.value = []
    settings.value = {
      questionSetId: null,
      questionSetTitle: '',
      timeLimit: 60,
      maxPlayers: 8,
      totalRounds: 10
    }
  }

  return {
    lobbyCode,
    isHost,
    players,
    spectators,
    settings,
    playerCount,
    spectatorCount,
    isLobbyFull,
    allPlayers,
    setLobbyCode,
    setIsHost,
    addPlayer,
    removePlayer,
    addSpectator,
    removeSpectator,
    updateSettings,
    reset
  }
})
