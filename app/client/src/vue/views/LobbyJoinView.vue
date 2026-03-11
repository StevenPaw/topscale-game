<template>
  <div class="lobby-join-view">
    <div class="card join-card">
      <h2 class="text-center mb-6 join-title">Join Lobby</h2>

      <div v-if="!socketStore.isConnected">
        <p class="text-center mb-4">Connecting to server...</p>
      </div>

      <div v-else>
        <div class="mb-6">
          <label class="label">Enter Lobby Code:</label>
          <input
            v-model="lobbyCode"
            type="text"
            placeholder="ABC123"
            class="mb-4 code-input"
            maxlength="6"
            @input="lobbyCode = lobbyCode.toUpperCase()"
            @keyup.enter="joinAsPlayer"
            autofocus
          />

          <div class="mb-4 spectator-checkbox">
            <label>
              <input
                type="checkbox"
                v-model="joinAsSpectator"
              />
              <span>Join as Spectator (watch only)</span>
            </label>
          </div>

          <button
            @click="joinAsPlayer"
            class="btn btn-primary w-full mb-4 join-button"
            :disabled="lobbyCode.length !== 6 || isJoining"
          >
            {{ isJoining ? 'Joining...' : 'Join Lobby' }}
          </button>

          <div v-if="error" class="error-message mb-4">
            {{ error }}
          </div>

          <router-link
            to="/"
            class="btn w-full back-button"
          >
            Back to Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSocketStore } from '../stores/socket'
import { useUserStore } from '../stores/user'
import { useLobbyStore } from '../stores/lobby'

const router = useRouter()
const route = useRoute()
const socketStore = useSocketStore()
const userStore = useUserStore()
const lobbyStore = useLobbyStore()

const lobbyCode = ref('')
const joinAsSpectator = ref(false)
const isJoining = ref(false)
const error = ref(null)

onMounted(() => {
  if (!userStore.username) {
    router.push('/')
    return
  }

  // Check if code is in URL query parameter (from QR code scan)
  if (route.query.code) {
    lobbyCode.value = route.query.code.toUpperCase()
  }

  if (!socketStore.isConnected) {
    socketStore.connect()
  }

  // Listen for successful join
  socketStore.socket?.on('lobby:joined', (data) => {
    isJoining.value = false
    router.push(`/lobby/${lobbyCode.value}`)
  })

  socketStore.socket?.on('lobby:error', (data) => {
    isJoining.value = false
    error.value = data.message || 'Failed to join lobby'
  })
})

function joinAsPlayer() {
  if (lobbyCode.value.length !== 6) {
    error.value = 'Lobby code must be 6 characters'
    return
  }

  error.value = null
  isJoining.value = true

  socketStore.joinLobby(
    lobbyCode.value,
    userStore.username,
    joinAsSpectator.value
  )
}
</script>
