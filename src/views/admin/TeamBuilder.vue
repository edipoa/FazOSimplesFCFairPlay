<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../api/axios';
import draggable from 'vuedraggable';
import { RefreshCw, Copy, Star, Save, AlertCircle, CheckCircle, AlertTriangle, User, Loader2 } from 'lucide-vue-next';

const route = useRoute();
const gameId = route.params.id as string;

interface Player {
  id: string;
  name: string;
  position: string;
  workspaceRating: number;
}

interface TeamStats {
  averageRating: number;
  totalPlayers: number;
}

const teamA = ref<Player[]>([]);
const teamB = ref<Player[]>([]);
const unassigned = ref<Player[]>([]);
const loading = ref(true);
const generating = ref(false);
const saving = ref(false);
const error = ref('');
const hasUnsavedChanges = ref(false);
const lastSaved = ref<Date | null>(null);
const showSuccessModal = ref(false);
const showConfirmModal = ref(false);
const showCopyModal = ref(false);

const nowTick = ref(Date.now());
const tickInterval = setInterval(() => { nowTick.value = Date.now(); }, 30_000);
onUnmounted(() => clearInterval(tickInterval));

// Computation for stats
const calculateStats = (players: Player[]): TeamStats => {
  if (players.length === 0) return { averageRating: 0, totalPlayers: 0 };
  const totalRating = players.reduce((sum, p) => sum + (p.workspaceRating || 0), 0);
  return {
    averageRating: totalRating / players.length,
    totalPlayers: players.length
  };
};

const statsA = computed(() => calculateStats(teamA.value));
const statsB = computed(() => calculateStats(teamB.value));

watch([teamA, teamB, unassigned], () => {
  hasUnsavedChanges.value = true;
}, { deep: true });

// Map player from API response
const mapPlayer = (p: any): Player => {
  const id = p.rosterId || p._id || p.id;
  if (!id) {
    console.warn('Player missing ID:', p);
  }
  return {
    id: id || '',
    name: p.name || 'Desconhecido',
    position: p.profile?.mainPosition || p.position || 'N/A',
    workspaceRating: p.profile?.rating ?? p.workspaceRating ?? 3.0
  };
};

// Load game data and check for saved teams
const loadGameData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get(`/games/${gameId}`);
    const gameData = response.data.data || response.data;
    
    // Check if players have team assignments
    const players = gameData.players || gameData.roster || [];
    const hasTeamAssignments = players.some((p: any) => p.team);
    
    console.log('[TeamBuilder] players:', players);
    console.log('[TeamBuilder] hasTeamAssignments:', hasTeamAssignments);
      await generateTeams();

    if (hasTeamAssignments) {
      // Distribute players based on saved team assignments
      const playersA = players.filter((p: any) => p.team === 'A').map(mapPlayer);
      const playersB = players.filter((p: any) => p.team === 'B').map(mapPlayer);
      const playersUnassigned = players.filter((p: any) => !p.team || (p.team !== 'A' && p.team !== 'B')).map(mapPlayer);
      
      teamA.value = playersA;
      teamB.value = playersB;
      unassigned.value = playersUnassigned;
      hasUnsavedChanges.value = false;
      lastSaved.value = new Date(gameData.updatedAt || gameData.createdAt);
    } else {
      // No saved teams, generate new ones
    }
  } catch (err: any) {
    error.value = 'Erro ao carregar dados do jogo.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Generate teams using AI suggestion
const generateTeams = async () => {
  generating.value = true;
  error.value = '';
  try {
    const response = await api.post(`/games/${gameId}/teams/generate`);
    const teamsData = response.data.data || response.data;
    
    teamA.value = (teamsData.teamA || []).map(mapPlayer);
    teamB.value = (teamsData.teamB || []).map(mapPlayer);
    
    unassigned.value = (teamsData.unassigned || []).map(mapPlayer);
    hasUnsavedChanges.value = true;
  } catch (err: any) {
    error.value = 'Erro ao gerar times. Tente novamente.';
    console.error(err);
  } finally {
    generating.value = false;
  }
};

// Regenerate teams with confirmation
const handleRegenerateClick = () => {
  if (hasUnsavedChanges.value) {
    showConfirmModal.value = true;
  } else {
    generateTeams();
  }
};

const confirmRegenerate = async () => {
  showConfirmModal.value = false;
  await generateTeams();
};

// Save team assignments
const saveTeams = async () => {
  saving.value = true;
  error.value = '';
  try {
    // Build assignments payload
    const assignments = [
      ...teamA.value.map(p => ({ rosterId: p.id, team: 'A' as const })),
      ...teamB.value.map(p => ({ rosterId: p.id, team: 'B' as const })),
      ...unassigned.value.map(p => ({ rosterId: p.id, team: null }))
    ];

    // Validate IDs
    const invalidAssignments = assignments.filter(a => !a.rosterId);
    if (invalidAssignments.length > 0) {
      console.error('Invalid assignments:', invalidAssignments);
      alert('Erro: Alguns jogadores estão sem ID. Recarregue a página e tente novamente.');
      return;
    }
    
    await api.put(`/games/${gameId}/teams`, { assignments });
    
    hasUnsavedChanges.value = false;
    lastSaved.value = new Date();
    nowTick.value = Date.now();

    showSuccessModal.value = true;
  } catch (err: any) {
    error.value = 'Erro ao salvar times. Tente novamente.';
    console.error(err);
  } finally {
    saving.value = false;
  }
};

const copyToWhatsapp = () => {
    let message = `*Times Sorteados - Faz o Simples FC - Fair Play* ⚽\n\n`;
    
    message += `*Time A* (Média: ${statsA.value.averageRating.toFixed(1)} ⭐)\n`;
    teamA.value.forEach((p, i) => message += `${i+1}. ${p.name} (${p.position})\n`);
    
    message += `\n*Time B* (Média: ${statsB.value.averageRating.toFixed(1)} ⭐)\n`;
    teamB.value.forEach((p, i) => message += `${i+1}. ${p.name} (${p.position})\n`);

    navigator.clipboard.writeText(message).then(() => {
        showCopyModal.value = true;
    }).catch(err => {
        console.error('Failed to copy', err);
    });
};

const formatLastSaved = computed(() => {
  if (!lastSaved.value) return '';
  const diff = nowTick.value - lastSaved.value.getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'Salvo agora';
  if (minutes === 1) return 'Salvo há 1 minuto';
  if (minutes < 60) return `Salvo há ${minutes} minutos`;

  const time = lastSaved.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Salvo às ${time}`;
});

onMounted(() => {
  loadGameData();
});
</script>

<template>
  <div class="transition-colors duration-300 relative z-10 w-full rounded-2xl md:p-4">
    <div class="max-w-6xl mx-auto space-y-6 animate-in mt-4">
      
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">Montagem de Times</h1>
          <div v-if="lastSaved" class="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {{ formatLastSaved }}
          </div>
          <div v-if="hasUnsavedChanges" class="flex items-center text-sm text-amber-600 dark:text-amber-400 mt-1.5 font-medium bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-md w-fit">
            <AlertCircle class="w-4 h-4 mr-1.5" />
            Alterações não salvas
          </div>
        </div>
        
        <div class="flex flex-wrap gap-3">
          <button 
            @click="saveTeams" 
            :disabled="saving || !hasUnsavedChanges"
            class="flex items-center px-4 py-2.5 rounded-lg transition-colors shadow-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            :class="hasUnsavedChanges
              ? 'bg-[#00D66F] hover:bg-[#00A854] text-white shadow-[rgba(0,214,111,0.35)]'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'"
          >
            <Save :class="['w-4 h-4 mr-2', saving ? 'animate-pulse' : '']" />
            {{ saving ? 'Salvando...' : 'Salvar Times' }}
          </button>
          
          <button 
            @click="handleRegenerateClick" 
            :disabled="generating || loading"
            class="flex items-center px-4 py-2.5 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors border border-neutral-300 dark:border-neutral-500 shadow-sm font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw :class="['w-4 h-4 mr-2', generating ? 'animate-spin' : '']" />
            {{ generating ? 'Gerando...' : 'Regerar' }}
          </button>
          
          <button 
            @click="copyToWhatsapp" 
            :disabled="teamA.length === 0 && teamB.length === 0"
            class="flex items-center px-4 py-2.5 bg-emerald-600 dark:bg-emerald-600/90 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm font-medium"
          >
            <Copy class="w-4 h-4 mr-2" />
            WhatsApp
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !generating" class="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-sm shadow-sm">
         <Loader2 class="w-10 h-10 text-brand-light animate-spin" style="color: #A37EF5;" />
         <p class="mt-4 text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Carregando times...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 px-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 rounded-2xl shadow-sm backdrop-blur-sm transition-all">
        <AlertCircle class="w-10 h-10 text-red-500 mb-3" />
        <p class="text-red-600 dark:text-red-400/80 mt-1 mb-4 text-center max-w-md">{{ error }}</p>
        <button @click="loadGameData" class="px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-800 dark:text-red-100 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800/50">Tentar Novamente</button>
      </div>

      <div v-else class="space-y-6 animate-in animation-delay-100">
        
        <!-- Unassigned Players Area -->
        <div v-if="unassigned.length > 0" class="bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-900/50 shadow-sm backdrop-blur-sm">
          <h2 class="font-bold text-lg text-amber-900 dark:text-amber-400 mb-4 flex items-center">
              <User class="w-5 h-5 mr-2" />
              Jogadores Aguardando Distribuição ({{ unassigned.length }})
          </h2>
          <draggable 
               v-model="unassigned" 
               group="players" 
               item-key="id"
               class="flex flex-wrap gap-3"
               ghost-class="ghost-player-base"
          >
               <template #item="{ element }">
                 <div class="bg-white dark:bg-neutral-800 p-2.5 rounded-xl shadow-sm border border-amber-100 dark:border-neutral-700 flex items-center space-x-2.5 cursor-move hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-md w-auto">
                     <div :class="['h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold', element.id ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500']">
                       <span v-if="element.id">{{ element.position.substring(0, 3) }}</span>
                       <User v-else class="w-3.5 h-3.5" />
                     </div>
                     <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">{{ element.name }}</span>
                     <div v-if="element.id" class="flex items-center space-x-1 text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 px-1.5 py-0.5 rounded-md border border-neutral-100 dark:border-neutral-700">
                       <span>{{ element.workspaceRating }}</span>
                       <Star class="w-2.5 h-2.5 text-amber-400 fill-current" />
                     </div>
                     <span v-else class="text-[10px] text-neutral-400 dark:text-neutral-500 flex bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">Convidado</span>
                 </div>
               </template>
          </draggable>
        </div>

        <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
        
        <!-- Team A Column -->
        <div class="bg-white/60 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col h-full shadow-sm overflow-hidden backdrop-blur-md">
          <div class="bg-gradient-to-r from-neutral-800 to-neutral-700 dark:from-neutral-800 dark:to-neutral-800/80 text-white p-4 flex justify-between items-center shadow-sm border-b border-neutral-900 dark:border-neutral-700">
              <h2 class="font-bold text-lg tracking-wide">Time A</h2>
              <div class="flex items-center space-x-2 bg-black/20 dark:bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                  <Star class="w-4 h-4 text-amber-400 fill-current" />
                  <span class="font-bold text-sm">{{ statsA.averageRating.toFixed(1) }} <span class="font-normal opacity-80 text-xs ml-1">Média</span></span>
              </div>
          </div>
          
          <div class="flex-1 min-h-[400px] p-4 bg-neutral-50/50 dark:bg-transparent">
             <draggable 
               v-model="teamA" 
               group="players" 
               item-key="id"
               class="space-y-3 h-full"
               ghost-class="ghost-player-a"
             >
               <template #item="{ element }">
                 <div class="bg-white dark:bg-neutral-800/80 p-3 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700/60 flex justify-between items-center cursor-move hover:border-brand-light dark:hover:border-[rgba(0,214,111,0.5)] hover:shadow-md transition-all group">
                   <div class="flex items-center space-x-3.5">
                     <div class="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-neutral-700 dark:text-white font-bold text-[11px] group-hover:bg-[rgba(0,214,111,0.15)] group-hover:text-[var(--bf-blue-primary)] dark:group-hover:bg-[rgba(0,214,111,0.25)] dark:group-hover:text-[#4DFFB3] transition-colors">
                       {{ element.position.substring(0, 3) }}
                     </div>
                     <div>
                         <p class="font-semibold text-neutral-800 dark:text-neutral-100 text-sm tracking-tight">{{ element.name }}</p>
                     </div>
                   </div>
                   
                   <div class="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <span class="font-medium">{{ element.workspaceRating }}</span>
                      <Star class="w-3 h-3 text-amber-400 fill-current" />
                   </div>
                 </div>
               </template>
             </draggable>
          </div>
          <div class="bg-neutral-100/50 dark:bg-neutral-900 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium border-t border-neutral-200 dark:border-neutral-800">
             {{ statsA.totalPlayers }} Jogadores confirmados
          </div>
        </div>

        <!-- Team B Column -->
        <div class="bg-white/60 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col h-full shadow-sm overflow-hidden backdrop-blur-md">
          <div class="bg-gradient-to-r from-emerald-700 to-emerald-600 dark:from-emerald-900/80 dark:to-emerald-800/60 text-white p-4 flex justify-between items-center shadow-sm border-b border-emerald-800 dark:border-emerald-700/50">
              <h2 class="font-bold text-lg tracking-wide">Time B</h2>
              <div class="flex items-center space-x-2 bg-black/20 dark:bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                  <Star class="w-4 h-4 text-amber-400 fill-current" />
                  <span class="font-bold text-sm">{{ statsB.averageRating.toFixed(1) }} <span class="font-normal opacity-80 text-xs ml-1">Média</span></span>
              </div>
          </div>
          
          <div class="flex-1 min-h-[400px] p-4 bg-emerald-50/30 dark:bg-transparent">
             <draggable 
               v-model="teamB" 
               group="players" 
               item-key="id"
               class="space-y-3 h-full"
               ghost-class="ghost-player-b"
             >
               <template #item="{ element }">
                 <div class="bg-white dark:bg-neutral-800/80 p-3 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700/60 flex justify-between items-center cursor-move hover:border-emerald-400/60 dark:hover:border-emerald-700/80 hover:shadow-md transition-all group">
                   <div class="flex items-center space-x-3.5">
                     <div class="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-neutral-700 dark:text-white font-bold text-[11px] group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/60 group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors">
                       {{ element.position.substring(0, 3) }}
                     </div>
                     <div>
                         <p class="font-semibold text-neutral-800 dark:text-neutral-100 text-sm tracking-tight">{{ element.name }}</p>
                     </div>
                   </div>
                   
                   <div class="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <span class="font-medium">{{ element.workspaceRating }}</span>
                      <Star class="w-3 h-3 text-amber-400 fill-current" />
                   </div>
                 </div>
               </template>
             </draggable>
          </div>
          <div class="bg-neutral-100/50 dark:bg-neutral-900 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium border-t border-neutral-200 dark:border-neutral-800">
             {{ statsB.totalPlayers }} Jogadores confirmados
          </div>
        </div>
        </div>

      </div>

      <!-- Success Modal -->
      <div 
        v-if="showSuccessModal" 
        @click="showSuccessModal = false"
        class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      >
        <div 
          @click.stop
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-emerald-500/30 dark:border-emerald-500/20 max-w-sm w-full p-8 transform transition-all scale-100 animate-in"
        >
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle class="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Sucesso!</h2>
            
            <p class="text-neutral-600 dark:text-neutral-400">
              A distribuição dos times foi salva corretamente.
            </p>
            
            <button
              @click="showSuccessModal = false"
              class="w-full mt-8 px-6 py-3.5 cursor-pointer bg-[#00D66F] text-white rounded-xl hover:bg-[#00A854] transition-colors font-medium shadow-[0_4px_14px_0_rgba(0,214,111,0.39)]"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>

      <!-- Copy Modal -->
      <div
        v-if="showCopyModal"
        @click="showCopyModal = false"
        class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div
          @click.stop
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-emerald-500/30 dark:border-emerald-500/20 max-w-sm w-full p-8 animate-in"
        >
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                <Copy class="w-9 h-9 text-emerald-500" />
              </div>
            </div>
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Copiado!</h2>
            <p class="text-neutral-600 dark:text-neutral-400 text-sm">
              Times copiados para a área de transferência. Cole no WhatsApp ou onde preferir.
            </p>
            <button
              @click="showCopyModal = false"
              class="w-full mt-6 px-6 py-3.5 cursor-pointer bg-[#00D66F] text-white rounded-xl hover:bg-[#00A854] transition-colors font-medium shadow-[0_4px_14px_0_rgba(0,214,111,0.39)]"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div
        v-if="showConfirmModal" 
        @click="showConfirmModal = false"
        class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      >
        <div 
          @click.stop
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-amber-500/30 dark:border-amber-500/20 max-w-sm w-full p-8 transform transition-all animate-in"
        >
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <div class="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle class="w-10 h-10 text-amber-500" />
              </div>
            </div>
            
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Atenção</h2>
            
            <p class="text-neutral-600 dark:text-neutral-400">
              Você tem alterações não salvas. Regerar os times irá descartá-las.<br>Deseja continuar?
            </p>
            
            <div class="flex gap-3 pt-6">
              <button
                @click="showConfirmModal = false"
                class="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium border border-neutral-200 dark:border-neutral-700"
              >
                Cancelar
              </button>
              <button
                @click="confirmRegenerate"
                class="flex-1 px-4 py-3 cursor-pointer bg-[#00D66F] text-white rounded-xl hover:bg-[#00A854] transition-colors font-medium shadow-[0_4px_14px_0_rgba(0,214,111,0.39)]"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animation-delay-100 {
  animation-delay: 100ms;
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
.font-sans, .tracking-tight, .tracking-wide {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* VueDraggable classes */
.ghost-player-base {
  opacity: 0.5;
  transform: scale(0.95);
}

.ghost-player-a {
  opacity: 0.5;
  transform: scale(0.98);
  background-color: rgba(130, 81, 238, 0.15); /* bg-brand-subtle */
  border-color: #00D66F; /* border-brand */
}

.ghost-player-b {
  opacity: 0.5;
  transform: scale(0.98);
  background-color: rgba(209, 250, 229, 0.5); /* emerald-100/50 */
  border-color: #34d399; /* emerald-400 */
}
</style>
