<template>
  <div class="lobby-join-view">
    <div class="card" style="max-width: 500px; margin: 2rem auto;">
      <h2 class="text-center mb-6" style="font-size: 1.75rem;">Join Lobby</h2>

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
            class="mb-4"
            style="text-transform: uppercase; font-size: 1.5rem; text-align: center; letter-spacing: 0.2em;"
            maxlength="6"
            @input="lobbyCode = lobbyCode.toUpperCase()"
            @keyup.enter="joinAsPlayer"
            autofocus
          />

          <div class="mb-4">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input
                type="checkbox"
                v-model="joinAsSpectator"
                style="margin-right: 0.5rem; width: auto;"
              />
              <span>Join as Spectator (watch only)</span>
            </label>
          </div>

          <button
            @click="joinAsPlayer"
            class="btn btn-primary w-full mb-4"
            :disabled="lobbyCode.length !== 6 || isJoining"
          >
            {{ isJoining ? 'Joining...' : 'Join Lobby' }}
          </button>

          <div v-if="error" class="error-message mb-4">
            {{ error }}
          </div>

          <router-link
            to="/"
            class="btn w-full"
            style="background: var(--gray-200); color: var(--gray-800);"
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

<style scoped>
.label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--gray-800);
}

.error-message {
  background: #fee;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--danger);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
