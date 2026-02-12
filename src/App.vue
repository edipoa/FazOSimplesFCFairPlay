<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from './stores/auth.store';
import LogoutButton from './components/LogoutButton.vue';
import BrandLogo from './components/BrandLogo.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.checkAuth();
});
</script>

<template>
  <div class="min-h-screen bg-background font-sans text-foreground">
    <header v-if="authStore.isAuthenticated" class="bg-card shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center py-2">
              <BrandLogo size="sm" :show-subtitle="true" layout="horizontal" />
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <RouterLink 
                to="/profile" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-indigo-500 text-gray-900"
              >
                Perfil
              </RouterLink>
              <RouterLink 
                to="/rate" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-indigo-500 text-gray-900"
              >
                Avaliar
              </RouterLink>
              <RouterLink 
                v-if="authStore.isAdmin"
                to="/admin/games" 
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="border-indigo-500 text-gray-900"
              >
                Admin
              </RouterLink>
            </div>
          </div>
          <div class="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </div>
      
      <!-- Mobile menu (simplified) -->
      <div class="sm:hidden border-t border-gray-200">
        <div class="flex justify-around p-2">
           <RouterLink 
                to="/profile" 
                class="px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-50 text-indigo-700"
                :class="[$route.path !== '/profile' ? 'text-gray-500 hover:text-gray-700' : '']"
              >
                Perfil
            </RouterLink>
            <RouterLink 
                to="/rate" 
                class="px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-50 text-indigo-700"
                :class="[$route.path !== '/rate' ? 'text-gray-500 hover:text-gray-700' : '']"
              >
                Avaliar
            </RouterLink>
            <RouterLink 
                v-if="authStore.isAdmin"
                to="/admin/games" 
                class="px-3 py-2 rounded-md text-sm font-medium"
                active-class="bg-indigo-50 text-indigo-700"
                :class="[$route.path.startsWith('/admin') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700']"
              >
                Admin
            </RouterLink>
        </div>
      </div>
    </header>

    <main class="py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>
