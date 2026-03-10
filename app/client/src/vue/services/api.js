import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'https://topscale-game.ddev.site/api'
    : `${window.location.origin}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
})

// Request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API Methods
export default {
  // User endpoints
  user: {
    create(data) {
      return api.post('/users', data)
    },
    get(id) {
      return api.get(`/users/${id}`)
    },
    update(id, data) {
      return api.put(`/users/${id}`, data)
    },
    login(credentials) {
      return api.post('/users/login', credentials)
    }
  },

  // QuestionSet endpoints
  questionSets: {
    getAll() {
      return api.get('/question-sets')
    },
    get(id) {
      return api.get(`/question-sets/${id}`)
    },
    getQuestions(setId) {
      return api.get(`/question-sets/${setId}/questions`)
    }
  },

  // Question endpoints
  questions: {
    getRandom(setId, count = 10) {
      return api.get(`/questions/random?set=${setId}&count=${count}`)
    }
  },

  // GameSession endpoints (stats)
  gameSessions: {
    create(data) {
      return api.post('/game-sessions', data)
    },
    update(id, data) {
      return api.put(`/game-sessions/${id}`, data)
    },
    get(id) {
      return api.get(`/game-sessions/${id}`)
    }
  },

  // Round endpoints
  rounds: {
    create(data) {
      return api.post('/rounds', data)
    }
  },

  // Answer endpoints
  answers: {
    create(data) {
      return api.post('/answers', data)
    }
  }
}
