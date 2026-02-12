<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Loader2, Phone, Lock } from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';

const router = useRouter();
const authStore = useAuthStore();

const step = ref<1 | 2>(1);
const phone = ref('');
const otp = ref('');
const otpInput = ref<HTMLInputElement | null>(null);

const isValidPhone = computed(() => {
  // Simple check: matches (xx) xxxxx-xxxx or similar length
  const raw = phone.value.replace(/\D/g, '');
  return raw.length >= 10 && raw.length <= 11;
});

const isValidOtp = computed(() => {
  return otp.value.length === 6;
});

// Simple mask formatter
const formatPhone = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let raw = input.value.replace(/\D/g, '');
  
  if (raw.length > 11) raw = raw.slice(0, 11);
  
  let formatted = '';
  if (raw.length === 0) {
    formatted = '';
  } else if (raw.length <= 2) {
    formatted = `(${raw}`;
  } else if (raw.length <= 6) {
    formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  } else if (raw.length <= 10) {
    // (xx) xxxx-xxxx
    formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  } else {
    // (xx) xxxxx-xxxx
    formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }
  
  phone.value = formatted;
};

const handleRequestOtp = async () => {
    if (!isValidPhone.value) return;
    
    let raw = phone.value.replace(/\D/g, '');
    const formattedPhone = `55${raw}`; 

    const success = await authStore.requestOtp(formattedPhone);
    console.log(success);
    if (success) {
        step.value = 2;
        setTimeout(() => otpInput.value?.focus(), 100);
    }
};

const handleLogin = async () => {
    if (!isValidOtp.value) return;
    
    let raw = phone.value.replace(/\D/g, '');
    const formattedPhone = `55${raw}`; 

    const success = await authStore.login(formattedPhone, otp.value);
    if (success) {
        router.push('/');
    }
};

const reset = () => {
    step.value = 1;
    otp.value = '';
    authStore.error = null;
};
</script>

<template>
  <div class="fixed inset-0 bg-bf-navy flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="bg-gray-50 px-6 py-8 text-center border-b border-gray-100 flex flex-col items-center">
        <BrandLogo size="md" :show-subtitle="true" />
        <p class="text-gray-500 mt-4 text-sm">Entre para gerenciar seu perfil</p>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        
        <!-- Error Alert -->
        <div v-if="authStore.error" class="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start">
            <span>{{ authStore.error }}</span>
        </div>

        <!-- Step 1: Phone -->
        <div v-if="step === 1" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone class="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                        v-model="phone"
                        @input="formatPhone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                        @keyup.enter="handleRequestOtp"
                    />
                </div>
            </div>

            <button 
                @click="handleRequestOtp"
                :disabled="!isValidPhone || authStore.loading"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Loader2 v-if="authStore.loading" class="animate-spin h-5 w-5" />
                <span v-else>Receber Código</span>
            </button>
        </div>

        <!-- Step 2: OTP -->
        <div v-else class="space-y-6">
            <div class="text-center">
                 <p class="text-sm text-gray-600">
                    Enviamos um código para <span class="font-medium text-bf-navy">{{ phone }}</span>
                 </p>
                 <button @click="reset" class="text-xs text-primary hover:text-green-700 mt-1 font-medium">Alterar número</button>
            </div>

            <div>
                <label class="sr-only">Código de Verificação</label>
                <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock class="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                        ref="otpInput"
                        v-model="otp"
                        type="text"
                        maxlength="6"
                        placeholder="000000"
                        class="block w-full pl-10 pr-3 py-3 text-center border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-2xl tracking-widest font-bold text-gray-800 transition-all uppercase"
                        @keyup.enter="handleLogin"
                    />
                </div>
                 <p class="text-xs text-center text-gray-400 mt-2">Digite o código de 6 dígitos</p>
            </div>

            <button 
                @click="handleLogin"
                :disabled="!isValidOtp || authStore.loading"
                class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Loader2 v-if="authStore.loading" class="animate-spin h-5 w-5" />
                <span v-else>Entrar</span>
            </button>
        </div>

      </div>
       <div class="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-center">
            <p class="text-xs text-gray-400">Faz o Simples FC &copy; {{ new Date().getFullYear() }}</p>
       </div>
    </div>
  </div>
</template>
