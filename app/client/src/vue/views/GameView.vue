<template>
  <div class="game-view">
    <!-- Game Status Header -->
    <div class="game-header">
      <div class="status-indicator">
        <div class="status-dot"></div>
        <span class="status-text">
          Game Active
        </span>
      </div>
      <span class="round-counter">
        Round {{ currentRound }} of {{ totalRounds }}
      </span>
    </div>

    <!-- Question Card -->
    <QuestionCard v-if="currentQuestion" :question="currentQuestion" />

    <!-- Moderator View: Waiting for answers -->
    <div v-if="isModerator">
      <div class="card moderator-card">
        <div class="moderator-icon">🎭</div>
        <h3 class="moderator-title">You are the Moderator</h3>
        <p class="moderator-description">
          Waiting for players to submit their answers...
        </p>

        <!-- Answer Count -->
        <div class="answer-count-container">
          <div class="answer-count">
            {{ answersReceived }} / {{ totalPlayersExpected }}
          </div>
          <p class="answer-count-label">
            answers received
          </p>
        </div>

        <div v-if="allAnswersReceived" class="answers-complete">
          <p class="complete-message">All answers received!</p>
          <p class="transition-message">
            Moving to ranking phase...
          </p>
          <div class="spinner success"></div>
        </div>

        <div v-else>
          <div class="spinner"></div>
        </div>
      </div>
    </div>

    <!-- Player View: Scale number and answer input -->
    <div v-else>
      <!-- Big Scale Number -->
      <div class="scale-display">
        <div class="scale-number">
          {{ myScaleValue || '?' }}
        </div>
        <p class="scale-label">
          Your position on the scale
        </p>
      </div>

      <!-- Answer Input -->
      <div v-if="!answerSubmitted">
        <textarea
          v-model="myAnswer"
          placeholder="E.g., It's pretty good, I'd..."
          rows="3"
          class="answer-textarea"
        ></textarea>

        <button
          @click="submitAnswer"
          class="btn btn-success w-full submit-button"
          :disabled="!myAnswer.trim()"
        >
          <span>Submit</span>
          <span class="submit-icon">✓</span>
        </button>
      </div>

      <!-- Answer Submitted -->
      <div v-else class="card submitted-card">
        <div class="check-icon">✓</div>
        <p class="submitted-title">Answer Submitted!</p>
        <p class="submitted-message">
          Waiting for other players and moderator...
        </p>
      </div>
    </div>

    <!-- Timer (if active) -->
    <div v-if="timeRemaining > 0" class="timer-display">
      <div class="timer-value">
        {{ timeRemaining }}s
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
import QuestionCard from '../components/QuestionCard.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()
const userStore = useUserStore()

const myAnswer = ref('')
const answerSubmitted = ref(false)
const timeRemaining = ref(60)
const allAnswersReceived = ref(false)
const answersReceived = ref(0)

// Get data from game store (set by GameLobbyView)
const myScaleValue = computed(() => gameStore.myScaleValue)
const currentQuestion = computed(() => gameStore.currentQuestion)
const currentRound = computed(() => gameStore.currentRound)
const totalRounds = computed(() => gameStore.totalRounds)
const isModerator = computed(() => gameStore.isModerator)
const totalPlayersExpected = computed(() => gameStore.totalPlayersInRound)

onMounted(() => {
  if (!socketStore.isConnected) {
    router.push('/')
    return
  }

  // Reset answer state for new round
  answerSubmitted.value = false
  myAnswer.value = ''
  allAnswersReceived.value = false
  answersReceived.value = 0

  // Set time remaining from store
  timeRemaining.value = gameStore.timeLimit

  // Listen for answer count updates (moderator only)
  socketStore.socket?.on('round:answer-count-update', (data) => {
    answersReceived.value = data.answersReceived
  })

  // Listen for all answers submitted (moderator only)
  socketStore.socket?.on('round:all-answers-submitted', (data) => {
    allAnswersReceived.value = true
    answersReceived.value = data.answers.length
    // Store answers for ranking view
    gameStore.setAnswersForRanking(data.answers)

    // Phase change to 'sorting' will automatically switch to RoundResultsView
    console.log('🎮 All answers received! Waiting for phase change to sorting...')
  })

  // Listen for timer
  socketStore.socket?.on('timer:tick', (data) => {
    timeRemaining.value = data.timeRemaining
  })

  // Listen for results - Phase change will handle view switch
  socketStore.socket?.on('round:results', (data) => {
    console.log('🎮 Received round:results, phase will change to results automatically')
    // No navigation needed - GameLobbyView handles this
  })
})

onUnmounted(() => {
  // Clean up listeners (round:started and phase:changed are handled by GameLobbyView)
  socketStore.socket?.off('round:answer-count-update')
  socketStore.socket?.off('round:all-answers-submitted')
  socketStore.socket?.off('timer:tick')
  socketStore.socket?.off('round:results')
})

function submitAnswer() {
  if (!myAnswer.value.trim()) return

  socketStore.socket?.emit('round:submit-answer', {
    answer: myAnswer.value.trim()
  })

  answerSubmitted.value = true
}
</script>
