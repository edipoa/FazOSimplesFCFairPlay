<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}>(), {
  type: 'success',
  duration: 3000
});

const emit = defineEmits(['close']);

let timer: number | null = null;

const startTimer = () => {
  if (props.duration > 0) {
    timer = window.setTimeout(() => {
      emit('close');
    }, props.duration);
  }
};

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

onMounted(() => {
  if (props.show) startTimer();
});

// Watch for show prop changes to reset timer if re-shown
import { watch } from 'vue';
watch(() => props.show, (newVal) => {
  if (newVal) {
    clearTimer();
    startTimer();
  } else {
    clearTimer();
  }
});

onUnmounted(() => {
  clearTimer();
});
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="show"
      class="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircle v-if="type === 'success'" class="h-6 w-6 text-green-400" />
            <AlertCircle v-else-if="type === 'error'" class="h-6 w-6 text-red-400" />
            <Info v-else class="h-6 w-6 text-blue-400" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ type === 'success' ? 'Sucesso!' : type === 'error' ? 'Erro!' : 'Info' }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button 
              @click="$emit('close')"
              class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span class="sr-only">Fechar</span>
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <!-- Progress Bar (Optional visual flare) -->
       <div 
        v-if="duration > 0"
        class="h-1 bg-gray-100 w-full"
      >
        <div 
            class="h-full transition-all duration-linear"
            :class="{
                'bg-green-500': type === 'success',
                'bg-red-500': type === 'error',
                'bg-blue-500': type === 'info',
            }"
            :style="{ 
                width: show ? '0%' : '100%', 
                transitionDuration: `${duration}ms` 
            }"
        ></div>
      </div>
    </div>
  </Transition>
</template>
