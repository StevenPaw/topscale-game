<template>
  <div class="game-view" style="max-width: 500px; margin: 0 auto; padding: 2rem 1rem; min-height: 100vh;">
    <!-- Game Status Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--success);"></div>
        <span style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          Game Active
        </span>
      </div>
      <span style="font-size: 0.875rem; color: var(--text-secondary);">
        Round {{ currentRound }} of {{ totalRounds }}
      </span>
    </div>

    <!-- Question Card -->
    <QuestionCard v-if="currentQuestion" :question="currentQuestion" />

    <!-- Moderator View: Waiting for answers -->
    <div v-if="isModerator">
      <div class="card" style="padding: 3rem 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎭</div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">You are the Moderator</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
          Waiting for players to submit their answers...
        </p>

        <!-- Answer Count -->
        <div style="margin: 2rem 0;">
          <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">
            {{ answersReceived }} / {{ totalPlayersExpected }}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
            answers received
          </p>
        </div>

        <div v-if="allAnswersReceived" style="margin-top: 2rem;">
          <p style="font-weight: 600; color: var(--success); margin-bottom: 1rem;">All answers received!</p>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">
            Moving to ranking phase...
          </p>
          <div style="margin-top: 1rem; display: inline-block; width: 40px; height: 40px; border: 3px solid var(--success); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>

        <div v-else>
          <div style="margin-top: 1.5rem; display: inline-block; width: 40px; height: 40px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
      </div>
    </div>

    <!-- Player View: Scale number and answer input -->
    <div v-else>
      <!-- Big Scale Number -->
      <div style="text-align: center; margin-bottom: 3rem;">
        <div style="font-size: 8rem; font-weight: 700; color: var(--primary); line-height: 1;">
          {{ myScaleValue || '?' }}
        </div>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Your position on the scale
        </p>
      </div>

      <!-- Answer Input -->
      <div v-if="!answerSubmitted">
        <textarea
          v-model="myAnswer"
          placeholder="E.g., It's pretty good, I'd..."
          rows="3"
          style="margin-bottom: 1rem; resize: vertical; min-height: 100px;"
        ></textarea>

        <button
          @click="submitAnswer"
          class="btn btn-success w-full"
          style="padding: 1.125rem; font-size: 1.125rem;"
          :disabled="!myAnswer.trim()"
        >
          <span>Submit</span>
          <span style="margin-left: 0.5rem;">✓</span>
        </button>
      </div>

      <!-- Answer Submitted -->
      <div v-else class="card" style="padding: 2rem; text-align: center; background: rgba(16, 185, 129, 0.1);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">✓</div>
        <p style="font-weight: 600; margin-bottom: 0.5rem;">Answer Submitted!</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">
          Waiting for other players and moderator...
        </p>
      </div>
    </div>

    <!-- Timer (if active) -->
    <div v-if="timeRemaining > 0" style="margin-top: 2rem; text-align: center;">
      <div style="font-size: 2rem; font-weight: 600; color: var(--primary);">
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

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
