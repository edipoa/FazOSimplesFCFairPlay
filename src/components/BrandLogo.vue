<script setup lang="ts">
import logoImg from '../assets/dark-logo.png';

withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  showSubtitle?: boolean;
  layout?: 'vertical' | 'horizontal';
  titleClass?: string;
}>(), {
  layout: 'vertical',
  showTitle: true,
});

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.style.display = 'none';
  }
};
</script>

<template>
  <div
    class="flex items-center justify-center"
    :class="{
      'flex-col': layout === 'vertical',
      'flex-row gap-2': layout === 'horizontal'
    }"
  >
    <div
      class="bg-bf-navy dark:bg-transparent rounded-xl dark:rounded-none flex items-center justify-center flex-shrink-0"
      :class="{
        'h-9 w-9 p-1 dark:p-0': size === 'sm',
        'h-12 w-12 p-1.5 dark:p-0': size === 'md' || !size,
        'h-16 w-16 p-2 dark:p-0': size === 'lg'
      }"
    >
      <img
        :src="logoImg"
        alt="Faz o Simples Logo"
        class="object-contain w-full h-full"
        @error="handleImageError"
      />
    </div>

    <div
      v-if="showTitle || showSubtitle"
      :class="{
        'text-center mt-1': layout === 'vertical',
        'text-left': layout === 'horizontal'
      }"
    >
      <h1
        v-if="showTitle"
        class="font-bold leading-tight"
        :class="[
          titleClass || 'text-foreground',
          {
            'text-sm': size === 'sm',
            'text-xl': size === 'md' || !size,
            'text-2xl': size === 'lg'
          }
        ]"
      >
        Faz o Simples
      </h1>
      <span
        v-if="showSubtitle"
        class="block font-semibold text-bf-green-primary tracking-widest uppercase"
        :class="{
          'text-[10px]': size === 'sm',
          'text-xs': size === 'md' || !size,
          'text-sm': size === 'lg'
        }"
      >
        Fair Play
      </span>
    </div>
  </div>
</template>
