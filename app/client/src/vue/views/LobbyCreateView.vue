<template>
  <div class="lobby-create-view">
    <div class="card" style="max-width: 500px; margin: 2rem auto;">
      <h2 class="text-center mb-6" style="font-size: 1.75rem;">Create New Lobby</h2>

      <div v-if="!socketStore.isConnected">
        <p class="text-center mb-4">Connecting to server...</p>
      </div>

      <div v-else-if="!isCreating && !lobbyStore.lobbyCode">
        <p class="text-center mb-6">
          You will be the host and can configure game settings before starting.
        </p>

        <button
          @click="createLobby"
          class="btn btn-success w-full mb-4"
          style="padding: 1rem; font-size: 1.125rem;"
        >
          🎯 Create Lobby
        </button>

        <router-link
          to="/"
          class="btn w-full"
          style="background: var(--gray-200); color: var(--gray-800);"
        >
          Back to Home
        </router-link>
      </div>

      <div v-else-if="isCreating" class="text-center">
        <p class="mb-4">Creating lobby...</p>
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

<style scoped>
.error-message {
  background: #fee;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--danger);
}

.spinner {
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
