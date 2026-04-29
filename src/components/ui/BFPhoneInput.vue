<script setup lang="ts">
import { ref } from 'vue';
import { Phone } from 'lucide-vue-next';

const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
    autoFocus?: boolean;
    error?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const focused = ref(false);

const formatPhone = (input: string): string => {
    const n = input.replace(/\D/g, '').slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

const handleInput = (e: Event) => {
    emit('update:modelValue', formatPhone((e.target as HTMLInputElement).value));
};
</script>

<template>
    <div class="w-full">
        <label class="block mb-2 text-sm font-medium text-[var(--foreground)]">
            Número de telefone
        </label>
        <div
            :class="[
                'relative flex items-center gap-3 px-4 h-14',
                'bg-white border-2 rounded-xl transition-all duration-200',
                focused && !error ? 'border-[var(--bf-blue-primary)] shadow-lg shadow-blue-500/10' : '',
                error ? 'border-[var(--destructive)]' : (!focused ? 'border-[var(--border)]' : ''),
                disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
            ]"
        >
            <Phone
                :class="[
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    focused && !error ? 'text-[var(--bf-blue-primary)]' : 'text-[var(--muted-foreground)]',
                    error ? 'text-[var(--destructive)]' : '',
                ]"
            />
            <input
                type="tel"
                :value="modelValue"
                :disabled="disabled"
                :autofocus="autoFocus"
                placeholder="(00) 00000-0000"
                @input="handleInput"
                @focus="focused = true"
                @blur="focused = false"
                class="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                :class="disabled ? 'cursor-not-allowed' : ''"
            />
        </div>
        <p v-if="error" class="mt-2 text-sm text-[var(--destructive)] flex items-center gap-1">
            <span class="inline-block w-1 h-1 rounded-full bg-[var(--destructive)]" />
            {{ error }}
        </p>
        <p v-else class="mt-2 text-xs text-[var(--muted-foreground)]">
            Digite seu número com DDD
        </p>
    </div>
</template>
