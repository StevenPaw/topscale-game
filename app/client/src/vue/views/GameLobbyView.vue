<template>
  <div class="game-lobby-view">
    <!-- Loading state -->
    <div v-if="!lobbyCode || loading" class="loading-state" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center;">
        <div style="display: inline-block; width: 60px; height: 60px; border: 4px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: var(--text-secondary);">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- Main content - Phase-based rendering using existing views -->
    <div v-else>
      <!-- Lobby/Waiting Phase -->
      <LobbyWaitView v-if="gameStore.phase === 'lobby'" />

      <!-- Question/Answer Phase -->
      <GameView v-else-if="gameStore.phase === 'question'" />

      <!-- Sorting/Results Phase -->
      <RoundResultsView v-else-if="gameStore.phase === 'sorting' || gameStore.phase === 'results'" />

      <!-- Podium/Final Scoreboard Phase -->
      <ScoreboardView v-else-if="gameStore.phase === 'podium'" />

      <!-- Unknown phase fallback -->
      <div v-else style="padding: 2rem; text-align: center;">
        <p>Unknown phase: {{ gameStore.phase }}</p>
        <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.875rem;">
          This might indicate a synchronization issue. Try refreshing the page.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useLobbyStore } from '../stores/lobby'
import { useSocketStore } from '../stores/socket'
import { useUserStore } from '../stores/user'

// Existing views (now used as phase components)
import LobbyWaitView from './LobbyWaitView.vue'
import GameView from './GameView.vue'
import RoundResultsView from './RoundResultsView.vue'
import ScoreboardView from './ScoreboardView.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()
const userStore = useUserStore()

const loading = ref(true)
const loadingMessage = ref('Connecting to lobby...')
const lobbyCode = computed(() => route.params.code?.toUpperCase())

onMounted(async () => {
  console.log('🎮 GameLobbyView mounted for lobby:', lobbyCode.value)

  if (!lobbyCode.value) {
    router.push('/')
    return
  }

  // Connect to socket if not already connected
  if (!socketStore.isConnected) {
    loadingMessage.value = 'Connecting to server...'
    await socketStore.connect()
  }

  // Setup global socket listeners for phase changes
  setupSocketListeners()

  // Check if user has joined this lobby or needs to join
  if (lobbyStore.lobbyCode !== lobbyCode.value) {
    // Need to join/create this lobby
    loadingMessage.value = 'Joining lobby...'
    // The joining logic is handled by the views themselves for now
    // This will be refactored when we implement lobby:state-sync
  }

  loading.value = false
})

onUnmounted(() => {
  cleanupSocketListeners()
})

function setupSocketListeners() {
  // Listen for round started (MUST be registered before phase changes to 'question')
  socketStore.socket?.on('round:started', (data) => {
    console.log('🎮 GameLobbyView received round:started', data)
    console.log('🎮 Am I moderator?', data.isModerator, 'Scale value:', data.myScaleValue)

    // Store all round data in game store
    gameStore.setRoundData(data)
  })

  // Listen for phase changes from server
  socketStore.socket?.on('phase:changed', (data) => {
    console.log('🔄 Server changed phase to:', data.phase)
    gameStore.setPhase(data.phase)

    // Handle phase-specific data
    if (data.phase === 'sorting' && data.answers) {
      // Store answers for non-moderators when entering sorting phase
      if (!gameStore.isModerator) {
        gameStore.setAnswersForRanking(data.answers)
        console.log('📝 Stored answers for ranking view (non-moderator)')
      }
    }
  })

  // Listen for lobby state sync (when joining/rejoining)
  socketStore.socket?.on('lobby:state-sync', (data) => {
    console.log('💾 Received lobby state sync:', data)
    gameStore.setPhase(data.phase || 'lobby')
    gameStore.setMyRole(data.myRole || 'spectator')

    if (data.currentRound) {
      gameStore.currentRound = data.currentRound
      gameStore.totalRounds = data.totalRounds || 10
    }

    if (data.currentQuestion) {
      gameStore.setCurrentQuestion(data.currentQuestion)
    }

    if (data.scores) {
      gameStore.setScores(data.scores)
    }

    if (data.myScaleValue !== undefined) {
      gameStore.setMyScaleValue(data.myScaleValue)
    }
  })
}

function cleanupSocketListeners() {
  socketStore.socket?.off('round:started')
  socketStore.socket?.off('phase:changed')
  socketStore.socket?.off('lobby:state-sync')
}
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

.game-lobby-view {
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>
