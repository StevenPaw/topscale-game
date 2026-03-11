<template>
  <div class="lobby-create-view">
    <div class="card create-card">
      <h2 class="text-center mb-6 create-title">Create New Lobby</h2>

      <div v-if="!socketStore.isConnected">
        <p class="text-center mb-4">Connecting to server...</p>
      </div>

      <div v-else-if="!isCreating && !lobbyStore.lobbyCode">
        <p class="text-center mb-6 create-message">
          You will be the host and can configure game settings before starting.
        </p>

        <button
          @click="createLobby"
          class="btn btn-success w-full mb-4 create-button"
        >
          🎯 Create Lobby
        </button>

        <router-link
          to="/"
          class="btn w-full back-button"
        >
          Back to Home
        </router-link>
      </div>

      <div v-else-if="isCreating" class="creating-message">
        <p class="mb-4 creating-text">Creating lobby...</p>
        <div class="spinner"></div>
      </div>

      <div v-if="error" class="error-message mt-4">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketStore } from '../stores/socket'
import { useUserStore } from '../stores/user'
import { useLobbyStore } from '../stores/lobby'

const router = useRouter()
const socketStore = useSocketStore()
const userStore = useUserStore()
const lobbyStore = useLobbyStore()

const isCreating = ref(false)
const error = ref(null)

onMounted(() => {
  if (!userStore.username) {
    router.push('/')
    return
  }

  if (!socketStore.isConnected) {
    socketStore.connect()
  }

  // Listen for successful creation
  socketStore.socket?.on('lobby:created', (data) => {
    isCreating.value = false
    console.log('Lobby created, redirecting to:', `/lobby/${data.code}`)
    router.push(`/lobby/${data.code}`)
  })

  socketStore.socket?.on('lobby:error', (data) => {
    isCreating.value = false
    error.value = data.message || 'Failed to create lobby'
  })
})

function createLobby() {
  error.value = null
  isCreating.value = true
  socketStore.createLobby(userStore.username)
}
</script>
