<script setup lang="ts">
import { computed } from 'vue';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
    variant?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
    message: string;
    closable?: boolean;
}>(), { variant: 'info', closable: true });

const emit = defineEmits<{ close: [] }>();

const config = computed(() => ({
    error:   { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-red-200',    iconCls: 'text-[var(--destructive)]',      msgCls: 'text-red-700'    },
    success: { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200',  iconCls: 'text-[var(--bf-green-primary)]', msgCls: 'text-green-700'  },
    info:    { icon: Info,          bg: 'bg-blue-50',   border: 'border-blue-200',   iconCls: 'text-[var(--bf-blue-primary)]',  msgCls: 'text-blue-700'   },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', iconCls: 'text-[var(--warning)]',          msgCls: 'text-yellow-700' },
}[props.variant]));
</script>

<template>
    <div
        role="alert"
        aria-live="polite"
        :class="['relative flex items-start gap-3 p-4 rounded-xl border-2', config.bg, config.border]"
    >
        <component :is="config.icon" :class="['w-5 h-5 mt-0.5 flex-shrink-0', config.iconCls]" />
        <div class="flex-1 min-w-0">
            <p v-if="title" :class="['mb-1 font-semibold text-sm', config.iconCls]">{{ title }}</p>
            <p :class="['text-sm', config.msgCls]">{{ message }}</p>
        </div>
        <button
            v-if="closable"
            @click="emit('close')"
            :class="['flex-shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/50 transition-all', config.iconCls]"
            aria-label="Fechar alerta"
        >
            <X class="w-4 h-4" />
        </button>
    </div>
</template>
