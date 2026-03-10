<template>
  <div v-if="question" class="card question-card" :style="cardStyle">
    <h3 :style="titleStyle">
      {{ question.text }}
    </h3>

    <div
      v-if="question.scaleFrom && question.scaleTo"
      :style="scaleContainerStyle"
    >
      <div style="flex: 1; text-align: left; color: var(--text-secondary);">
        <span style="font-weight: 600; color: var(--primary);">1:</span> {{ question.scaleFrom }}
      </div>
      <div style="font-size: 1.5rem; color: var(--text-secondary);">→</div>
      <div style="flex: 1; text-align: right; color: var(--text-secondary);">
        <span style="font-weight: 600; color: var(--primary);">10:</span> {{ question.scaleTo }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.text === 'string'
    }
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact'].includes(value)
  }
})

const cardStyle = computed(() => {
  const baseStyle = {
    padding: props.variant === 'compact' ? '1rem' : '1.5rem',
    marginBottom: '2rem',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid var(--success)'
  }
  return baseStyle
})

const titleStyle = computed(() => {
  return {
    fontSize: props.variant === 'compact' ? '1rem' : '1.125rem',
    fontWeight: '700',
    marginBottom: props.question?.scaleFrom ? '1rem' : '0',
    textAlign: 'center'
  }
})

const scaleContainerStyle = computed(() => {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: props.variant === 'compact' ? '0.75rem' : '0.875rem'
  }
})
</script>

<style scoped>
.question-card {
  transition: all 0.2s ease;
}
</style>
