<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axios';
import StarRating from '../components/StarRating.vue';

interface RateablePlayer {
  id: string;
  name: string;
  position: string;
  currentRating?: number; // Visual feedback if already rated
}

const players = ref<RateablePlayer[]>([]);
const loading = ref(true);
const error = ref('');

const fetchRateablePlayers = async () => {
  loading.value = true;
  try {
    const response = await api.get('/players/rateable');
    // Assuming API returns list of players. Mapping to match interface if needed.
    players.value = response.data.map((p: any) => ({
      ...p,
      currentRating: p.rating || 0
    }));
  } catch (err: any) {
    error.value = 'Erro ao buscar jogadores.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const submitRating = async (playerId: string, rating: number) => {
  try {
    await api.post('/ratings', { targetUserId: playerId, score: rating });
    // Update local state to show it's rated, maybe show a success toast
    const player = players.value.find(p => p.id === playerId);
    if (player) {
      player.currentRating = rating;
    }
  } catch (err) {
    console.error('Failed to submit rating', err);
    alert('Erro ao enviar avaliação.');
  }
};

onMounted(() => {
  fetchRateablePlayers();
});
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Avaliar Companheiros</h2>
      <p class="text-gray-500">Ajude a equilibrar os times avaliando seus colegas.</p>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-2 text-gray-500">Carregando jogadores...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600 bg-red-50 p-4 rounded-md">
      {{ error }}
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div 
        v-for="player in players" 
        :key="player.id" 
        class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center space-y-3"
      >
        <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
          {{ player.name.charAt(0).toUpperCase() }}
        </div>
        <div class="text-center">
            <h3 class="font-medium text-gray-900">{{ player.name }}</h3>
            <p class="text-xs text-gray-500">{{ player.position }}</p>
        </div>
        
        <StarRating 
          :model-value="player.currentRating || 0" 
          @update:model-value="(val) => submitRating(player.id, val)"
        />
      </div>
    </div>
    
    <div v-if="!loading && players.length === 0" class="text-center text-gray-500 py-10">
        Nenhum jogador disponível para avaliação no momento.
    </div>
  </div>
</template>
