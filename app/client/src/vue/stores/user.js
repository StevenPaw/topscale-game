import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const username = ref('')
  const userId = ref(null)
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

    if (savedUsername) {
      username.value = savedUsername
    }
    if (savedUserId) {
      userId.value = savedUserId
    }
  }

  // Init
  loadFromLocalStorage()

  return {
    username,
    userId,
    isLoggedIn,
    stats,
    setUsername,
    setUserId,
    login,
    logout,
    loadFromLocalStorage
  }
})
