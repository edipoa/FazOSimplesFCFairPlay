<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import { ShieldX } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const goToMyWorkspace = () => {
    const firstWorkspace = authStore.user?.workspaces?.[0];
    if (firstWorkspace) {
        router.push({ name: 'profile', params: { workspaceId: firstWorkspace.id } });
    } else {
        router.push({ name: 'login' });
    }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <ShieldX class="w-16 h-16 text-red-400 mb-6" />
    <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Acesso não autorizado</h1>
    <p class="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm">
      Você não tem permissão para acessar este grupo. Verifique se o link está correto.
    </p>
    <button
      @click="goToMyWorkspace"
      class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
    >
      Ir para meu grupo
    </button>
  </div>
</template>
