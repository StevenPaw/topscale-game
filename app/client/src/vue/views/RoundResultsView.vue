<template>
  <div class="round-results-view" style="max-width: 600px; margin: 0 auto; padding: 2rem 1rem; min-height: 100vh;">

    <!-- Moderator Ranking View -->
    <div v-if="isModerator && !resultsSubmitted">
      <!-- Question Card -->
      <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

      <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-align: center;">
        Rank the Answers
      </h2>
      <p style="text-align: center; color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.875rem;">
        <template v-if="gameStore.currentQuestion?.scaleFrom && gameStore.currentQuestion?.scaleTo">
          Sort from <strong>{{ gameStore.currentQuestion.scaleFrom }}</strong> (lowest) to <strong>{{ gameStore.currentQuestion.scaleTo }}</strong> (highest)
        </template>
        <template v-else>
          Sort from <strong>lowest</strong> (1) to <strong>highest</strong> (10) on the scale
        </template>
      </p>

      <!-- Sortable Answer List -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
        <div
          v-for="(answer, index) in sortedAnswers"
          :key="answer.id"
          class="card"
          style="padding: 1rem; display: flex; align-items: center; gap: 1rem;"
        >
          <!-- Rank Number -->
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0;">
            {{ index + 1 }}
          </div>

          <!-- Answer Text -->
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
              {{ answer.username }}
            </div>
            <div>{{ answer.text }}</div>
          </div>

          <!-- Move Buttons -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <button
              @click="moveUp(index)"
              :disabled="index === 0"
              style="background: var(--bg-secondary); border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 1.25rem;"
              :style="index === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''"
            >
              ▲
            </button>
            <button
              @click="moveDown(index)"
              :disabled="index === sortedAnswers.length - 1"
              style="background: var(--bg-secondary); border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 1.25rem;"
              :style="index === sortedAnswers.length - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''"
            >
              ▼
            </button>
          </div>
        </div>
      </div>

      <!-- Submit Ranking Button -->
      <button
        @click="submitRanking"
        class="btn btn-success w-full"
        style="padding: 1.125rem; font-size: 1.125rem;"
      >
        Submit Ranking
      </button>
    </div>

    <!-- Waiting for Moderator (Non-Moderators) - With Live Updates -->
    <div v-else-if="!resultsReceived">
      <!-- Question Card for Non-Moderators -->
      <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

      <div class="card" style="padding: 3rem 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Moderator is Ranking</h3>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          Watch as they sort the answers...
        </p>
      </div>

      <!-- Live Ranking Preview (Non-Moderators see this) -->
      <div v-if="liveRankingAnswers.length > 0" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; text-align: left;">
        <div
          v-for="(answer, index) in liveRankingAnswers"
          :key="answer.id"
          class="card"
          style="padding: 1rem; display: flex; align-items: center; gap: 1rem; background: rgba(20, 184, 166, 0.1);"
        >
          <!-- Rank Number -->
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0;">
            {{ index + 1 }}
          </div>

          <!-- Answer Text -->
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
              {{ answer.username }}
            </div>
            <div>{{ answer.text }}</div>
          </div>
        </div>
      </div>

      <div v-else style="margin-top: 2rem; display: inline-block; width: 40px; height: 40px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>

    <!-- Results Display (After Moderator Submit) -->
    <div v-else>
      <!-- Question Card in Results -->
      <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

      <div style="text-align: center; margin-bottom: 2rem;">
        <div v-if="results.isCorrect" style="font-size: 3rem; margin-bottom: 0.5rem;">✅</div>
        <div v-else style="font-size: 3rem; margin-bottom: 0.5rem;">❌</div>

        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
          {{ results.isCorrect ? 'Perfect Ranking!' : 'Not Quite!' }}
        </h2>
        <p style="color: var(--text-secondary);">
          {{ results.isCorrect ? 'Moderator got the ranking correct!' : 'Moderator\'s ranking was incorrect' }}
        </p>
      </div>

      <!-- Answers with Scale Values Revealed -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
        <div
          v-for="answer in results.answers"
          :key="answer.id"
          class="card"
          style="padding: 1rem; display: flex; align-items: center; gap: 1rem;"
        >
          <!-- Scale Number (Revealed) -->
          <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.5rem; flex-shrink: 0;">
            {{ answer.scaleValue }}
          </div>

          <!-- Answer -->
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
              {{ answer.username }}
            </div>
            <div>{{ answer.text }}</div>
          </div>
        </div>
      </div>

      <!-- Current Scores -->
      <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Current Scores</h3>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div
            v-for="(score, playerId) in results.scores"
            :key="playerId"
            style="display: flex; justify-content: space-between; align-items: center;"
          >
            <span>{{ getPlayerName(playerId) }}</span>
            <span style="font-weight: 700; font-size: 1.125rem; color: var(--primary);">{{ score }}</span>
          </div>
        </div>
      </div>

      <!-- Ranking Analysis -->
      <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
          Ranking Details
          <span v-if="results.isCorrect" style="color: var(--success); margin-left: 0.5rem;">✓ Perfect!</span>
          <span v-else style="color: #ef4444; margin-left: 0.5rem;">✗ Not quite right</span>
        </h3>

        <!-- Points Summary -->
        <div
          v-if="results.pointsEarned !== undefined"
          class="card"
          style="padding: 1rem; margin-bottom: 1.5rem; background: rgba(20, 184, 166, 0.15); border: 2px solid var(--primary); text-align: center;"
        >
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
            Moderator earned this round
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">
            {{ results.pointsEarned }} <span style="font-size: 1.25rem; font-weight: 400;">/ 100</span>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
            {{ results.correctlyPositioned }} of {{ results.totalAnswers }} correct
            <span v-if="results.totalAnswers > 0">
              ({{ Math.round(100 / results.totalAnswers) }} points per correct position)
            </span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div
            v-for="detail in rankingDetails"
            :key="detail.answerId"
            class="card"
            :style="{
              padding: '1rem',
              background: detail.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${detail.isCorrect ? 'var(--success)' : '#ef4444'}`
            }"
          >
            <div style="display: flex; align-items: center; gap: 1rem;">
              <!-- Status Icon -->
              <div
                :style="{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: detail.isCorrect ? 'var(--success)' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: 'white',
                  flexShrink: '0'
                }"
              >
                {{ detail.isCorrect ? '✓' : '✗' }}
              </div>

              <!-- Answer Content -->
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                  <div>
                    <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-secondary);">
                      {{ detail.username }}
                    </div>
                    <div style="margin-top: 0.25rem;">{{ detail.answerText }}</div>
                  </div>
                  <div
                    style="padding: 0.25rem 0.75rem; border-radius: 1rem; background: var(--primary); color: white; font-weight: 600; font-size: 0.875rem; flex-shrink: 0; margin-left: 1rem;"
                  >
                    {{ detail.actualValue }}
                  </div>
                </div>

                <!-- Position Info -->
                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                  <div>
                    <span style="font-weight: 600;">Moderator Rank:</span> #{{ detail.moderatorPosition }}
                  </div>
                  <div>
                    <span style="font-weight: 600;">Correct Rank:</span> #{{ detail.correctPosition }}
                  </div>
                  <div v-if="!detail.isCorrect" style="color: #ef4444; font-weight: 600;">
                    ({{ detail.positionDiff > 0 ? '+' : '' }}{{ detail.positionDiff }} off)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Next Round / End Game -->
      <div style="text-align: center; color: var(--text-secondary); font-size: 0.875rem;">
        {{ isLastRound ? 'Game ending...' : 'Next round starting soon...' }}
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

const sortedAnswers = ref([])
const liveRankingAnswers = ref([]) // For non-moderators to see live updates
const resultsSubmitted = ref(false)
const resultsReceived = ref(false)
const results = ref(null)

const isModerator = computed(() => {
  return socketStore.socket?.id === gameStore.currentRoundLeader?.id
})

const isLastRound = computed(() => {
  return gameStore.currentRound >= gameStore.totalRounds
})

const rankingDetails = computed(() => {
  if (!results.value || !results.value.answers) return []

  const { answers, moderatorRanking, correctRanking } = results.value

  return answers.map(answer => {
    // Find positions (1-based)
    const moderatorPosition = moderatorRanking.indexOf(answer.id) + 1
    const correctPosition = correctRanking.indexOf(answer.id) + 1
    const isCorrect = moderatorPosition === correctPosition
    const positionDiff = moderatorPosition - correctPosition

    return {
      answerId: answer.id,
      username: answer.username,
      answerText: answer.text,
      actualValue: answer.scaleValue,
      moderatorPosition,
      correctPosition,
      isCorrect,
      positionDiff
    }
  }).sort((a, b) => a.correctPosition - b.correctPosition) // Sort by correct position
})

onMounted(() => {
  // Get answers from game store (set by GameView)
  sortedAnswers.value = [...(gameStore.answersForRanking || [])]

  // Listen for live ranking updates (non-moderators)
  socketStore.socket?.on('ranking:live-update', (data) => {
    if (!isModerator.value) {
      // Update live ranking based on moderator's current order
      const { rankedAnswerIds } = data
      const answersMap = new Map(sortedAnswers.value.map(a => [a.id, a]))
      liveRankingAnswers.value = rankedAnswerIds.map(id => answersMap.get(id)).filter(Boolean)
    }
  })

  // Try to get moderator info from socket events (will be set when round started)
  socketStore.socket?.on('round:results', (data) => {
    resultsReceived.value = true
    results.value = data

    // Navigate to next round or scoreboard after delay
    setTimeout(() => {
      console.log('⏭️ Results complete, waiting for next phase change...')
      // Phase will autocratically change to 'question' (next round) or 'podium' (game end)
      // No router.push needed - GameLobbyView handles this
    }, 5000)
  })
})

onUnmounted(() => {
  socketStore.socket?.off('round:results')
  socketStore.socket?.off('ranking:live-update')
})

function moveUp(index) {
  if (index === 0) return
  const temp = sortedAnswers.value[index]
  sortedAnswers.value[index] = sortedAnswers.value[index - 1]
  sortedAnswers.value[index - 1] = temp

  // Send live update to all players
  sendLiveRankingUpdate()
}

function moveDown(index) {
  if (index === sortedAnswers.value.length - 1) return
  const temp = sortedAnswers.value[index]
  sortedAnswers.value[index] = sortedAnswers.value[index + 1]
  sortedAnswers.value[index + 1] = temp

  // Send live update to all players
  sendLiveRankingUpdate()
}

function sendLiveRankingUpdate() {
  const rankedAnswerIds = sortedAnswers.value.map(a => a.id)
  socketStore.socket?.emit('round:update-ranking', {
    rankedAnswerIds
  })
}

function submitRanking() {
  const rankedAnswerIds = sortedAnswers.value.map(a => a.id)

  socketStore.socket?.emit('round:submit-ranking', {
    rankedAnswerIds
  })

  resultsSubmitted.value = true
}

function getPlayerName(playerId) {
  const player = lobbyStore.players.find(p => p.id === playerId)
  return player ? player.username : 'Unknown'
}

// Store moderator ID when component mounts
// This should be passed from GameView or fetched from a store
// For now, we'll rely on the socket event to determine moderator
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
