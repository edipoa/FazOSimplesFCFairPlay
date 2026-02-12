<script setup lang="ts">
import { useAuthStore } from '../stores/auth.store';
import { LogOut } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <button 
    @click="handleLogout" 
    class="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
    title="Sair"
  >
    <LogOut class="w-5 h-5" />
    <span class="hidden sm:inline">Sair</span>
  </button>
</template>
