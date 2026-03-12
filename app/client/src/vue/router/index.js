import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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

export default router
