<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import { User, Check, AlertCircle } from 'lucide-vue-next';

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();

const positions = [
  { label: 'Goleiro', value: 'GOL' },
  { label: 'Zagueiro', value: 'ZAG' },
  { label: 'Lateral', value: 'LAT' },
  { label: 'Meia', value: 'MEI' },
  { label: 'Atacante', value: 'ATA' }
];

const dominantFeet = [
  { label: 'Destro', value: 'RIGHT' },
  { label: 'Canhoto', value: 'LEFT' },
  { label: 'Ambidestro', value: 'BOTH' }
];

const form = ref({
  name: '',
  mainPosition: '',
  secondaryPositions: [] as string[],
  dominantFoot: 'RIGHT' as 'RIGHT' | 'LEFT' | 'BOTH'
});

const isSaving = ref(false);
const saveMessage = ref('');
const errorMessage = ref('');

const getNormalizedPosition = (pos: string): string => {
  if (!pos) return '';
  // Map legacy full values to 3-letter codes
  const map: Record<string, string> = {
    'GOLEIRO': 'GOL',
    'ZAGUEIRO': 'ZAG',
    'LATERAL_DIREITO': 'LAT',
    'LATERAL_ESQUERDO': 'LAT',
    'VOLANTE': 'MEI',
    'MEIA_ARMADOR': 'MEI',
    'PONTA_DIREITA': 'ATA',
    'PONTA_ESQUERDA': 'ATA',
    'ATACANTE': 'ATA',
    // Handle cases where it might already be 3 letters (or close to it)
    'GOL': 'GOL', 'ZAG': 'ZAG', 'LAT': 'LAT', 'MEI': 'MEI', 'ATA': 'ATA'
  };
  return map[pos] || '';
};

onMounted(async () => {
  await userStore.fetchProfile();
  console.log('Profile loaded:', userStore.user);
  
  if (userStore.user) {
    const rawPosition = userStore.user.mainPosition || (userStore.user as any).position || '';
    
    form.value = {
      name: userStore.user.name || authStore.user?.name || '',
      mainPosition: getNormalizedPosition(rawPosition),
      secondaryPositions: (userStore.user.secondaryPositions || []).map(getNormalizedPosition).filter(p => p !== ''),
      dominantFoot: (userStore.user.dominantFoot as 'RIGHT' | 'LEFT' | 'BOTH') || 'RIGHT'
    };
  } else if (authStore.user) {
      form.value.name = authStore.user.name || '';
  }
});

const toggleSecondaryPosition = (posValue: string) => {
  if (form.value.secondaryPositions.includes(posValue)) {
    form.value.secondaryPositions = form.value.secondaryPositions.filter(p => p !== posValue);
  } else {
    if (form.value.secondaryPositions.length < 2) {
      form.value.secondaryPositions.push(posValue);
    }
  }
};

const saveProfile = async () => {
  isSaving.value = true;
  saveMessage.value = '';
  errorMessage.value = '';
  
     const payload = {
        name: form.value.name,
        mainPosition: form.value.mainPosition,
        secondaryPositions: form.value.secondaryPositions,
        dominantFoot: form.value.dominantFoot
     };
  
  if (!payload.mainPosition) {
    errorMessage.value = 'Por favor, selecione uma posição principal.';
    isSaving.value = false;
    return;
  }
  
  const success = await userStore.saveProfile(payload);
  if (success) {
    saveMessage.value = 'Perfil salvo com sucesso!';
    setTimeout(() => {
        router.push('/rate');
    }, 1500);
  } else {
    errorMessage.value = userStore.error || 'Erro ao salvar perfil. Tente novamente.';
  }
  isSaving.value = false;
};
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900">Meu Perfil</h2>
      <p class="text-gray-500">Configure suas preferências de jogo</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700">Nome</label>
      <div class="mt-1 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User class="h-5 w-5 text-gray-400" />
        </div>
        <input 
          v-model="form.name"
          type="text" 
          class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" 
          placeholder="Seu nome"
        >
      </div>
    </div>

    <!-- Primary Position -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Posição Principal</label>
      <select 
        v-model="form.mainPosition"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
      >
        <option disabled value="">Selecione...</option>
        <option v-for="pos in positions" :key="pos.value" :value="pos.value">{{ pos.label }}</option>
      </select>
    </div>

    <!-- Secondary Positions -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Posições Secundárias (Max 2)</label>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="pos in positions" 
          :key="pos.value"
          type="button"
          @click="toggleSecondaryPosition(pos.value)"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            form.secondaryPositions.includes(pos.value) 
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          ]"
          :disabled="!form.secondaryPositions.includes(pos.value) && form.secondaryPositions.length >= 2"
        >
          {{ pos.label }}
        </button>
      </div>
    </div>

    <!-- Dominant Foot -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Pé Dominante</label>
      <div class="flex space-x-4">
        <label v-for="foot in dominantFeet" :key="foot.value" class="inline-flex items-center">
          <input 
            type="radio" 
            v-model="form.dominantFoot" 
            :value="foot.value"
            class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
          >
          <span class="ml-2 text-gray-700">{{ foot.label }}</span>
        </label>
      </div>
    </div>

    <!-- Feedback Messages -->
    <div v-if="saveMessage" class="rounded-md bg-green-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <Check class="h-5 w-5 text-green-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800">{{ saveMessage }}</p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <AlertCircle class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <button 
      @click="saveProfile"
      :disabled="isSaving"
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <span v-if="isSaving">Salvando...</span>
      <span v-else>Salvar Perfil</span>
    </button>
  </div>
</template>
