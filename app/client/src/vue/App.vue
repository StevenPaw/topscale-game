<template>
    <main class="main">
        <RouterView />
    </main>
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
