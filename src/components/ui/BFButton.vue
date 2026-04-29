<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

withDefaults(defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    disabled?: boolean;
}>(), {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    loading: false,
    disabled: false,
});

const variantClasses: Record<string, string> = {
    primary: 'bg-[var(--bf-green-primary)] hover:bg-[var(--bf-green-dark)] text-white shadow-sm',
    secondary: 'bg-[var(--bf-blue-primary)] hover:bg-[var(--bf-blue-dark)] text-white shadow-sm',
    outline: 'border-2 border-[var(--bf-blue-primary)] text-[var(--bf-blue-primary)] bg-transparent hover:bg-[var(--bf-blue-primary)]/10',
    ghost: 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
    danger: 'bg-[var(--destructive)] hover:bg-[var(--destructive)]/80 text-white shadow-sm',
};

const sizeClasses: Record<string, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
};
</script>

<template>
    <button
        :class="[
            'inline-flex items-center justify-center rounded-lg font-medium',
            'transition-all duration-200 cursor-pointer active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            variantClasses[variant],
            sizeClasses[size],
            fullWidth && 'w-full',
        ]"
        :disabled="disabled || loading"
        :aria-busy="loading"
    >
        <Loader2 v-if="loading" class="animate-spin h-4 w-4 flex-shrink-0 mr-2" />
        <span :class="loading ? 'opacity-50' : ''"><slot /></span>
    </button>
</template>
