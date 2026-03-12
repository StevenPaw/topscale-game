<template>
  <div class="scoreboard-view">
    <div class="card" style="max-width: 800px; margin: 2rem auto;">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">🏆 Game Over!</h1>
        <p style="color: var(--gray-600); font-size: 1.125rem;">
          Final Scoreboard
        </p>
      </div>

      <!-- Winner Podium -->
      <div v-if="gameStore.sortedScores.length > 0" class="mb-6" style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">👑</div>
        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">
          {{ gameStore.sortedScores[0].username }}
        </h2>
        <div style="font-size: 1.5rem; font-weight: 700;">
          {{ gameStore.sortedScores[0].score }} points
        </div>
      </div>

      <!-- Full Rankings -->
      <div class="mb-6">
        <h3 class="mb-4" style="font-size: 1.5rem;">Final Rankings:</h3>
        <div style="display: grid; gap: 0.75rem;">
          <div
            v-for="(player, index) in gameStore.sortedScores"
            :key="player.playerId"
            style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; background: white; border: 2px solid var(--gray-200); border-radius: 0.75rem; transition: all 0.2s;"
            :style="index === 0 ? 'border-color: gold; background: #fffbeb;' : index === 1 ? 'border-color: silver;' : index === 2 ? 'border-color: #cd7f32;' : ''"
          >
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="font-size: 1.5rem; font-weight: 700; min-width: 2rem;">
                {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.` }}
              </span>
              <span style="font-size: 1.125rem; font-weight: 600;">
                {{ player.username }}
              </span>
            </div>
            <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">
              {{ player.score }} pts
            </span>
          </div>
        </div>
      </div>

      <!-- Game Stats -->
      <div class="mb-6" style="background: var(--gray-100); padding: 1.5rem; border-radius: 0.75rem;">
        <h4 class="mb-3">Game Statistics:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div class="text-center">
            <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">
              {{ gameStore.totalRounds }}
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">Rounds Played</div>
          </div>
          <div class="text-center">
            <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">
              {{ lobbyStore.playerCount }}
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">Players</div>
          </div>
          <div class="text-center">
            <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">
              {{ lobbyStore.settings.questionSetTitle || 'N/A' }}
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">Question Set</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button
          v-if="lobbyStore.isHost"
          @click="playAgain"
          class="btn btn-success"
          style="flex: 1; padding: 1rem; font-size: 1.125rem;"
        >
          🔄 Play Again
        </button>

        <button
          @click="goHome"
          class="btn btn-primary"
          style="flex: 1; padding: 1rem; font-size: 1.125rem;"
        >
          🏠 Back to Home
        </button>
      </div>

      <p v-if="lobbyStore.isHost" class="text-center mt-4" style="color: var(--gray-600); font-size: 0.875rem;">
        As the host, you can start a new game with the same players
      </p>

      <!-- Questions Recap -->
      <div v-if="gameStore.playedQuestions.length > 0" class="mt-6" style="border-top: 2px solid var(--gray-200); padding-top: 2rem;">
        <h3 class="mb-4" style="font-size: 1.5rem;">📋 Questions from this Game</h3>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div
            v-for="item in gameStore.playedQuestions"
            :key="item.roundNumber"
            style="border: 2px solid var(--gray-200); border-radius: 0.75rem; overflow: hidden;"
          >
            <!-- Round Header -->
            <div style="background: var(--gray-100); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.875rem; color: var(--gray-600);">
                Round {{ item.roundNumber }}
              </span>
              <span v-if="item.moderatorUsername" style="font-size: 0.875rem; color: var(--gray-600);">
                👑 {{ item.moderatorUsername }}
                <span v-if="item.pointsEarned !== undefined" style="margin-left: 0.5rem; color: var(--primary); font-weight: 600;">
                  {{ item.pointsEarned }}pts
                </span>
              </span>
            </div>

            <!-- Question -->
            <div style="padding: 1rem; border-bottom: 2px solid var(--gray-200);">
              <QuestionCard v-if="item.question" :question="item.question" variant="compact" />
            </div>

            <!-- Answers -->
            <div v-if="item.answers && item.answers.length > 0" style="padding: 1rem;">
              <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600); margin-bottom: 0.75rem;">
                Answers (sorted by correct ranking):
              </h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div
                  v-for="(answer, index) in getSortedAnswers(item)"
                  :key="answer.id"
                  style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem; border: 1px solid var(--gray-200);"
                >
                  <!-- Position Badge -->
                  <div
                    style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: white; flex-shrink: 0;"
                  >
                    {{ index + 1 }}
                  </div>

                  <!-- Answer Content -->
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.125rem;">
                      {{ answer.username }}
                    </div>
                    <div style="font-size: 0.875rem;">{{ answer.text }}</div>
                  </div>

                  <!-- Scale Value -->
                  <div
                    style="padding: 0.25rem 0.625rem; border-radius: 0.5rem; background: var(--primary); color: white; font-weight: 600; font-size: 0.875rem; flex-shrink: 0;"
                  >
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
    router.push(`/${lobbyStore.lobbyCode}`)
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
