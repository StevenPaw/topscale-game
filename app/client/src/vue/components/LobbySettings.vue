<template>
    <!-- Settings Modal -->
    <div
    v-if="props.showSettings"
    @click="emit('update:showSettings', false)"
    class="modal-overlay modal-overlay--settings"
    >
        <div
            @click.stop
            class="card settings-modal"
        >
            <!-- Settings Header -->
            <h2 class="settings-title">Game Settings</h2>

            <!-- Question Packs -->
            <div class="settings-section settings-section--packs">
                <h3 class="section-title">Question Packs</h3>

                <!-- Loading State -->
                <div v-if="loadingQuestionPacks" class="loading-state">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading question packs...</p>
                </div>

                <!-- Question Pack List -->
                <div v-else class="pack-list">
                    <label
                    v-for="pack in availableQuestionPacks"
                    :key="pack.id"
                    class="pack-item"
                    >
                    <input
                        type="checkbox"
                        v-model="pack.selected"
                        class="pack-checkbox"
                    />
                    <div class="pack-info">
                        <div class="pack-title">{{ pack.title }}</div>
                        <div class="pack-count">
                        {{ pack.questionCount }} questions
                        </div>
                    </div>
                    </label>
                </div>
                <p v-if="!hasQuestionPacks" class="error-message">
                    ⚠️ Please select at least one question pack
                </p>
            </div>

            <!-- Game Rules -->
            <div class="settings-section">
            <h3 class="section-title">Game Rules</h3>

            <div class="input-group">
                <label class="input-label">
                Number of Rounds
                </label>
                <input
                type="number"
                v-model="settings.totalRounds"
                min="5"
                max="20"
                class="number-input"
                />
            </div>

            <div class="input-group">
                <label class="input-label">
                Max Round Timer
                </label>
                <input
                type="number"
                v-model="settings.timeLimit"
                min="30"
                max="180"
                class="number-input"
                />
                <p class="input-hint">In seconds</p>
            </div>
            </div>

            <!-- Leaderboard -->
            <div class="settings-section">
            <h3 class="section-title">Leaderboard</h3>
            <label class="toggle-option">
                <div>
                <div class="option-title">Top 3 Leaderboard Only</div>
                <p class="option-description">
                    Disable to show the complete leaderboard for all players at the end of the game
                </p>
                </div>
                <input
                type="checkbox"
                v-model="settings.top3Only"
                class="toggle-checkbox"
                />
            </label>
            </div>

            <!-- Save Button -->
            <button
            @click="saveSettings"
            class="btn btn-success w-full save-button"
            >
            💾 Save Settings
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useLobbyStore } from '../stores/lobby'
import { useSocketStore } from '../stores/socket'

// Props
const props = defineProps({
  showSettings: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:showSettings'])

const lobbyStore = useLobbyStore()
const socketStore = useSocketStore()

const loadingQuestionPacks = ref(true)
const availableQuestionPacks = ref([])

const settings = ref({
  totalRounds: 10,
  timeLimit: 60,
  top3Only: false
})

const hasQuestionPacks = computed(() => {
  return availableQuestionPacks.value.some(pack => pack.selected)
})

// Load question packs from API
async function loadQuestionPacks() {
  try {
    loadingQuestionPacks.value = true

    // Get API URL from env or construct from current origin (without port)
    let apiUrl = import.meta.env.VITE_API_URL

    if (!apiUrl) {
      // Fallback: use current origin but remove port if it's 5173 (Vite dev server)
      const origin = window.location.origin
      apiUrl = origin.replace(':5173', '').replace(':3000', '')
    }

    const url = `${apiUrl}/api/game/groups`
    console.log('🔍 Fetching question packs from:', url)

    const response = await fetch(url)
    console.log('📡 Response status:', response.status)

    const text = await response.text()
    const data = JSON.parse(text)
    console.log('📦 Parsed data:', data)

    if (data.success && data.groups) {
      availableQuestionPacks.value = data.groups.map((group, index) => ({
        id: group.id,
        title: group.only18 ? `${group.title} (18+)` : group.title,
        questionCount: group.questionCount,
        only18: group.only18,
        selected: index === 0 // Select first pack by default
      }))
      console.log('✅ Loaded question packs:', availableQuestionPacks.value)
    } else {
      console.error('Failed to load question packs from API - invalid response format')
      // Fallback to default pack
      availableQuestionPacks.value = [
        { id: 1, title: 'Default Pack', questionCount: 0, only18: false, selected: true }
      ]
    }
  } catch (error) {
    console.error('❌ Error loading question packs:', error)
    // Fallback to default pack
    availableQuestionPacks.value = [
      { id: 1, title: 'Default Pack', questionCount: 0, only18: false, selected: true }
    ]
  } finally {
    loadingQuestionPacks.value = false
  }
}

// Sync selected packs with lobby settings
watchEffect(() => {
  if (lobbyStore.settings?.questionPacks && availableQuestionPacks.value.length > 0) {
    const serverSelectedPacks = lobbyStore.settings.questionPacks
    availableQuestionPacks.value.forEach(pack => {
      pack.selected = serverSelectedPacks.includes(pack.id)
    })
  }

  // Sync other settings
  if (lobbyStore.settings) {
    if (lobbyStore.settings.timeLimit) {
      settings.value.timeLimit = lobbyStore.settings.timeLimit
    }
    if (lobbyStore.settings.totalRounds) {
      settings.value.totalRounds = lobbyStore.settings.totalRounds
    }
    if (lobbyStore.settings.top3Only !== undefined) {
      settings.value.top3Only = lobbyStore.settings.top3Only
    }
  }
})

function saveSettings() {
  const selectedPacks = availableQuestionPacks.value
    .filter(pack => pack.selected)
    .map(pack => pack.id)

  if (selectedPacks.length === 0) {
    alert('Please select at least one question pack')
    return
  }

  socketStore.updateLobbySettings({
    questionPacks: selectedPacks,
    timeLimit: parseInt(settings.value.timeLimit),
    totalRounds: parseInt(settings.value.totalRounds),
    top3Only: settings.value.top3Only
  })

  emit('update:showSettings', false)
}

onMounted(() => {
  loadQuestionPacks()
})
</script>
