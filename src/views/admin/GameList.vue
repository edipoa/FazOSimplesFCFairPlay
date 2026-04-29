<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/axios';
import { Calendar, Clock, Users, ChevronRight, AlertCircle, Loader2 } from 'lucide-vue-next';

interface Game {
  id?: string;
  _id?: string;
  date: string;
  time: string;
  status: 'open' | 'confirmed' | 'closed' | 'canceled';
  confirmedCount: number;
}

const games = ref<Game[]>([]);
const loading = ref(true);
const error = ref('');
const router = useRouter();
const authStore = useAuthStore();

const fetchGames = async () => {
  loading.value = true;
  try {
    const response = await api.get('/games');
    // API returns { success: true, data: [...] }
    const gamesData = response.data.data || response.data;
    // Filter for open or confirmed games
    games.value = gamesData.filter((g: Game) => 
      g.status === 'open' || g.status === 'confirmed'
    );
  } catch (err: any) {
    error.value = 'Erro ao buscar jogos. Tente novamente mais tarde.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const goToBuilder = (game: Game) => {
  const gameId = game.id || game._id;
  if (!gameId) {
    console.error('Game ID not found:', game);
    return;
  }
  const workspaceId = authStore.currentWorkspaceId;
  router.push({ name: 'admin-team-builder', params: { workspaceId, id: gameId } });
};

// Format date to e.g., "Sábado, 20 de Outubro"
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const parts = formatter.formatToParts(date);
  
  let result = '';
  // Capitalize first letter of weekday and month
  for (const part of parts) {
    if (part.type === 'weekday' || part.type === 'month') {
      result += part.value.charAt(0).toUpperCase() + part.value.slice(1);
    } else {
      result += part.value;
    }
  }
  return result;
};

// Short format e.g., "20/10/2026"
const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const sortedGames = computed(() => {
  // Sort games by date ascending
  return [...games.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

onMounted(() => {

  fetchGames();
});
</script>

<template>
  <!-- Main container with dark theme integration and smooth entry animation -->
  <div class="min-h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 p-4 md:p-8 transition-colors duration-300">
    <div class="max-w-5xl mx-auto space-y-8 animate-in mt-4">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            Gestão de Jogos
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-2 text-sm md:text-base">
            Selecione um jogo para organizar os times e gerenciar jogadores.
          </p>
        </div>

      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-sm shadow-xl">
        <Loader2 class="w-10 h-10 text-brand-light animate-spin" style="color: #A37EF5;" />
        <p class="mt-4 text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Carregando jogos disponíveis...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-16 px-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 rounded-2xl shadow-xl backdrop-blur-sm transition-all">
        <AlertCircle class="w-12 h-12 text-red-500 mb-3 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">Não foi possível carregar os jogos</h3>
        <p class="text-red-600 dark:text-red-400/80 mt-1 mb-6 text-center max-w-md">{{ error }}</p>
        <button @click="fetchGames" class="px-5 py-2.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-800 dark:text-red-100 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800/50 shadow-sm hover:shadow-md cursor-pointer">
          Tentar Novamente
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="sortedGames.length === 0" class="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/50 border-dashed rounded-2xl backdrop-blur-sm">
        <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Calendar class="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 class="text-lg font-medium text-neutral-700 dark:text-neutral-300">Nenhum Jogo Ativo</h3>
        <p class="text-neutral-500 mt-1 max-w-sm text-center text-sm md:text-base">
          Não existem jogos abertos ou confirmados no momento.
        </p>
      </div>

      <!-- Games List -->
      <div v-else class="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="(game, index) in sortedGames" 
          :key="game.id || game._id" 
          @click="goToBuilder(game)"
          class="group relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-200 dark:border-neutral-800/80 p-5 md:p-6 cursor-pointer hover:border-[rgba(0,214,111,0.5)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,214,111,0.15)] hover:-translate-y-1 overflow-hidden"
          :style="{ animationDelay: `${index * 80}ms` }"
        >
          <!-- Background decorative gradient -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-[rgba(0,214,111,0.1)] dark:bg-[rgba(0,214,111,0.15)] rounded-full blur-3xl group-hover:bg-[rgba(0,214,111,0.2)] dark:group-hover:bg-[rgba(0,214,111,0.25)] transition-colors duration-500 pointer-events-none"></div>

          <!-- Card Header (Status Badge & Icon) -->
          <div class="flex justify-between items-start mb-5 relative z-10">
            <span :class="[
                'px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider flex items-center shadow-sm uppercase',
                game.status === 'confirmed' 
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 border dark:border-emerald-500/20' 
                  : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 border dark:border-blue-500/20'
            ]">
              <span class="w-1.5 h-1.5 rounded-full mr-2" :class="game.status === 'confirmed' ? 'bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-blue-500 dark:bg-blue-400 dark:shadow-[0_0_8px_rgba(96,165,250,0.8)]'"></span>
              {{ game.status === 'confirmed' ? 'Confirmado' : 'Aberto' }}
            </span>
            
            <div class="text-neutral-400 dark:text-neutral-500 group-hover:text-[#4DFFB3] transition-colors bg-neutral-100/50 dark:bg-neutral-800/50 p-1.5 rounded-full">
              <ChevronRight class="w-4 h-4" />
            </div>
          </div>
          
          <!-- Card Content (Date, Time, Players) -->
          <div class="space-y-4 mt-2 relative z-10">
            <div>
              <h3 class="text-xl font-bold text-neutral-800 dark:text-white tracking-tight">{{ formatDate(game.date).split(',')[0] }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{{ formatShortDate(game.date) }}</p>
            </div>

            <div class="flex flex-col gap-3 pt-5 mt-4 border-t border-neutral-100 dark:border-neutral-800/80">
              <div class="flex items-center text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                <div class="w-9 h-9 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 flex items-center justify-center mr-3.5 border border-neutral-200/50 dark:border-neutral-700/50 group-hover:border-[rgba(0,214,111,0.3)] group-hover:bg-[rgba(0,214,111,0.1)] transition-colors">
                  <Clock class="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400 group-hover:text-[#4DFFB3] transition-colors" />
                </div>
                <span class="font-medium tracking-wide text-md">{{ game.time }}</span>
              </div>
              
              <div class="flex items-center text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                <div class="w-9 h-9 rounded-lg bg-neutral-100/80 dark:bg-neutral-800/80 flex items-center justify-center mr-3.5 border border-neutral-200/50 dark:border-neutral-700/50 group-hover:border-[rgba(0,214,111,0.3)] group-hover:bg-[rgba(0,214,111,0.1)] transition-colors">
                  <Users class="w-4.5 h-4.5 text-neutral-500 dark:text-neutral-400 group-hover:text-[#4DFFB3] transition-colors" />
                </div>
                <span class="font-medium tracking-wide">
                  <span :class="game.confirmedCount > 0 ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-400 dark:text-neutral-500'">{{ game.confirmedCount }}</span>
                  <span class="text-neutral-600 dark:text-neutral-400 font-medium ml-1.5">confirmados</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Action Area (Visible on Hover) -->
          <div class="mt-6 w-full bg-[rgba(0,214,111,0.1)] dark:bg-[rgba(0,214,111,0.15)] text-[var(--bf-blue-primary)] dark:text-[var(--bf-green-light)] py-3 px-4 rounded-xl text-center text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 border border-[rgba(0,214,111,0.2)] dark:border-[rgba(0,214,111,0.3)] flex items-center justify-center shadow-[0_0_15px_rgba(0,214,111,0.05)] dark:shadow-[0_0_15px_rgba(0,214,111,0.1)]">
              Gerenciar Times
              <ChevronRight class="w-4 h-4 ml-1.5 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations that align with ui-ux-pro-max and frontend-ui-dark-ts */
.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(12px); }
  to { transform: translateY(0); }
}

/* Base custom font stack if available like Segoe UI/Inter per guideline */
.font-sans {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
</style>

