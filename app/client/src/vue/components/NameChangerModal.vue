<template>
    <!-- Modal Overlay -->
    <Teleport to="body">
        <div v-if="modelValue" class="namechanger modal-overlay" @click="closeModal">
            <div class="card modal-card" @click.stop>
            <h3 class="card_title">{{ isChangingName ? 'Change Your Name' : 'Welcome!' }}</h3>

            <!-- Hint slot for contextual messages -->
            <div v-if="$slots.hint" class="namechanger-hint">
                <slot name="hint"></slot>
            </div>

            <div class="input-row">
                <label class="label">Enter your name:</label>
                <input
                    v-model="tempUsername"
                    type="text"
                    placeholder="Your name..."
                    class=""
                    @keyup.enter="saveUsername"
                    @keyup.esc="closeModal"
                    ref="nameInput"
                    autofocus
                    maxlength="20"
                />
                <p class="datasecurity-hint">
                    Visible to other players in the lobby.
                </p>
            </div>

            <div class="button-row">
                <button
                    @click="saveUsername"
                    class="btn btn-primary"
                    :disabled="!tempUsername.trim()"
                >
                    {{ buttonText }}
                </button>
                <button
                    v-if="isChangingName"
                    @click="closeModal"
                    class="btn btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
    </Teleport>
</template>

<script setup>
    import { ref, watch, computed, nextTick } from 'vue'
    import { useUserStore } from '../stores/user'

    const props = defineProps({
        modelValue: {
            type: Boolean,
            default: false
        },
        joinCode: {
            type: String,
            default: ''
        }
    })

    const emit = defineEmits(['update:modelValue', 'saved'])

    const userStore = useUserStore()
    const tempUsername = ref('')
    const nameInput = ref(null)

    // Check if we're changing an existing name or setting initial name
    const isChangingName = computed(() => !!userStore.username)

    // Dynamic button text based on context
    const buttonText = computed(() => {
        if (isChangingName.value) return 'Save'
        if (props.joinCode) return 'Join Lobby'
        return 'Continue'
    })

    //If no username is set, open this modal on mount
    if (!userStore.username) {
        emit('update:modelValue', true)
    }

    // Watch for modal opening to set initial value and focus
    watch(() => props.modelValue, (isOpen) => {
        if (isOpen) {
            tempUsername.value = userStore.username || ''
            nextTick(() => {
                nameInput.value?.focus()
            })
        }
    })

    function saveUsername() {
        if (tempUsername.value.trim()) {
            const newName = tempUsername.value.trim()
            userStore.setUsername(newName)

            // Emit saved event with username and joinCode
            emit('saved', {
                username: newName,
                joinCode: props.joinCode
            })

            // Close modal
            closeModal()
        }
    }

    function closeModal() {
        // Only allow closing if user already has a name
        if (!isChangingName.value && !userStore.username) {
            return // Don't close if this is initial setup
        }
        emit('update:modelValue', false)
    }
</script>
