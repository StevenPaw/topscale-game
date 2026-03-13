<template>
    <div 
        class="ranking-item" 
        :class="[
            `ranking-item--${variant}`,
            { 
                'ranking-item--correct': variant === 'detail' && isCorrect,
                'ranking-item--incorrect': variant === 'detail' && !isCorrect
            }
        ]"
    >
        <!-- Status Icon (only for detail variant) -->
        <div
            v-if="variant === 'detail'" 
            class="status-icon" 
            :class="{ correct: isCorrect, incorrect: !isCorrect }"
        >
            <img :src="isCorrect ? correctIcon : wrongIcon" alt="Correct Icon"/>
        </div>

        <!-- Rank Badge -->
        <div class="rank-badge">
            {{ variant === 'sortable' ? rank : actualValue }}
        </div>

        <!-- Answer Content -->
        <div class="answer-content">
            <div class="answer-username">
                {{ username }}
            </div>
            <div class="answer-text">{{ answerText }}</div>

            <!-- Detail variant: Show position info and actual value -->
            <template v-if="variant === 'detail'">                
                <div class="position-info" v-if="moderatorPosition && correctPosition">
                    <div class="position-item">
                        <span class="position-label">Moderator Rank:</span> #{{ moderatorPosition }}
                    </div>
                    <div class="position-item">
                        <span class="position-label">Correct Rank:</span> #{{ correctPosition }}
                    </div>
                    <div v-if="positionDiff !== 0" class="position-diff">
                        ({{ positionDiff > 0 ? '+' : '' }}{{ positionDiff }} off)
                    </div>
                </div>
            </template>
        </div>

        <!-- Move Buttons (only for sortable variant) -->
        <div v-if="variant === 'sortable'" class="move-buttons">
            <button
                @click="$emit('move-up')"
                :disabled="isFirst"
                class="move-button"
                :class="{ disabled: isFirst }"
            >
                <img :src="upIcon" alt="Move Up" class="move-icon" />
            </button>
            <button
                @click="$emit('move-down')"
                :disabled="isLast"
                class="move-button"
                :class="{ disabled: isLast }"
            >
                <img :src="downIcon" alt="Move Down" class="move-icon" />
            </button>
        </div>
    </div>
</template>

<script setup>
import upIcon from '../../../icons/icon_up.svg'
import downIcon from '../../../icons/icon_down.svg'
import correctIcon from '../../../icons/icon_correct.svg'
import wrongIcon from '../../../icons/icon_wrong.svg'

const props = defineProps({
    // Common props
    rank: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    answerText: {
        type: String,
        required: true
    },
    
    // Variant type
    variant: {
        type: String,
        default: 'live', // 'sortable', 'live', 'detail', 'history'
        validator: (value) => ['sortable', 'live', 'detail', 'history'].includes(value)
    },
    
    // Sortable variant props
    isFirst: {
        type: Boolean,
        default: false
    },
    isLast: {
        type: Boolean,
        default: false
    },
    
    // Detail variant props
    isCorrect: {
        type: Boolean,
        default: true
    },
    actualValue: {
        type: [Number, String],
        default: undefined
    },
    moderatorPosition: {
        type: Number,
        default: undefined
    },
    correctPosition: {
        type: Number,
        default: undefined
    },
    positionDiff: {
        type: Number,
        default: 0
    }
})

defineEmits(['move-up', 'move-down'])
</script>
