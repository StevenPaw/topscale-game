<template>
    <main class="main">
        <img
            :src="backgroundimage"
            alt="Backgroundimage"
            class="bckg-image"
        />
        <RouterView />
    </main>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useSocketStore } from './stores/socket'
import backgroundimage from '../../images/backgroundimage.jpg'

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
