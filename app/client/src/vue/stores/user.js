import { defineStore } from 'pinia'
import { ref } from 'vue'

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export const useUserStore = defineStore('user', () => {
  // State
  const username = ref('')
  const userId = ref(null)
  const sessionId = ref('')
  const isLoggedIn = ref(false)
  const stats = ref({
    totalScore: 0,
    gamesPlayed: 0
  })

  // Actions
  function setUsername(name) {
    username.value = name
    localStorage.setItem('quiz_username', name)
  }

  function setUserId(id) {
    userId.value = id
    if (id) {
      localStorage.setItem('quiz_user_id', id)
    } else {
      localStorage.removeItem('quiz_user_id')
    }
  }

  function login(email, password) {
    // TODO: Call SilverStripe API
    console.log('Login not yet implemented')
    isLoggedIn.value = true
  }

  function logout() {
    userId.value = null
    isLoggedIn.value = false
    localStorage.removeItem('quiz_user_id')
  }

  function loadFromLocalStorage() {
    const savedUsername = localStorage.getItem('quiz_username')
    const savedUserId = localStorage.getItem('quiz_user_id')
    let savedSessionId = localStorage.getItem('quiz_session_id')

    if (savedUsername) {
      username.value = savedUsername
    }
    if (savedUserId) {
      userId.value = savedUserId
    }

    // Generate or load session ID
    if (!savedSessionId) {
      savedSessionId = generateSessionId()
      localStorage.setItem('quiz_session_id', savedSessionId)
    }
    sessionId.value = savedSessionId
  }

  function clearSession() {
    localStorage.removeItem('quiz_session_id')
    sessionId.value = generateSessionId()
    localStorage.setItem('quiz_session_id', sessionId.value)
  }

  // Init
  loadFromLocalStorage()

  return {
    username,
    userId,
    sessionId,
    isLoggedIn,
    stats,
    setUsername,
    setUserId,
    login,
    logout,
    loadFromLocalStorage,
    clearSession
  }
})
