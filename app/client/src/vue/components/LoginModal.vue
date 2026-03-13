<template>
    <Teleport to="body">
        <div v-if="modelValue" class="modal-overlay modal--login" @click="closeModal">
            <div class="card modal-card" @click.stop>
                <h3 class="card_title">Login / Register</h3>
                <p class="modal-text">This feature will be implemented soon. For now, you can play without an account!</p>
                <button class="btn btn-primary w-full" @click="closeModal">Close</button>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

function closeModal() {
    emit('update:modelValue', false)
}
</script>
