import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/:code',
    name: 'game-lobby',
    component: () => import('../views/GameLobbyView.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/game'),
  routes
})

// Navigation guard: Redirect to home if no username is set
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // If navigating to a lobby code without username, redirect to home with code as query
  if (to.name === 'game-lobby' && !userStore.username) {
    console.log('⚠️ No username set, redirecting to home with code:', to.params.code)
    next({ 
      name: 'home', 
      query: { join: to.params.code.toUpperCase() } 
    })
  } else {
    next()
  }
})

export default router
