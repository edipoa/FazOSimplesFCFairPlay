<script setup lang="ts">
import { ref } from 'vue';
import { Star } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: number;
  readOnly?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const hoverRating = ref(0);

const setRating = (rating: number) => {
  if (props.readOnly) return;
  emit('update:modelValue', rating);
};

const setHover = (rating: number) => {
  if (props.readOnly) return;
  hoverRating.value = rating;
};

// Reset hover when mouse leaves
const resetHover = () => {
    if (props.readOnly) return;
    hoverRating.value = 0;
}

</script>

<template>
  <div class="flex items-center space-x-1" @mouseleave="resetHover">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      @click="setRating(star)"
      @mouseenter="setHover(star)"
      :class="[
        'focus:outline-none transition-transform duration-100',
        !readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
      ]"
      :disabled="readOnly"
    >
      <Star 
        class="w-6 h-6" 
        :class="[
          (hoverRating || modelValue) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        ]"
      />
    </button>
  </div>
</template>
