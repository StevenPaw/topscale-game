<template>
  <div class="lobby-wait-view">
    <!-- Header with Settings Button -->
    <div class="lobby-header">
      <h1 class="lobby-title">Game Lobby</h1>
      <button
        v-if="lobbyStore.isHost"
        @click="showSettings = true"
        class="settings-button"
      >
        <span class="settings-icon">⚙️</span>
      </button>
    </div>

    <!-- Lobby Code Card -->
    <div class="card code-card">
      <p class="code-label">
        Lobby Code
      </p>

      <div class="code-display">
        <div class="code-text">
          {{ lobbyStore.lobbyCode || route.params.code }}
        </div>
        <button
          @click="copyLobbyCode"
          class="copy-button"
          title="Copy code"
        >
          <span class="copy-icon">📋</span>
        </button>
      </div>

      <!-- QR Code -->
      <div class="qr-container">
        <p class="qr-label">Scan to join</p>
        <canvas
          ref="qrCanvas"
          class="qr-canvas"
        ></canvas>
      </div>
    </div>

    <!-- Players List -->
    <div class="card players-card">
      <div class="players-header">
        <h3 class="players-title">Players Joined</h3>
        <span class="player-count">
          {{ lobbyStore.playerCount }} Player{{ lobbyStore.playerCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="players-list">
        <div
          v-for="player in lobbyStore.players"
          :key="player.id"
          class="player-item"
        >
          <!-- Avatar Circle -->
          <div class="player-avatar">
            {{ player.username.charAt(0).toUpperCase() }}
          </div>

          <div class="player-name-container">
            <div class="player-name">{{ player.username }}</div>
          </div>

          <span v-if="player.isHost" class="host-badge">
            👑 Host
          </span>
        </div>
      </div>
    </div>

    <!-- Start Game Button -->
    <button
      v-if="lobbyStore.isHost"
      @click="startGame"
      class="btn btn-success w-full start-game-button"
      :disabled="lobbyStore.playerCount < 2 || !hasQuestionPacks"
    >
      <span>▶</span>
      <span>Start Game</span>
    </button>

    <p v-if="lobbyStore.isHost && lobbyStore.playerCount < 2" class="warning-message">
      ⚠️ Need at least 2 players to start
    </p>

    <!-- Settings Modal -->
    <div
      v-if="showSettings"
      @click="showSettings = false"
      class="modal-overlay"
    >
      <div
        @click.stop
        class="card settings-modal"
      >
        <!-- Settings Header -->
        <div class="settings-header">
          <button
            @click="showSettings = false"
            class="back-button"
          >
            ←
          </button>
          <h2 class="settings-title">Game Settings</h2>
        </div>

        <!-- Question Packs -->
        <div class="settings-section">
          <h3 class="section-title">Question Packs</h3>

          <!-- Loading State -->
          <div v-if="loadingQuestionPacks" class="loading-state">
            <div class="spinner"></div>
            <p class="loading-text">Loading question packs...</p>
          </div>

          <!-- Question Pack List -->
          <div v-else class="pack-list">
            <label
              v-for="pack in availableQuestionPacks"
              :key="pack.id"
              class="pack-item"
            >
              <input
                type="checkbox"
                v-model="pack.selected"
                class="pack-checkbox"
              />
              <div class="pack-info">
                <div class="pack-title">{{ pack.title }}</div>
                <div class="pack-count">
                  {{ pack.questionCount }} questions
                </div>
              </div>
            </label>

            <p v-if="!hasQuestionPacks" class="error-message">
              ⚠️ Please select at least one question pack
            </p>
          </div>
        </div>

        <!-- Game Rules -->
        <div class="settings-section">
          <h3 class="section-title">Game Rules</h3>

          <div class="input-group">
            <label class="input-label">
              Number of Rounds
            </label>
            <input
              type="number"
              v-model="settings.totalRounds"
              min="5"
              max="20"
              class="number-input"
            />
          </div>

          <div class="input-group">
            <label class="input-label">
              Max Round Timer
            </label>
            <input
              type="number"
              v-model="settings.timeLimit"
              min="30"
              max="180"
              class="number-input"
            />
            <p class="input-hint">In seconds</p>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="settings-section">
          <h3 class="section-title">Leaderboard</h3>
          <label class="toggle-option">
            <div>
              <div class="option-title">Top 3 Leaderboard Only</div>
              <p class="option-description">
                Disable to show the complete leaderboard for all players at the end of the game
              </p>
            </div>
            <input
              type="checkbox"
              v-model="settings.top3Only"
              class="toggle-checkbox"
            />
          </label>
        </div>

        <!-- Save Button -->
        <button
          @click="saveSettings"
          class="btn btn-success w-full save-button"
        >
          💾 Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watchEffect, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLobbyStore } from '../stores/lobby'
import { useSocketStore } from '../stores/socket'
import { useUserStore } from '../stores/user'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()
const userStore = useUserStore()

const qrCanvas = ref(null)
const showSettings = ref(false)
const loadingQuestionPacks = ref(true)

// Question packs loaded from API
const availableQuestionPacks = ref([])

const settings = ref({
  totalRounds: 10,
  timeLimit: 60,
  top3Only: false
})

const hasQuestionPacks = computed(() => {
  return availableQuestionPacks.value.some(pack => pack.selected)
})

// Load question packs from API
async function loadQuestionPacks() {
  try {
    loadingQuestionPacks.value = true

    // Get API URL from env or construct from current origin (without port)
    let apiUrl = import.meta.env.VITE_API_URL

    if (!apiUrl) {
      // Fallback: use current origin but remove port if it's 5173 (Vite dev server)
      const origin = window.location.origin
      apiUrl = origin.replace(':5173', '').replace(':3000', '')
    }

    const url = `${apiUrl}/api/game/groups`
    console.log('🔍 Fetching question packs from:', url)
    console.log('🔍 VITE_API_URL from env:', import.meta.env.VITE_API_URL)

    const response = await fetch(url)
    console.log('📡 Response status:', response.status)

    const text = await response.text()
    console.log('📄 Raw response:', text.substring(0, 200))

    const data = JSON.parse(text)
    console.log('📦 Parsed data:', data)

    if (data.success && data.groups) {
      availableQuestionPacks.value = data.groups.map((group, index) => ({
        id: group.id,
        title: group.only18 ? `${group.title} (18+)` : group.title,
        questionCount: group.questionCount,
        only18: group.only18,
        selected: index === 0 // Select first pack by default
      }))
      console.log('✅ Loaded question packs:', availableQuestionPacks.value)
    } else {
      console.error('Failed to load question packs from API - invalid response format')
      // Fallback to default pack
      availableQuestionPacks.value = [
        { id: 1, title: 'Default Pack', questionCount: 0, only18: false, selected: true }
      ]
    }
  } catch (error) {
    console.error('❌ Error loading question packs:', error)
    // Fallback to default pack
    availableQuestionPacks.value = [
      { id: 1, title: 'Default Pack', questionCount: 0, only18: false, selected: true }
    ]
  } finally {
    loadingQuestionPacks.value = false
  }
}

onMounted(async () => {
  // No redirect here - let GameLobbyView handle connection
  // We assume if we're here, the socket is connected or will be soon
  
  // Load question packs from API
  await loadQuestionPacks()

  // Generate QR Code
  await nextTick()
  generateQRCode()

  // Listen for game start - Phase change will handle view switch
  socketStore.socket?.on('game:started', () => {
    console.log('🎮 Game started! Phase will change automatically.')
    // No router.push needed - GameLobbyView handles phase changes
  })
})

watchEffect(() => {
  // Regenerate QR when lobby code changes
  if (lobbyStore.lobbyCode && qrCanvas.value) {
    generateQRCode()
  }
})

// Sync selected packs with lobby settings
watchEffect(() => {
  if (lobbyStore.settings?.questionPacks && availableQuestionPacks.value.length > 0) {
    const serverSelectedPacks = lobbyStore.settings.questionPacks
    availableQuestionPacks.value.forEach(pack => {
      pack.selected = serverSelectedPacks.includes(pack.id)
    })
  }

  // Sync other settings
  if (lobbyStore.settings) {
    if (lobbyStore.settings.timeLimit) {
      settings.value.timeLimit = lobbyStore.settings.timeLimit
    }
    if (lobbyStore.settings.totalRounds) {
      settings.value.totalRounds = lobbyStore.settings.totalRounds
    }
    if (lobbyStore.settings.top3Only !== undefined) {
      settings.value.top3Only = lobbyStore.settings.top3Only
    }
  }
})

async function generateQRCode() {
  if (!qrCanvas.value) return

  const lobbyCode = lobbyStore.lobbyCode || route.params.code
  const joinUrl = `${window.location.origin}/game/${lobbyCode}`

  try {
    await QRCode.toCanvas(qrCanvas.value, joinUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1a1d29',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('QR Code generation failed:', error)
  }
}

function copyLobbyCode() {
  const code = lobbyStore.lobbyCode || route.params.code
  navigator.clipboard.writeText(code)
  alert('Lobby code copied!')
}

function saveSettings() {
  const selectedPacks = availableQuestionPacks.value
    .filter(pack => pack.selected)
    .map(pack => pack.id)

  socketStore.updateLobbySettings({
    questionPacks: selectedPacks,
    timeLimit: parseInt(settings.value.timeLimit),
    totalRounds: parseInt(settings.value.totalRounds),
    top3Only: settings.value.top3Only
  })

  showSettings.value = false
  alert('Settings saved!')
}

function startGame() {
  if (lobbyStore.playerCount < 2) {
    alert('Need at least 2 players to start')
    return
  }

  if (!hasQuestionPacks.value) {
    alert('Please select at least one question pack in settings')
    return
  }

  saveSettings()
  socketStore.startGame()
}

function kickPlayer(playerId) {
  if (confirm('Kick this player?')) {
    socketStore.kickPlayer(playerId)
  }
}

function leaveLobby() {
  if (confirm('Leave this lobby?')) {
    socketStore.leaveLobby()
    router.push('/')
  }
}
</script>
