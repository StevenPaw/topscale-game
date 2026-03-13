<template>
    <div class="error-message">
        <img :src="warningIcon" alt="Warning" class="warning-icon" />
        <p>{{ props.Message }}</p>
    </div>
</template>
<script setup>
    import { ref } from 'vue';
    import warningIcon from '../../../icons/icon_warning.svg';

    const props = defineProps({
    Message: {
        type: String,
        required: true,
    }
    })
</script>
