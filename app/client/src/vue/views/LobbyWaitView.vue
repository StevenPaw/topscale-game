<template>
    <div class="lobby-wait-view">

        <!-- QR Code -->
        <div class="card qr-container">
            <p class="qr-label">Scan to join:</p>
            <canvas
            ref="qrCanvas"
            class="qr-canvas"
            ></canvas>
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
                <img :src="hostIcon" alt="Host-Icon" />
                <p>Host</p>
            </span>
            </div>
        </div>
        </div>

        <div v-if="lobbyStore.isHost || lobbyStore.playerCount < 2" class="card start-card">
            <!-- Start Game Button -->
            <button
            v-if="lobbyStore.isHost"
            @click="startGame"
            class="btn btn--icon start-game-button"
            :disabled="lobbyStore.playerCount < 2 || !hasQuestionPacks"
            >
                <img :src="playIcon" alt="Start Game" class="start-icon" />
                <p>Start Game</p>
            </button>

            <ErrorMessage v-if="lobbyStore.playerCount < 2" 
                :Message="'Need at least 2 players to start'"
            />
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
import ErrorMessage from '../components/ErrorMessage.vue'
import playIcon from '../../../icons/icon_play.svg'
import warningIcon from '../../../icons/icon_warning.svg'
import hostIcon from '../../../icons/icon_host.svg'

const route = useRoute()
const router = useRouter()
const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()
const userStore = useUserStore()

const qrCanvas = ref(null)

const hasQuestionPacks = computed(() => {
  return lobbyStore.settings?.questionPacks?.length > 0
})

onMounted(async () => {
  // No redirect here - let GameLobbyView handle connection
  // We assume if we're here, the socket is connected or will be soon

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

function startGame() {
  if (lobbyStore.playerCount < 2) {
    alert('Need at least 2 players to start')
    return
  }

  if (!hasQuestionPacks.value) {
    alert('Please select at least one question pack in settings')
    return
  }

  socketStore.startGame()
}

function kickPlayer(playerId) {
  if (confirm('Kick this player?')) {
    socketStore.kickPlayer(playerId)
  }
}
</script>
