<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
import LogoutButton from './components/LogoutButton.vue';
import BrandLogo from './components/BrandLogo.vue';
import WorkspaceSelector from './components/WorkspaceSelector.vue';
import { Sun, Moon } from 'lucide-vue-next';

const authStore = useAuthStore();
const themeStore = useThemeStore();

// Typed nav helpers so templates stay clean
const profileRoute = computed(() => ({
    name: 'profile',
    params: { workspaceId: authStore.currentWorkspaceId ?? '' },
}));
const rateRoute = computed(() => ({
    name: 'rate',
    params: { workspaceId: authStore.currentWorkspaceId ?? '' },
}));
const adminGamesRoute = computed(() => ({
    name: 'admin-games',
    params: { workspaceId: authStore.currentWorkspaceId ?? '' },
}));

onMounted(() => {
    authStore.checkAuth();
    themeStore.initTheme();
});
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-50 flex flex-col relative selection:bg-[rgba(0,214,111,0.2)] selection:text-[var(--bf-blue-primary)] transition-colors duration-300">

    <!-- Premium Glass Header -->
    <header v-if="authStore.isAuthenticated" class="sticky top-0 z-50 w-full bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/80 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center">
            <div class="flex-shrink-0 flex items-center py-2 mr-4">
              <BrandLogo size="sm" :show-subtitle="true" layout="horizontal" />
            </div>
            <!-- Desktop Nav -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-2">
              <RouterLink
                :to="profileRoute"
                class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
              >
                Perfil
              </RouterLink>
              <RouterLink
                :to="rateRoute"
                class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
              >
                Avaliar
              </RouterLink>
              <RouterLink
                v-if="authStore.isAdmin"
                :to="adminGamesRoute"
                class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
              >
                Admin
              </RouterLink>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <WorkspaceSelector class="hidden sm:block" />

            <!-- Global Theme Toggle Button -->
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-600 dark:text-neutral-300 cursor-pointer"
              aria-label="Toggle Theme"
            >
              <Sun v-if="themeStore.isDark" class="w-4 h-4" />
              <Moon v-else class="w-4 h-4" />
            </button>

            <LogoutButton />
          </div>
        </div>
      </div>

      <!-- Mobile menu (simplified) -->
      <div class="sm:hidden border-t border-neutral-200/50 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-lg">
        <div class="flex justify-around p-2">
          <RouterLink
            :to="profileRoute"
            class="px-3 py-2 rounded-md text-sm font-medium transition-all text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
          >
            Perfil
          </RouterLink>
          <RouterLink
            :to="rateRoute"
            class="px-3 py-2 rounded-md text-sm font-medium transition-all text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
          >
            Avaliar
          </RouterLink>
          <RouterLink
            v-if="authStore.isAdmin"
            :to="adminGamesRoute"
            class="px-3 py-2 rounded-md text-sm font-medium transition-all text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            active-class="bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light"
          >
            Admin
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <!-- key="workspaceId" forces a full remount on tenant switch, ensuring all
         onMounted data-fetching in views fires fresh for the new workspace. -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col">
      <RouterView :key="$route.params.workspaceId as string" />
    </main>
  </div>
</template>
