<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../api/axios';
import draggable from 'vuedraggable';
import { RefreshCw, Copy, Star, Save, AlertCircle, CheckCircle, AlertTriangle, User } from 'lucide-vue-next';

const route = useRoute();
const gameId = route.params.id as string;

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
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

// Computation for stats
const calculateStats = (players: Player[]): TeamStats => {
  if (players.length === 0) return { averageRating: 0, totalPlayers: 0 };
  const totalRating = players.reduce((sum, p) => sum + (p.rating || 0), 0);
  return {
    averageRating: totalRating / players.length,
    totalPlayers: players.length
  };
};

const statsA = computed(() => calculateStats(teamA.value));
const statsB = computed(() => calculateStats(teamB.value));

// Watch for changes to mark as unsaved
// Watch for changes to mark as unsaved
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
    rating: p.profile?.rating || p.rating || 0
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
      await generateTeams();
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
    
    // Check for any unassigned players in the new generation if API supports it, 
    // or just reset unassigned if all players are distributed. 
    // For now assuming generated teams allow for some leftovers or we keep existing unassigned?
    // Actually, usually generate covers everyone. But let's verify if response has unassigned.
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
    
    // Show success modal
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
        alert('Times copiados para a área de transferência!');
    }).catch(err => {
        console.error('Failed to copy', err);
        alert('Erro ao copiar.');
    });
};

const formatLastSaved = computed(() => {
  if (!lastSaved.value) return '';
  const now = new Date();
  const diff = now.getTime() - lastSaved.value.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Salvo agora';
  if (minutes === 1) return 'Salvo há 1 minuto';
  if (minutes < 60) return `Salvo há ${minutes} minutos`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'Salvo há 1 hora';
  return `Salvo há ${hours} horas`;
});

onMounted(() => {
  loadGameData();
});
</script>

<template>
  <div class="max-w-6xl mx-auto p-4 space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Montagem de Times</h1>
        <div v-if="lastSaved" class="text-sm text-gray-500 mt-1">
          {{ formatLastSaved }}
        </div>
        <div v-if="hasUnsavedChanges" class="flex items-center text-sm text-amber-600 mt-1">
          <AlertCircle class="w-4 h-4 mr-1" />
          Alterações não salvas
        </div>
      </div>
      
      <div class="flex flex-wrap gap-3">
        <button 
          @click="saveTeams" 
          :disabled="saving || !hasUnsavedChanges"
          class="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save :class="['w-4 h-4 mr-2', saving ? 'animate-pulse' : '']" />
          {{ saving ? 'Salvando...' : 'Salvar Times' }}
        </button>
        
        <button 
          @click="handleRegenerateClick" 
          :disabled="generating || loading"
          class="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw :class="['w-4 h-4 mr-2', generating ? 'animate-spin' : '']" />
          {{ generating ? 'Gerando...' : 'Regerar Times' }}
        </button>
        
        <button 
          @click="copyToWhatsapp" 
          :disabled="teamA.length === 0 && teamB.length === 0"
          class="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Copy class="w-4 h-4 mr-2" />
          WhatsApp
        </button>
      </div>
    </div>

    <div v-if="loading && !generating" class="text-center py-20">
       <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
       <p class="mt-4 text-gray-500">Carregando times...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
      {{ error }}
      <button @click="loadGameData" class="block mx-auto mt-4 text-indigo-600 hover:underline">Tentar Novamente</button>
    </div>

    <div v-else class="space-y-6">
      
      <!-- Unassigned Players Area -->
      <div v-if="unassigned.length > 0" class="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <h2 class="font-bold text-lg text-amber-900 mb-3 flex items-center">
            <User class="w-5 h-5 mr-2" />
            Jogadores Aguardando Distribuição ({{ unassigned.length }})
        </h2>
        <draggable 
             v-model="unassigned" 
             group="players" 
             item-key="id"
             class="flex flex-wrap gap-2"
             ghost-class="opacity-50"
        >
             <template #item="{ element }">
               <div class="bg-white p-2 rounded shadow-sm border border-amber-100 flex items-center space-x-2 cursor-move hover:border-amber-300 transition-colors w-auto">
                   <div :class="['h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-1', element.id ? 'bg-slate-200 text-slate-600 ring-slate-300' : 'bg-gray-100 text-gray-400 ring-gray-200']">
                     <span v-if="element.id">{{ element.position.substring(0, 3) }}</span>
                     <User v-else class="w-3 h-3" />
                   </div>
                   <span class="text-sm font-medium text-slate-700">{{ element.name }}</span>
                   <div v-if="element.id" class="flex items-center space-x-0.5 text-[10px] text-slate-400">
                     <span>{{ element.rating }}</span>
                     <Star class="w-2.5 h-2.5 text-yellow-400 fill-current" />
                   </div>
                   <span v-else class="text-[10px] text-gray-400 italic">Convidado</span>
               </div>
             </template>
        </draggable>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
      
      <!-- Team A Column -->
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full">
        <div class="bg-indigo-900 text-white p-3 rounded-t-lg flex justify-between items-center shadow-sm">
            <h2 class="font-bold text-lg">Time A</h2>
            <div class="flex items-center space-x-2 bg-indigo-800 px-2 py-1 rounded">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="font-bold">{{ statsA.averageRating.toFixed(1) }}</span>
            </div>
        </div>
        
        <div class="flex-1 min-h-[400px]">
           <draggable 
             v-model="teamA" 
             group="players" 
             item-key="id"
             class="space-y-2 py-4 h-full"
             ghost-class="opacity-50"
           >
             <template #item="{ element }">
               <div class="bg-white p-3 rounded shadow-sm border border-slate-200 flex justify-between items-center cursor-move hover:border-indigo-300 transition-colors">
                 <div class="flex items-center space-x-3">
                   <div class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs ring-1 ring-slate-300">
                     {{ element.position.substring(0, 3) }}
                   </div>
                   <div>
                       <p class="font-medium text-slate-800">{{ element.name }}</p>
                   </div>
                 </div>
                 
                 <div class="flex items-center space-x-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <span>{{ element.rating }}</span>
                    <Star class="w-3 h-3 text-yellow-500 fill-current" />
                 </div>
               </div>
             </template>
           </draggable>
        </div>
        <div class="mt-2 text-center text-sm text-gray-500">
           {{ statsA.totalPlayers }} Jogadores
        </div>
      </div>

      <!-- Team B Column -->
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col h-full">
        <div class="bg-emerald-900 text-white p-3 rounded-t-lg flex justify-between items-center shadow-sm">
            <h2 class="font-bold text-lg">Time B</h2>
            <div class="flex items-center space-x-2 bg-emerald-800 px-2 py-1 rounded">
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
                <span class="font-bold">{{ statsB.averageRating.toFixed(1) }}</span>
            </div>
        </div>
        
        <div class="flex-1 min-h-[400px]">
           <draggable 
             v-model="teamB" 
             group="players" 
             item-key="id"
             class="space-y-2 py-4 h-full"
             ghost-class="opacity-50"
           >
             <template #item="{ element }">
               <div class="bg-white p-3 rounded shadow-sm border border-slate-200 flex justify-between items-center cursor-move hover:border-emerald-300 transition-colors">
                 <div class="flex items-center space-x-3">
                   <div class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs ring-1 ring-slate-300">
                     {{ element.position.substring(0, 3) }}
                   </div>
                   <div>
                       <p class="font-medium text-slate-800">{{ element.name }}</p>
                   </div>
                 </div>
                 
                 <div class="flex items-center space-x-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <span>{{ element.rating }}</span>
                    <Star class="w-3 h-3 text-yellow-500 fill-current" />
                 </div>
               </div>
             </template>
           </draggable>
        </div>
        <div class="mt-2 text-center text-sm text-gray-500">
           {{ statsB.totalPlayers }} Jogadores
        </div>
      </div>
      </div>

    </div>



    <!-- Success Modal -->
    <div 
      v-if="showSuccessModal" 
      @click="showSuccessModal = false"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div 
        @click.stop
        class="bg-white rounded-xl shadow-2xl border border-green-500/50 max-w-md w-full p-8 transform transition-all"
      >
        <div class="text-center space-y-4">
          <div class="flex justify-center">
            <CheckCircle class="w-16 h-16 text-green-500" />
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900">Sucesso!</h2>
          
          <p class="text-gray-600">
            A distribuição dos times foi salva corretamente.
          </p>
          
          <button
            @click="showSuccessModal = false"
            class="w-full mt-6 px-6 py-3 bg-bf-navy text-white rounded-lg hover:bg-bf-navy/90 transition-colors font-medium"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div 
      v-if="showConfirmModal" 
      @click="showConfirmModal = false"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div 
        @click.stop
        class="bg-white rounded-xl shadow-2xl border border-amber-500/50 max-w-md w-full p-8 transform transition-all"
      >
        <div class="text-center space-y-4">
          <div class="flex justify-center">
            <AlertTriangle class="w-16 h-16 text-amber-500" />
          </div>
          
          <h2 class="text-2xl font-bold text-gray-900">Atenção</h2>
          
          <p class="text-gray-600">
            Você tem alterações não salvas. Regerar os times irá descartá-las. Deseja continuar?
          </p>
          
          <div class="flex gap-3 mt-6">
            <button
              @click="showConfirmModal = false"
              class="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-300"
            >
              Cancelar
            </button>
            <button
              @click="confirmRegenerate"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
