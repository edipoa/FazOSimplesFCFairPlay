<script setup lang="ts">
import logoImg from '../assets/logo.png';
import logoImgDark from '../assets/white-logo.png';

withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  layout?: 'vertical' | 'horizontal';
}>(), {
  layout: 'vertical'
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
      'flex-row gap-3': layout === 'horizontal'
    }"
  >
    <div class="relative flex items-center justify-center">
      <!-- Light Mode Image -->
      <img 
        :src="logoImg" 
        alt="Faz o Simples FC Logo" 
        class="object-contain transition-all duration-300 dark:hidden"
        :class="{
          'h-24 w-16': size === 'sm',
          'h-24 w-24': size === 'md' || !size,
          'h-32 w-32': size === 'lg'
        }"
        @error="handleImageError"
      />
      <!-- Dark Mode Image -->
      <img 
        :src="logoImgDark" 
        alt="Faz o Simples FC Logo Dark" 
        class="object-contain transition-all duration-300 hidden dark:block"
        :class="{
          'h-12 w-12': size === 'sm',
          'h-24 w-24': size === 'md' || !size,
          'h-32 w-32': size === 'lg'
        }"
        @error="handleImageError"
      />
    </div>
    
    <div 
      class=""
      :class="{
        'text-center mt-2': layout === 'vertical',
        'text-left': layout === 'horizontal'
      }"
    >
      <h1 
        class="font-bold text-bf-navy dark:text-white leading-tight"
        :class="{
          'text-lg': size === 'sm',
          'text-2xl': size === 'md' || !size,
          'text-3xl': size === 'lg'
        }"
      >
        Faz o Simples FC
      </h1>
      <span 
        v-if="showSubtitle"
        class="block font-medium text-gold-500 tracking-wider uppercase"
        :class="{
          'text-xs': size === 'sm',
          'text-sm': size === 'md' || !size,
          'text-base': size === 'lg'
        }"
      >
        Fair Play
      </span>
    </div>
  </div>
</template>

<style scoped>
.text-gold-500 {
  color: #c5a059; /* Approximate gold color from the requested style */
}
</style>
