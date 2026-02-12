<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../api/axios';
import { Calendar, Clock, Users } from 'lucide-vue-next';

interface Game {
  id: string;
  date: string;
  time: string;
  status: 'open' | 'confirmed' | 'closed' | 'canceled';
  confirmedCount: number;
}

const games = ref<Game[]>([]);
const loading = ref(true);
const error = ref('');
const router = useRouter();

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
    error.value = 'Erro ao buscar jogos.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const goToBuilder = (gameId: string) => {
  router.push(`/admin/games/${gameId}/builder`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

onMounted(() => {
  fetchGames();
});
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Gestão de Jogos</h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
      <p class="mt-2 text-gray-500">Carregando jogos...</p>
    </div>

    <div v-else-if="error" class="text-center text-red-600 bg-red-50 p-4 rounded-md">
      {{ error }}
    </div>

    <div v-else-if="games.length === 0" class="text-center text-gray-500 py-10">
      Nenhum jogo aberto ou confirmado encontrado.
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="game in games" 
        :key="game.id" 
        @click="goToBuilder(game.id)"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-indigo-300 relative group"
      >
        <div class="absolute top-2 right-2">
            <span :class="{
                'bg-green-100 text-green-800': game.status === 'confirmed',
                'bg-blue-100 text-blue-800': game.status === 'open',
                'bg-gray-100 text-gray-800': game.status === 'closed',
                 'px-2 py-0.5 rounded text-xs font-medium': true
            }">
                {{ game.status === 'confirmed' ? 'Confirmado' : 'Aberto' }}
            </span>
        </div>
        
        <div class="space-y-3 mt-2">
          <div class="flex items-center text-gray-700">
            <Calendar class="w-5 h-5 mr-2 text-indigo-500" />
            <span class="font-medium">{{ formatDate(game.date) }}</span>
          </div>
          
          <div class="flex items-center text-gray-700">
            <Clock class="w-5 h-5 mr-2 text-indigo-500" />
            <span>{{ game.time }}</span>
          </div>
          
          <div class="flex items-center text-gray-700">
            <Users class="w-5 h-5 mr-2 text-indigo-500" />
            <span>{{ game.confirmedCount }} confirmados</span>
          </div>
        </div>

        <div class="mt-4 w-full bg-indigo-50 text-indigo-600 py-2 rounded text-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Gerenciar Times
        </div>
      </div>
    </div>
  </div>
</template>
