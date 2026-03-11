<template>
  <div class="home-view">
    <div class="card home-card">
      <h2 class="text-center mb-6 welcome-title">
        Welcome! 🎮
      </h2>

      <!-- Username Input -->
      <div v-if="!userStore.username" class="mb-6">
        <label class="label">Enter your name to start:</label>
        <input
          v-model="tempUsername"
          type="text"
          placeholder="Your name"
          class="mb-4"
          @keyup.enter="saveUsername"
          autofocus
        />
        <button
          @click="saveUsername"
          class="btn btn-primary w-full"
          :disabled="!tempUsername.trim()"
        >
          Continue
        </button>
      </div>

      <!-- Actions -->
      <div v-else>
        <p class="text-center mb-6 greeting-text">
          Hello, <strong>{{ userStore.username }}</strong>! 👋
        </p>

        <div class="button-group">
          <button
            @click="createLobby"
            class="btn btn-success w-full action-button"
            :disabled="isCreating"
          >
            <span v-if="!isCreating">🎯 Create New Lobby</span>
            <span v-else>Creating...</span>
          </button>

          <button
            @click="showJoinModal = true"
            class="btn btn-primary w-full action-button"
          >
            🚪 Join Existing Lobby
          </button>
        </div>

        <!-- Optional Login -->
        <div class="mt-6 login-section">
          <p class="text-center mb-4 login-hint">
            Want to save your stats across sessions?
          </p>
          <button
            class="w-full login-button"
            @click="showLoginModal = true"
          >
            Login / Register
          </button>
        </div>

        <button
          @click="changeUsername"
          class="mt-4 w-full change-name-button"
        >
          Change Name
        </button>
      </div>
    </div>

    <!-- Login Modal (placeholder) -->
    <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
      <div class="card modal-card" @click.stop>
        <h3 class="mb-4">Login / Register</h3>
        <p class="mb-4 modal-text">This feature will be implemented soon. For now, you can play without an account!</p>
        <button class="btn btn-primary w-full" @click="showLoginModal = false">Close</button>
      </div>
    </div>

    <!-- Join Lobby Modal -->
    <div v-if="showJoinModal" class="modal-overlay" @click="showJoinModal = false">
      <div class="card modal-card" @click.stop>
        <h3 class="mb-4">Join Lobby</h3>
        <label class="label">Enter lobby code:</label>
        <input
          v-model="joinCode"
          type="text"
          placeholder="e.g. ABC123"
          class="mb-4 uppercase-input"
          @keyup.enter="joinLobby"
          autofocus
        />
        <div class="button-row">
          <button class="btn btn-primary flex-1" @click="joinLobby" :disabled="!joinCode.trim() || isJoining">
            <span v-if="!isJoining">Join</span>
            <span v-else>Joining...</span>
          </button>
          <button class="btn btn-secondary flex-1" @click="showJoinModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useSocketStore } from '../stores/socket'
import { useLobbyStore } from '../stores/lobby'

const router = useRouter()
const userStore = useUserStore()
const socketStore = useSocketStore()
const lobbyStore = useLobbyStore()

const tempUsername = ref('')
const showLoginModal = ref(false)
const showJoinModal = ref(false)
const joinCode = ref('')
const isCreating = ref(false)
const isJoining = ref(false)

function saveUsername() {
  if (tempUsername.value.trim()) {
    userStore.setUsername(tempUsername.value.trim())
  }
}

function changeUsername() {
  const newName = prompt('Enter new name:', userStore.username)
  if (newName && newName.trim()) {
    userStore.setUsername(newName.trim())
  }
}

function createLobby() {
  if (!socketStore.socket?.connected) {
    alert('Not connected to server. Please refresh the page.')
    return
  }

  isCreating.value = true
  socketStore.createLobby(userStore.username)

  // Listen for lobby created event
  const onLobbyCreated = (data) => {
    isCreating.value = false
    // Navigate to /:code instead of /lobby/:code
    router.push(`/${data.code}`)
    socketStore.socket.off('lobby:created', onLobbyCreated)
  }

  socketStore.socket.on('lobby:created', onLobbyCreated)

  // Timeout after 5 seconds
  setTimeout(() => {
    if (isCreating.value) {
      isCreating.value = false
      alert('Failed to create lobby. Please try again.')
      socketStore.socket.off('lobby:created', onLobbyCreated)
    }
  }, 5000)
}

function joinLobby() {
  if (!joinCode.value.trim()) return

  const code = joinCode.value.trim().toUpperCase()
  isJoining.value = true

  socketStore.joinLobby(code, userStore.username)

  // Listen for successful join
  const onJoined = (data) => {
    isJoining.value = false
    showJoinModal.value = false
    // Navigate to /:code
    router.push(`/${code}`)
    socketStore.socket.off('lobby:joined', onJoined)
    socketStore.socket.off('lobby:join-error', onError)
  }

  const onError = (data) => {
    isJoining.value = false
    alert(data.message || 'Failed to join lobby')
    socketStore.socket.off('lobby:joined', onJoined)
    socketStore.socket.off('lobby:join-error', onError)
  }

  socketStore.socket.on('lobby:joined', onJoined)
  socketStore.socket.on('lobby:join-error', onError)

  // Timeout after 5 seconds
  setTimeout(() => {
    if (isJoining.value) {
      isJoining.value = false
      alert('Failed to join lobby. Please check the code and try again.')
      socketStore.socket.off('lobby:joined', onJoined)
      socketStore.socket.off('lobby:join-error', onError)
    }
  }, 5000)
}
</script>
