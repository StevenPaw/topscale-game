<template>
  <div class="scoreboard-view">
    <div class="card scoreboard-container">
      <!-- Header -->
      <div class="header">
        <h1 class="game-over-title">🏆 Game Over!</h1>
        <p class="header-subtitle">
          Final Scoreboard
        </p>
      </div>

      <!-- Winner Podium -->
      <div v-if="gameStore.sortedScores.length > 0" class="winner-podium">
        <div class="winner-crown">👑</div>
        <h2 class="winner-name">
          {{ gameStore.sortedScores[0].username }}
        </h2>
        <div class="winner-score">
          {{ gameStore.sortedScores[0].score }} points
        </div>
      </div>

      <!-- Full Rankings -->
      <div class="rankings-section">
        <h3 class="section-title">Final Rankings:</h3>
        <div class="rankings-grid">
          <div
            v-for="(player, index) in gameStore.sortedScores"
            :key="player.playerId"
            class="ranking-item"
            :class="{
              'first-place': index === 0,
              'second-place': index === 1,
              'third-place': index === 2
            }"
          >
            <div class="player-info">
              <span class="rank-position">
                {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.` }}
              </span>
              <span class="player-username">
                {{ player.username }}
              </span>
            </div>
            <span class="player-score">
              {{ player.score }} pts
            </span>
          </div>
        </div>
      </div>

      <!-- Game Stats -->
      <div class="game-stats">
        <h4 class="stats-title">Game Statistics:</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">
              {{ gameStore.totalRounds }}
            </div>
            <div class="stat-label">Rounds Played</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ lobbyStore.playerCount }}
            </div>
            <div class="stat-label">Players</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ lobbyStore.settings.questionSetTitle || 'N/A' }}
            </div>
            <div class="stat-label">Question Set</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button
          v-if="lobbyStore.isHost"
          @click="playAgain"
          class="btn btn-success play-again-button"
        >
          🔄 Play Again
        </button>

        <button
          @click="goHome"
          class="btn btn-primary home-button"
        >
          🏠 Back to Home
        </button>
      </div>

      <p v-if="lobbyStore.isHost" class="host-message">
        As the host, you can start a new game with the same players
      </p>

      <!-- Questions Recap -->
      <div v-if="gameStore.playedQuestions.length > 0" class="questions-recap">
        <h3 class="recap-title">📋 Questions from this Game</h3>
        <div class="questions-list">
          <div
            v-for="item in gameStore.playedQuestions"
            :key="item.roundNumber"
            class="question-item"
          >
            <!-- Round Header -->
            <div class="round-header">
              <span class="round-number">
                Round {{ item.roundNumber }}
              </span>
              <span v-if="item.moderatorUsername" class="moderator-info">
                👑 {{ item.moderatorUsername }}
                <span v-if="item.pointsEarned !== undefined" class="points-earned">
                  {{ item.pointsEarned }}pts
                </span>
              </span>
            </div>

            <!-- Question -->
            <div class="question-content">
              <QuestionCard v-if="item.question" :question="item.question" variant="compact" />
            </div>

            <!-- Answers -->
            <div v-if="item.answers && item.answers.length > 0" class="answers-section">
              <h4 class="answers-title">
                Answers (sorted by correct ranking):
              </h4>
              <div class="answers-list">
                <div
                  v-for="(answer, index) in getSortedAnswers(item)"
                  :key="answer.id"
                  class="answer-item"
                >
                  <!-- Position Badge -->
                  <div class="position-badge">
                    {{ index + 1 }}
                  </div>

                  <!-- Answer Content -->
                  <div class="answer-details">
                    <div class="answer-author">
                      {{ answer.username }}
                    </div>
                    <div class="answer-text">{{ answer.text }}</div>
                  </div>

                  <!-- Scale Value -->
                  <div class="scale-value">
                    {{ answer.scaleValue }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useLobbyStore } from '../stores/lobby'
import { useSocketStore } from '../stores/socket'
import QuestionCard from '../components/QuestionCard.vue'

const router = useRouter()
const gameStore = useGameStore()
const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()

onMounted(() => {
  console.log('📋 ScoreboardView mounted, played questions:', gameStore.playedQuestions?.length || 0)

  // Listen for game restart
  socketStore.socket?.on('game:restarted', () => {
    gameStore.reset()
    router.push(`/lobby/${lobbyStore.lobbyCode}`)
  })
})

function playAgain() {
  if (confirm('Start a new game with the same players?')) {
    socketStore.restartGame()
  }
}

function goHome() {
  if (confirm('Leave the lobby and return to home?')) {
    socketStore.leaveLobby()
    gameStore.reset()
    lobbyStore.reset()
    router.push('/')
  }
}

function getSortedAnswers(roundItem) {
  if (!roundItem.answers || !roundItem.correctRanking) {
    return roundItem.answers || []
  }

  // Sort answers by correct ranking (by scale value)
  return [...roundItem.answers].sort((a, b) => a.scaleValue - b.scaleValue)
}
</script>
