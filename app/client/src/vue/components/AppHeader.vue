<template>
    <div class="card header-card">
        <h2 class="">
            {{ props.HeaderTitle }}
        </h2>
        <div class="app-header_actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
  HeaderTitle: {
    type: String,
    required: true
  }
})
</script>
