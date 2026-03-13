<template>
    <div class="round-results-view">
        <!-- Moderator Ranking View -->
        <div v-if="isModerator && !resultsSubmitted">
            <!-- Question Card -->
            <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

            <!-- Sortable Answer List -->
            <div class="card card--sortable-list">
                <h2 class="view-title">
                    Rank the Answers
                </h2>

                <div class="sorting-start">
                    <p v-if="gameStore.currentQuestion?.scaleFrom">From {{ gameStore.currentQuestion.scaleFrom }}</p>
                    <p v-else>From lowest</p>
                </div>

                <RankingItem
                    v-for="(answer, index) in sortedAnswers"
                    :key="answer.id"
                    variant="sortable"
                    :rank="index + 1"
                    :username="answer.username"
                    :answer-text="answer.text"
                    :is-first="index === 0"
                    :is-last="index === sortedAnswers.length - 1"
                    @move-up="moveUp(index)"
                    @move-down="moveDown(index)"
                />

                <div class="sorting-end">
                    <p v-if="gameStore.currentQuestion?.scaleTo">To {{ gameStore.currentQuestion.scaleTo }}</p>
                    <p v-else>To highest</p>
                </div>

                <!-- Submit Ranking Button -->
                <button
                    @click="submitRanking"
                    class="btn btn--icon submit-ranking-button"
                >
                    <img :src="submitIcon" alt="Submit ranking"/>
                    <p>Submit Ranking</p>
                </button>
            </div>

            
            </div>

            <!-- Waiting for Moderator (Non-Moderators) - With Live Updates -->
            <div v-else-if="!resultsReceived">
            <!-- Question Card for Non-Moderators -->
            <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

            <div class="card waiting-card">
                <div class="waiting-icon">⏳</div>
                <h3 class="waiting-title">Moderator is Ranking</h3>
                <p class="waiting-message">
                Watch as they sort the answers...
                </p>
            </div>

            <!-- Live Ranking Preview (Non-Moderators see this) -->
            <div v-if="liveRankingAnswers.length > 0" class="live-ranking-list">
                <RankingItem
                    v-for="(answer, index) in liveRankingAnswers"
                    :key="answer.id"
                    variant="live"
                    :rank="index + 1"
                    :username="answer.username"
                    :answer-text="answer.text"
                />
            </div>

            <div v-else class="spinner-container">
                <div class="spinner"></div>
            </div>
        </div>

        <!-- Results Display (After Moderator Submit) -->
        <div v-else>
            <!-- Question Card in Results -->
            <QuestionCard v-if="gameStore.currentQuestion" :question="gameStore.currentQuestion" variant="compact" />

            <div class="card results-header">
                <div v-if="results.isCorrect" class="result-icon success">
                    <img :src="correctIcon" alt="Correct Icon" />
                </div>
                <div v-else class="result-icon error">❌</div>

                <h2 class="result-title">
                    {{ results.isCorrect ? 'Perfect Ranking!' : 'Not Quite!' }}
                </h2>
                <p class="result-message">
                    {{ results.isCorrect ? 'Moderator got the ranking correct!' : 'Moderator\'s ranking was incorrect' }}
                </p>
                <button
                    v-if="isModerator && !isLastRound"
                    @click="startNextRound"
                    class="btn btn-success w-full next-round-button"
                >
                    ▶️ Start Next Round
                </button>
            </div>

            <!-- End Game Button (Moderator Only, Last Round) -->
            <button
                v-if="isModerator && isLastRound"
                @click="startNextRound"
                class="btn btn-primary w-full next-round-button"
            >
                🏆 View Final Scoreboard
            </button>

            <!-- Waiting Message for Non-Moderators -->
            <div v-if="!isModerator" class="card waiting-next-round-card">
                <div class="waiting-icon">⏳</div>
                <p class="waiting-text">
                <template v-if="!isLastRound">
                    Waiting for moderator to start the next round...
                </template>
                <template v-else>
                    Waiting for moderator to show the final scoreboard...
                </template>
                </p>
            </div>

            <!-- Current Scores -->
            <div class="card current-scores-card">
                <h3 class="scores-title">Current Scores</h3>
                <div class="scores-list">
                <div
                    v-for="(score, playerId) in results.scores"
                    :key="playerId"
                    class="score-row"
                >
                    <span class="player-name">{{ getPlayerName(playerId) }}</span>
                    <span class="score-value">{{ score }}</span>
                </div>
                </div>
            </div>

            <!-- Ranking Analysis -->
            <div class="card ranking-analysis-card">
                <h3 class="analysis-title">
                Ranking Details
                <span v-if="results.isCorrect" class="status-badge success">✓ Perfect!</span>
                <span v-else class="status-badge error">✗ Not quite right</span>
                </h3>

                <!-- Points Summary -->
                <div
                v-if="results.pointsEarned !== undefined"
                class="card points-summary"
                >
                <div class="summary-label">
                    Moderator earned this round
                </div>
                <div class="points-earned">
                    {{ results.pointsEarned }} <span class="max-points">/ 100</span>
                </div>
                <div class="summary-details">
                    {{ results.correctlyPositioned }} of {{ results.totalAnswers }} correct
                    <span v-if="results.totalAnswers > 0">
                    ({{ Math.round(100 / results.totalAnswers) }} points per correct position)
                    </span>
                </div>
                </div>

                <div class="ranking-details-list">
                    <RankingItem
                        v-for="detail in rankingDetails"
                        :key="detail.answerId"
                        variant="detail"
                        :rank="detail.correctPosition"
                        :username="detail.username"
                        :answer-text="detail.answerText"
                        :is-correct="detail.isCorrect"
                        :actual-value="detail.actualValue"
                        :moderator-position="detail.moderatorPosition"
                        :correct-position="detail.correctPosition"
                        :position-diff="detail.positionDiff"
                    />
                </div>
            </div>

            <!-- Next Round / End Game -->
            <div class="transition-message">
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
import RankingItem from '../components/RankingItem.vue'
import submitIcon from '../../../icons/icon_submit.svg'
import correctIcon from '../../../icons/icon_correct.svg'
import wrongIcon from '../../../icons/icon_wrong.svg'

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

    // No automatic navigation - moderator controls when to continue
    console.log('📊 Results received, waiting for moderator to start next round')
  })
})

function startNextRound() {
  console.log('⏭️ Moderator starting next round/ending game')
  socketStore.socket?.emit('round:start-next')
}

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
