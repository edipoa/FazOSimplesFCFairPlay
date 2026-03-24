<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { ChevronDown, Building2, Check } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const handleWorkspaceChange = (workspaceId: string) => {
    isOpen.value = false;
    if (workspaceId === authStore.currentWorkspaceId) return;

    // setWorkspace updates the store + workspaceContext + clears workspace-scoped data
    authStore.setWorkspace(workspaceId);

    // Navigate to the new workspace's profile page.
    // RouterView key="$route.params.workspaceId" in App.vue will force
    // a full component remount, so all onMounted data-fetching fires fresh.
    router.push({ name: 'profile', params: { workspaceId } });
};

const closeDropdown = (e: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown);
});
</script>

<template>
  <div v-if="authStore.isAuthenticated && authStore.user?.workspaces?.length > 1" class="flex items-center" ref="dropdownRef">
    <div class="relative group">
      <button
        @click="toggleDropdown"
        class="flex items-center justify-between w-full min-w-[100px] sm:min-w-[140px] max-w-[120px] sm:max-w-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg px-2 sm:px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all shadow-sm"
      >
        <span class="truncate pr-1 sm:pr-2">{{ authStore.currentWorkspace?.name || 'Selecione um grupo' }}</span>
        <ChevronDown class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </button>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="isOpen" class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div class="py-1">
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
               Seus Grupos
            </div>
            <button
              v-for="workspace in authStore.user.workspaces"
              :key="workspace.id"
              @click="handleWorkspaceChange(workspace.id)"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between transition-colors duration-150"
              :class="{ 'bg-indigo-50/50 text-indigo-700 font-medium': workspace.id === authStore.currentWorkspaceId, 'text-gray-700': workspace.id !== authStore.currentWorkspaceId }"
            >
              <div class="flex items-center space-x-2 truncate">
                <Building2 class="h-4 w-4 text-gray-400 flex-shrink-0" :class="{'text-indigo-500': workspace.id === authStore.currentWorkspaceId}" />
                <span class="truncate">{{ workspace.name }}</span>
              </div>
              <Check v-if="workspace.id === authStore.currentWorkspaceId" class="h-4 w-4 text-indigo-600 flex-shrink-0" />
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
