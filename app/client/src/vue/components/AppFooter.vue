<template>
    <div class="card card--footer">
        <button
            class="login-button"
            @click="showLoginModal = true"
        >
            Login / Register
        </button>

        <button
            @click="showNameChanger = true"
            class="change-name-button"
            >
            Change Name
        </button>

        <!-- Name Changer Modal -->
        <NameChangerModal
            v-model="showNameChanger"
            :join-code="props.joinCode"
            @saved="handleNameSaved"
        >
            <template v-if="props.joinCode" #hint>
                <div class="join-hint">
                    <p class="text-center">
                        You're joining lobby: <strong>{{ props.joinCode }}</strong>
                    </p>
                </div>
            </template>
        </NameChangerModal>

        <!-- Login Modal -->
        <LoginModal v-model="showLoginModal" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import NameChangerModal from './NameChangerModal.vue'
import LoginModal from './LoginModal.vue'

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
