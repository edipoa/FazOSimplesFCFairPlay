<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/auth.store';
import { useRouter } from 'vue-router';
import { User, Check, AlertCircle, Loader2 } from 'lucide-vue-next';

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
  <div class="max-w-md mx-auto p-6 bg-white/60 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm backdrop-blur-md space-y-6 animate-in duration-500 mt-4 transition-colors">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Meu Perfil</h2>
      <p class="text-neutral-500 dark:text-neutral-400 mt-1">Configure suas preferências de jogo</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome</label>
      <div class="relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User class="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
        </div>
        <input 
          v-model="form.name"
          type="text" 
          class="block w-full pl-10 py-2.5 sm:text-sm rounded-lg bg-white dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-[rgba(130,81,238,0.5)] focus:border-[rgba(130,81,238,1)] transition-colors" 
          placeholder="Seu nome"
        >
      </div>
    </div>

    <!-- Primary Position -->
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Posição Principal</label>
      <select 
        v-model="form.mainPosition"
        class="block w-full pl-3 pr-10 py-2.5 text-base sm:text-sm rounded-lg bg-white dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-[rgba(130,81,238,0.5)] focus:border-[rgba(130,81,238,1)] transition-colors"
      >
        <option disabled value="">Selecione...</option>
        <option v-for="pos in positions" :key="pos.value" :value="pos.value" class="dark:bg-neutral-800">{{ pos.label }}</option>
      </select>
    </div>

    <!-- Secondary Positions -->
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Posições Secundárias (Max 2)</label>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="pos in positions" 
          :key="pos.value"
          type="button"
          @click="toggleSecondaryPosition(pos.value)"
          :class="[
            'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer',
            form.secondaryPositions.includes(pos.value) 
              ? 'bg-[rgba(130,81,238,0.1)] dark:bg-[rgba(130,81,238,0.15)] text-[rgba(130,81,238,1)] dark:text-[rgba(163,126,245,1)] border-[rgba(130,81,238,0.3)] dark:border-[rgba(130,81,238,0.4)] shadow-[0_0_10px_rgba(130,81,238,0.1)]' 
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          ]"
          :disabled="!form.secondaryPositions.includes(pos.value) && form.secondaryPositions.length >= 2"
        >
          {{ pos.label }}
        </button>
      </div>
    </div>

    <!-- Dominant Foot -->
    <div>
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Pé Dominante</label>
      <div class="flex space-x-6">
        <label v-for="foot in dominantFeet" :key="foot.value" class="inline-flex items-center cursor-pointer group">
          <input 
            type="radio" 
            v-model="form.dominantFoot" 
            :value="foot.value"
            class="focus:ring-[rgba(130,81,238,0.5)] h-4 w-4 text-[rgba(130,81,238,1)] border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 transition-colors"
          >
          <span class="ml-2.5 text-neutral-700 dark:text-neutral-300 font-medium text-sm group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{{ foot.label }}</span>
        </label>
      </div>
    </div>

    <!-- Feedback Messages -->
    <div v-if="saveMessage" class="rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 transition-all">
      <div class="flex">
        <div class="flex-shrink-0">
          <Check class="h-5 w-5 text-emerald-500" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-emerald-800 dark:text-emerald-300">{{ saveMessage }}</p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-xl bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 transition-all">
      <div class="flex">
        <div class="flex-shrink-0">
          <AlertCircle class="h-5 w-5 text-red-500" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <button 
      @click="saveProfile"
      :disabled="isSaving"
      class="w-full flex justify-center cursor-pointer py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(130,81,238,0.39)] text-sm font-semibold text-white bg-[rgba(130,81,238,1)] hover:bg-[rgba(110,61,218,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(130,81,238,0.5)] dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
    >
      <span v-if="isSaving" class="flex items-center"><Loader2 class="w-4 h-4 mr-2 animate-spin" /> Salvando...</span>
      <span v-else>Salvar Perfil</span>
    </button>
  </div>
</template>

<style scoped>
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

input[type="radio"] {
  accent-color: rgba(130, 81, 238, 1);
}
</style>
