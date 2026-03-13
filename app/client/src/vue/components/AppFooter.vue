<template>
    <div class="card card--footer">
        <button
            class="w-full login-button"
            @click="showLoginModal = true"
        >
            Login / Register
        </button>

        <button
            @click="showNameChanger = true"
            class="mt-4 w-full change-name-button"
            >
            Change Name
        </button>

        <!-- Name Changer Modal -->
        <NameChanger
            v-model="showNameChanger"
            :join-code="props.joinCode"
            @saved="handleNameSaved"
        >
            <template #hint>
                <div v-if="props.joinCode" class="mb-4 join-hint">
                    <p class="text-center">
                        You're joining lobby: <strong>{{ props.joinCode }}</strong>
                    </p>
                </div>
            </template>
        </NameChanger>

        <!-- Login Modal (placeholder) -->
        <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
            <div class="card modal-card" @click.stop>
                <h3 class="">Login / Register</h3>
                <p class="modal-text">This feature will be implemented soon. For now, you can play without an account!</p>
                <button class="btn btn-primary w-full" @click="showLoginModal = false">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import NameChanger from './NameChanger.vue'

// Props empfangen
const props = defineProps({
    joinCode: {
        type: String,
        default: ''
    },
    showNameChangerInitial: {
        type: Boolean,
        default: false
    }
})

// Emits definieren
const emit = defineEmits(['handleNameSaved'])

const showNameChanger = ref(false)
const showLoginModal = ref(false)

// Watch für showNameChangerInitial von parent
watch(() => props.showNameChangerInitial, (newVal) => {
    if (newVal) {
        showNameChanger.value = true
    }
})

// Event von NameChanger weiterleiten an parent (HomeView)
function handleNameSaved(data) {
    console.log('Name saved in AppFooter:', data)
    emit('handleNameSaved', data)
}
</script>
