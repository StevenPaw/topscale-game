<template>
  <div class="lobby-wait-view" style="max-width: 500px; margin: 0 auto; padding: 2rem 1rem;">
    <!-- Header with Settings Button -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="font-size: 1.5rem; font-weight: 600;">Game Lobby</h1>
      <button
        v-if="lobbyStore.isHost"
        @click="showSettings = true"
        style="background: var(--bg-secondary); border: none; padding: 0.75rem; border-radius: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center;"
      >
        <span style="font-size: 1.25rem;">⚙️</span>
      </button>
    </div>

    <!-- Lobby Code Card -->
    <div class="card" style="text-align: center; padding: 2rem; margin-bottom: 2rem;">
      <p style="text-transform: uppercase; font-size: 0.875rem; color: var(--primary); font-weight: 600; letter-spacing: 0.1em; margin-bottom: 0.5rem;">
        Lobby Code
      </p>

      <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; font-weight: 700; color: var(--primary); letter-spacing: 0.15em;">
          {{ lobbyStore.lobbyCode || route.params.code }}
        </div>
        <button
          @click="copyLobbyCode"
          style="background: transparent; border: none; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem;"
          title="Copy code"
        >
          <span style="font-size: 1.5rem;">📋</span>
        </button>
      </div>

      <!-- QR Code -->
      <div style="margin: 1.5rem 0;">
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Scan to join</p>
        <canvas
          ref="qrCanvas"
          style="max-width: 200px; width: 100%; height: auto; margin: 0 auto; display: block; border-radius: 0.5rem; background: white; padding: 1rem;"
        ></canvas>
      </div>
    </div>

    <!-- Players List -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600;">Players Joined</h3>
        <span style="background: var(--bg-secondary); padding: 0.375rem 0.875rem; border-radius: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
          {{ lobbyStore.playerCount }} Player{{ lobbyStore.playerCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div
          v-for="player in lobbyStore.players"
          :key="player.id"
          style="display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 0.75rem;"
        >
          <!-- Avatar Circle -->
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">
            {{ player.username.charAt(0).toUpperCase() }}
          </div>

          <div style="flex: 1;">
            <div style="font-weight: 600;">{{ player.username }}</div>
          </div>

          <span v-if="player.isHost" style="background: var(--success); color: white; padding: 0.25rem 0.625rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600;">
            👑 Host
          </span>
        </div>
      </div>
    </div>

    <!-- Start Game Button -->
    <button
      v-if="lobbyStore.isHost"
      @click="startGame"
      class="btn btn-success w-full"
      style="padding: 1.125rem; font-size: 1.125rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
      :disabled="lobbyStore.playerCount < 2 || !hasQuestionPacks"
    >
      <span>▶</span>
      <span>Start Game</span>
    </button>

    <p v-if="lobbyStore.isHost && lobbyStore.playerCount < 2" class="text-center mt-4" style="color: var(--text-secondary); font-size: 0.875rem;">
      ⚠️ Need at least 2 players to start
    </p>

    <!-- Settings Modal -->
    <div
      v-if="showSettings"
      @click="showSettings = false"
      style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 2rem 1rem; overflow-y: auto;"
    >
      <div
        @click.stop
        class="card"
        style="max-width: 500px; width: 100%; margin-top: 2rem;"
      >
        <!-- Settings Header -->
        <div style="display: flex; align-items: center; margin-bottom: 2rem;">
          <button
            @click="showSettings = false"
            style="background: transparent; border: none; color: var(--text-primary); cursor: pointer; font-size: 1.5rem; padding: 0.25rem; margin-right: 0.75rem;"
          >
            ←
          </button>
          <h2 style="font-size: 1.5rem; font-weight: 600;">Game Settings</h2>
        </div>

        <!-- Question Packs -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Question Packs</h3>

          <!-- Loading State -->
          <div v-if="loadingQuestionPacks" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1rem; font-size: 0.875rem;">Loading question packs...</p>
          </div>

          <!-- Question Pack List -->
          <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
            <label
              v-for="pack in availableQuestionPacks"
              :key="pack.id"
              style="display: flex; align-items: center; gap: 0.875rem; padding: 1rem; background: var(--bg-secondary); border-radius: 0.75rem; cursor: pointer;"
            >
              <input
                type="checkbox"
                v-model="pack.selected"
                style="width: 20px; height: 20px; accent-color: var(--primary); cursor: pointer;"
              />
              <div style="flex: 1;">
                <div style="font-weight: 500;">{{ pack.title }}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  {{ pack.questionCount }} questions
                </div>
              </div>
            </label>

            <p v-if="!hasQuestionPacks" style="color: var(--error); font-size: 0.875rem; margin-top: 0.5rem;">
              ⚠️ Please select at least one question pack
            </p>
          </div>
        </div>

        <!-- Game Rules -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Game Rules</h3>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              Number of Rounds
            </label>
            <input
              type="number"
              v-model="settings.totalRounds"
              min="5"
              max="20"
              style="background: var(--bg-secondary);"
            />
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              Max Round Timer
            </label>
            <input
              type="number"
              v-model="settings.timeLimit"
              min="30"
              max="180"
              style="background: var(--bg-secondary);"
            />
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">In seconds</p>
          </div>
        </div>

        <!-- Leaderboard -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Leaderboard</h3>
          <label
            style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--success); background: rgba(20, 184, 166, 0.1); border-radius: 0.75rem;"
          >
            <div>
              <div style="font-weight: 600; margin-bottom: 0.25rem;">Top 3 Leaderboard Only</div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                Disable to show the complete leaderboard for all players at the end of the game
              </p>
            </div>
            <input
              type="checkbox"
              v-model="settings.top3Only"
              style="width: 48px; height: 28px; cursor: pointer;"
            />
          </label>
        </div>

        <!-- Save Button -->
        <button
          @click="saveSettings"
          class="btn btn-success w-full"
          style="padding: 1.125rem; font-size: 1.125rem;"
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
  if (!socketStore.isConnected) {
    router.push('/')
    return
  }

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
  const joinUrl = `${window.location.origin}/lobby/join?code=${lobbyCode}`

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

<style scoped>
/* Checkbox styling for better appearance */
input[type="checkbox"] {
  width: auto;
  min-width: 20px;
  min-height: 20px;
}
</style>
