import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // State
  const gameState = ref('idle') // idle, waiting, playing, round-results, finished
  const phase = ref('lobby') // lobby, question, sorting, results, podium
  const myRole = ref('spectator') // player, moderator, spectator
  const currentRound = ref(0)
  const totalRounds = ref(10)
  const currentQuestion = ref(null)
  const currentRoundLeader = ref(null)
  const answers = ref([])
  const scores = ref({}) // { playerId: score }
  const timeRemaining = ref(60)
  const myAnswer = ref('')
  const hasSubmitted = ref(false)
  const answersForRanking = ref([]) // For moderator to rank
  const myScaleValue = ref(null) // Player's scale value for current round
  const isModerator = ref(false) // Is the current user the moderator this round?
  const timeLimit = ref(60) // Time limit for the current round
  const roundLeader = ref(null) // Leader info {id, username}
  const totalPlayersInRound = ref(0) // Number of players (non-moderators) in current round
  const playedQuestions = ref([]) // All questions played during the game

  // Getters
  const isMyTurnAsLeader = computed(() => {
    // TODO: Check if current user is round leader
    return currentRoundLeader.value?.isMe || false
  })

  const sortedScores = computed(() => {
    return Object.entries(scores.value)
      .map(([playerId, data]) => ({
        playerId,
        username: data.username || playerId,
        score: data.score || 0
      }))
      .sort((a, b) => b.score - a.score)
  })

  const allAnswersSubmitted = computed(() => {
    // Check if all players have submitted their answers
    return answers.value.length > 0
  })

  // Actions
  function startGame(rounds = 10) {
    gameState.value = 'playing'
    currentRound.value = 1
    totalRounds.value = rounds
    scores.value = {}
  }

  function setCurrentQuestion(question) {
    currentQuestion.value = question
    answers.value = []
    myAnswer.value = ''
    hasSubmitted.value = false
  }

  function setRoundLeader(leader) {
    currentRoundLeader.value = leader
  }

  function submitAnswer(answerText) {
    myAnswer.value = answerText
    hasSubmitted.value = true
    // Actual submission happens via socket
  }

  function addAnswer(answer) {
    const exists = answers.value.find(a => a.playerId === answer.playerId)
    if (!exists) {
      answers.value.push(answer)
    }
  }

  function selectWinner(answerId) {
    // Emit via socket - handled by socket store
    const answer = answers.value.find(a => a.id === answerId)
    if (answer) {
      updateScore(answer.playerId, 10) // 10 points for winner
    }
  }

  function updateScore(playerId, points, username = null) {
    if (!scores.value[playerId]) {
      scores.value[playerId] = { score: 0, username: username || playerId }
    }
    scores.value[playerId].score += points
  }

  function setScores(newScores) {
    scores.value = newScores
  }

  function nextRound() {
    currentRound.value++
    if (currentRound.value > totalRounds.value) {
      gameState.value = 'finished'
    } else {
      gameState.value = 'playing'
    }
  }

  function setGameState(state) {
    gameState.value = state
  }

  function setTimeRemaining(time) {
    timeRemaining.value = time
  }

  function setAnswersForRanking(answersList) {
    answersForRanking.value = answersList
  }

  function setPhase(newPhase) {
    phase.value = newPhase
    console.log('📍 Phase changed to:', newPhase)
  }

  function setMyRole(role) {
    myRole.value = role
    console.log('👤 My role is now:', role)
  }

  function setMyScaleValue(value) {
    myScaleValue.value = value
  }

  function setIsModerator(value) {
    isModerator.value = value
    myRole.value = value ? 'moderator' : 'player'
  }

  function setTimeLimit(limit) {
    timeLimit.value = limit
  }

  function setRoundData(data) {
    // Set all round-related data from round:started event
    currentRound.value = data.roundNumber
    totalRounds.value = data.totalRounds
    currentQuestion.value = data.question
    timeLimit.value = data.timeLimit
    timeRemaining.value = data.timeLimit
    isModerator.value = data.isModerator
    myScaleValue.value = data.myScaleValue
    myRole.value = data.isModerator ? 'moderator' : 'player'
    totalPlayersInRound.value = data.totalPlayers || 0
    roundLeader.value = {
      id: data.moderator.id,
      username: data.moderator.username
    }
    currentRoundLeader.value = roundLeader.value

    // Reset answer state
    myAnswer.value = ''
    hasSubmitted.value = false
    answers.value = []
    answersForRanking.value = []

    console.log('🎮 Round data set:', {
      round: currentRound.value,
      isModerator: isModerator.value,
      scaleValue: myScaleValue.value,
      totalPlayers: totalPlayersInRound.value
    })
  }

  function setPlayedQuestions(questions) {
    playedQuestions.value = questions
  }

  function reset() {
    gameState.value = 'idle'
    phase.value = 'lobby'
    myRole.value = 'spectator'
    currentRound.value = 0
    currentQuestion.value = null
    currentRoundLeader.value = null
    answers.value = []
    scores.value = {}
    timeRemaining.value = 60
    myAnswer.value = ''
    hasSubmitted.value = false
    myScaleValue.value = null
    playedQuestions.value = []
  }

  return {
    gameState,
    phase,
    myRole,
    myScaleValue,
    isModerator,
    timeLimit,
    roundLeader,
    totalPlayersInRound,
    playedQuestions,
    currentRound,
    totalRounds,
    currentQuestion,
    currentRoundLeader,
    answers,
    scores,
    timeRemaining,
    myAnswer,
    hasSubmitted,
    answersForRanking,
    isMyTurnAsLeader,
    sortedScores,
    allAnswersSubmitted,
    startGame,
    setCurrentQuestion,
    setRoundLeader,
    submitAnswer,
    addAnswer,
    selectWinner,
    updateScore,
    setScores,
    nextRound,
    setGameState,
    setTimeRemaining,
    setAnswersForRanking,
    setPhase,
    setMyRole,
    setMyScaleValue,
    setIsModerator,
    setTimeLimit,
    setRoundData,
    setPlayedQuestions,
    reset
  }
})
