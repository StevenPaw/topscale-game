<template>
  <div v-if="question" class="card question-card" :class="variant">
    <h3 class="question-title" :class="[variant, { 'no-scale': !question.scaleFrom }]">
      {{ question.text }}
    </h3>

    <div
      v-if="question.scaleFrom && question.scaleTo"
      class="scale-container"
      :class="variant"
    >
      <div class="scale-start">
        <span class="scale-label">1:</span> {{ question.scaleFrom }}
      </div>
      <div class="scale-arrow">→</div>
      <div class="scale-end">
        <span class="scale-label">10:</span> {{ question.scaleTo }}
      </div>
    </div>
  </div>
</template>

<script setup>
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
</script>
