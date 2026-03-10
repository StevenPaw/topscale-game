<template>
  <div id="app">
    <main class="main">
      <div class="container">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useSocketStore } from './stores/socket'

const socketStore = useSocketStore()

onMounted(() => {
  // Connect to WebSocket server
  socketStore.connect()
  console.log('Lets get scaling!')
})

onUnmounted(() => {
  if (socketStore.isConnected) {
    socketStore.disconnect()
  }
})
</script>

<style scoped>
.header {
  background: var(--primary);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
}

@media (min-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
}
</style>
