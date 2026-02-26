<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import api from '../api/axios';
import { fetchUserRatings, type RatingHistoryItem } from '../api/rating.service';
import StarRating from '../components/StarRating.vue';
import ToastNotification from '../components/ui/ToastNotification.vue';
import { Loader2 } from 'lucide-vue-next';

interface RateablePlayer {
  id: string;
  name: string;
  position: string;
  currentRating?: number; // Visual feedback if already rated
}

const players = ref<RateablePlayer[]>([]);
const loading = ref(true);
const isLoadingHistory = ref(true);
const error = ref('');

// Batch Submission State
const pendingRatings = ref<Record<string, number>>({});
const isSubmitting = ref(false);

// Toast State
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
});

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  toast.value = { show: true, message, type };
};

const initData = async () => {
  loading.value = true;
  isLoadingHistory.value = true;
  try {
    const [playersResponse, historyData] = await Promise.all([
        api.get('/players/rateable'),
        fetchUserRatings().catch(err => {
            console.error('Failed to fetch history', err);
            return [];
        })
    ]);

    // Create a map for quick history lookup
    const historyMap = new Map<string, number>();
    historyData.forEach((item: RatingHistoryItem) => {
        historyMap.set(item.ratedId, item.score);
    });

    // Map players and merge with history
    players.value = playersResponse.data.map((p: any) => ({
      ...p,
      currentRating: historyMap.get(p.id) || (p.workspaceRating ?? 3.0)
    }));

  } catch (err: any) {
    error.value = 'Erro ao buscar dados.';
    console.error(err);
  } finally {
    loading.value = false;
    isLoadingHistory.value = false;
  }
};

const handleRatingChange = (playerId: string, rating: number) => {
  console.log('Adding to batch (NOT SENDING to server):', playerId, rating);
  pendingRatings.value[playerId] = rating;
  
  // Update visual state immediately
  const player = players.value.find(p => p.id === playerId);
  if (player) {
    player.currentRating = rating;
  }
};

const hasUnsavedChanges = computed(() => Object.keys(pendingRatings.value).length > 0);

const submitRatings = async () => {
  if (Object.keys(pendingRatings.value).length === 0) return;
  
  isSubmitting.value = true;
  try {
    const promises = Object.entries(pendingRatings.value).map(([targetUserId, score]) => {
      return api.post('/ratings', { targetUserId, score });
    });

    await Promise.all(promises);

    showToast('Avaliações enviadas com sucesso!', 'success');
    pendingRatings.value = {}; // Clear object

  } catch (err) {
    console.error('Failed to submit ratings', err);
    showToast('Erro ao enviar algumas avaliações. Tente novamente.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  console.log('RateTeammates mounted - Batch Mode Active (Object Ref)');
  initData();
});

// Warn before leaving if unsaved changes
onBeforeRouteLeave((_to, _from, next) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('Você tem avaliações não salvas. Deseja sair sem salvar?');
    if (answer) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 space-y-6 pb-24 animate-in fade-in duration-500 transition-colors"> <!-- Added pb-24 for fixed bottom bar space -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Avaliar Companheiros</h2>
      <p class="text-neutral-500 dark:text-neutral-400 mt-1">Ajude a equilibrar os times avaliando seus colegas.</p>
    </div>

    <div v-if="loading || isLoadingHistory" class="text-center py-10 bg-white/60 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm backdrop-blur-md">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto"></div>
      <p class="mt-4 text-neutral-500 dark:text-neutral-400 font-medium">Carregando jogadores...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl font-medium backdrop-blur-sm shadow-sm transition-all">
      {{ error }}
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div 
        v-for="player in players" 
        :key="player.id" 
        class="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-200 dark:border-neutral-800/80 p-5 flex flex-col items-center space-y-4 hover:border-[rgba(130,81,238,0.5)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(130,81,238,0.1)] group"
        :class="{ 'ring-1 ring-[rgba(130,81,238,0.5)] border-[rgba(130,81,238,0.5)] bg-[rgba(130,81,238,0.05)] dark:bg-[rgba(130,81,238,0.1)]': pendingRatings[player.id] !== undefined }"
      >
        <div class="h-14 w-14 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand dark:text-brand-light font-bold text-xl shadow-inner group-hover:bg-brand/20 dark:group-hover:bg-brand/30 transition-colors">
          {{ player.name.charAt(0).toUpperCase() }}
        </div>
        <div class="text-center">
            <h3 class="font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">{{ player.name }}</h3>
            <p class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 uppercase tracking-wider">{{ player.position }}</p>
        </div>
        
        <StarRating 
          :model-value="player.currentRating || 0" 
          @update:model-value="(val) => handleRatingChange(player.id, val)"
          class="drop-shadow-sm"
        />
      </div>
    </div>
    
    <div v-if="!loading && players.length === 0" class="text-center text-neutral-500 dark:text-neutral-400 py-10 bg-white/60 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm backdrop-blur-md">
        Nenhum jogador disponível para avaliação no momento.
    </div>

    <!-- Sticky Bottom Action Bar -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div v-if="hasUnsavedChanges" class="fixed bottom-0 left-0 right-0 glass-header border-t border-neutral-200/50 dark:border-neutral-800/50 p-4 z-40 backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 transition-colors">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <span class="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
             {{ Object.keys(pendingRatings).length }} {{ Object.keys(pendingRatings).length === 1 ? 'avaliação pendente' : 'avaliações pendentes' }}
          </span>
          <button 
            @click="submitRatings"
            :disabled="isSubmitting"
            class="inline-flex items-center cursor-pointer px-6 py-2.5 rounded-xl shadow-[0_4px_14px_0_rgba(130,81,238,0.39)] text-sm font-semibold text-white bg-[rgba(130,81,238,1)] hover:bg-[rgba(110,61,218,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(130,81,238,0.5)] dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
          >
            <Loader2 v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ isSubmitting ? 'Enviando...' : 'Submeter Votos' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Toast Component -->
    <ToastNotification 
      :show="toast.show" 
      :message="toast.message" 
      :type="toast.type" 
      @close="toast.show = false" 
    />
  </div>
</template>
