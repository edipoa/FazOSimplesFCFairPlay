<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Loader2 } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
    modelValue: string;
    length?: number;
    loading?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    error?: string;
}>(), { length: 6, loading: false, disabled: false, autoFocus: false });

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const focused = ref<number | null>(null);
const inputRefs = ref<HTMLInputElement[]>([]);

const len = computed(() => props.length ?? 6);

const digits = computed(() =>
    props.modelValue.padEnd(len.value, ' ').slice(0, len.value).split('')
);

const handleInput = (index: number, e: Event) => {
    const raw = (e.target as HTMLInputElement).value;
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (raw && !digit) {
        (e.target as HTMLInputElement).value = digits.value[index]?.trim() ?? '';
        return;
    }
    const next = [...digits.value];
    next[index] = digit || ' ';
    emit('update:modelValue', next.join('').trimEnd());
    if (digit && index < len.value - 1) {
        nextTick(() => inputRefs.value[index + 1]?.focus());
    }
};

const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !(digits.value[index]?.trim()) && index > 0) {
        inputRefs.value[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); inputRefs.value[index - 1]?.focus(); }
    if (e.key === 'ArrowRight' && index < props.length - 1) { e.preventDefault(); inputRefs.value[index + 1]?.focus(); }
};

const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const numbers = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, props.length);
    if (numbers) {
        emit('update:modelValue', numbers);
        nextTick(() => inputRefs.value[Math.min(numbers.length, len.value - 1)]?.focus());
    }
};

watch(() => props.autoFocus, (val) => {
    if (val) nextTick(() => inputRefs.value[0]?.focus());
}, { immediate: true });
</script>

<template>
    <div class="w-full">
        <label class="block mb-3 text-sm font-medium text-[var(--foreground)]">
            Código de verificação
        </label>
        <div class="flex items-center justify-center gap-2 sm:gap-3">
            <input
                v-for="(digit, index) in digits"
                :key="index"
                :ref="(el) => { if (el) inputRefs[index] = el as HTMLInputElement }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                :value="digit.trim()"
                :disabled="disabled || loading"
                :class="[
                    'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold',
                    'bg-white border-2 rounded-xl transition-all duration-200 outline-none focus-visible:shadow-none',
                    focused === index && !error
                        ? 'border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10 scale-105'
                        : '',
                    error ? 'border-[var(--destructive)]' : '',
                    digit.trim() && focused !== index && !error
                        ? 'border-[var(--primary)]'
                        : '',
                    !digit.trim() && focused !== index && !error
                        ? 'border-[var(--border)]'
                        : '',
                    (disabled || loading)
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : 'hover:border-[var(--primary)]/50',
                ]"
                @input="handleInput(index, $event)"
                @keydown="handleKeyDown(index, $event)"
                @paste="handlePaste"
                @focus="focused = index"
                @blur="focused = null"
                :aria-label="`Dígito ${index + 1} de ${length}`"
            />
            <Loader2 v-if="loading" class="w-5 h-5 ml-2 text-[var(--primary)] animate-spin" />
        </div>
        <p v-if="error" class="mt-3 text-sm text-[var(--destructive)] text-center flex items-center justify-center gap-1">
            <span class="inline-block w-1 h-1 rounded-full bg-[var(--destructive)]" />
            {{ error }}
        </p>
        <p v-else-if="!loading" class="mt-3 text-xs text-[var(--muted-foreground)] text-center">
            Digite o código de 6 dígitos enviado para seu telefone
        </p>
    </div>
</template>
