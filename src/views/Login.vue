<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { Loader2, Phone, Lock, AlertCircle } from 'lucide-vue-next';
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
  <div class="fixed inset-0 bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors duration-500">
    <div class="max-w-md w-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/50 dark:border-white/10 overflow-hidden animate-in fade-in duration-500">
      
      <!-- Header -->
      <div class="bg-white/40 dark:bg-neutral-800/40 px-6 py-8 text-center border-b border-neutral-100 dark:border-neutral-800 flex flex-col items-center">
        <BrandLogo size="md" :show-subtitle="true" />
        <p class="text-neutral-500 dark:text-neutral-400 mt-4 text-sm font-medium tracking-wide">Entre para gerenciar seu perfil</p>
      </div>

      <!-- Body -->
      <div class="p-6 md:p-8 space-y-6 relative">
        
        <!-- Background decorative gradient -->
        <div class="absolute -top-32 -left-32 w-64 h-64 bg-brand/10 dark:bg-brand/20 rounded-full blur-[100px] pointer-events-none"></div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800/30 text-sm font-medium flex items-center backdrop-blur-sm relative z-10 transition-all">
            <AlertCircle class="w-4 h-4 mr-2" />
            <span>{{ authStore.error }}</span>
        </div>

        <!-- Step 1: Phone -->
        <div v-if="step === 1" class="space-y-5 relative z-10">
            <div>
                <label class="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 tracking-wide">Celular</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone class="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <input 
                        v-model="phone"
                        @input="formatPhone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        class="block w-full pl-10 pr-3 py-3 border border-neutral-200 dark:border-neutral-700/80 rounded-xl leading-5 bg-white/60 dark:bg-neutral-800/60 placeholder-neutral-400 dark:placeholder-neutral-500 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 dark:focus:ring-brand/40 focus:bg-white dark:focus:bg-neutral-800 transition-all font-medium sm:text-sm"
                        @keyup.enter="handleRequestOtp"
                    />
                </div>
            </div>

            <button 
                @click="handleRequestOtp"
                :disabled="!isValidPhone || authStore.loading"
                class="w-full flex justify-center cursor-pointer py-3 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(130,81,238,0.39)] text-sm font-semibold text-white bg-[rgba(130,81,238,1)] hover:bg-[rgba(110,61,218,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(130,81,238,0.5)] dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
                <Loader2 v-if="authStore.loading" class="animate-spin h-5 w-5" />
                <span v-else>Receber Código</span>
            </button>
        </div>

        <!-- Step 2: OTP -->
        <div v-else class="space-y-6 relative z-10">
            <div class="text-center bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                 <p class="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    Enviamos um código para <span class="font-bold text-neutral-900 dark:text-white">{{ phone }}</span>
                 </p>
                 <button @click="reset" class="text-xs text-brand hover:text-brand-light mt-2 font-bold underline decoration-brand/30 hover:decoration-brand transition-all">Alterar número</button>
            </div>

            <div>
                <label class="sr-only">Código de Verificação</label>
                <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock class="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <input 
                        ref="otpInput"
                        v-model="otp"
                        type="text"
                        maxlength="6"
                        placeholder="000000"
                        class="block w-full pl-10 pr-3 py-3.5 text-center border border-neutral-200 dark:border-neutral-700/80 rounded-xl leading-5 bg-white/60 dark:bg-neutral-800/60 placeholder-neutral-300 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:focus:ring-brand/40 focus:bg-white dark:focus:bg-neutral-800 text-2xl tracking-[0.5em] font-bold text-neutral-900 dark:text-white transition-all uppercase"
                        @keyup.enter="handleLogin"
                    />
                </div>
                 <p class="text-xs text-center text-neutral-400 dark:text-neutral-500 mt-3 font-medium">Digite o código de 6 dígitos</p>
            </div>

            <button 
                @click="handleLogin"
                :disabled="!isValidOtp || authStore.loading"
                class="w-full flex justify-center cursor-pointer py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(130,81,238,0.39)] text-sm font-semibold text-white bg-[rgba(130,81,238,1)] hover:bg-[rgba(110,61,218,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgba(130,81,238,0.5)] dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
                <Loader2 v-if="authStore.loading" class="animate-spin h-5 w-5" />
                <span v-else>Confirmar</span>
            </button>
        </div>

      </div>
       <div class="bg-white/30 dark:bg-neutral-800/20 backdrop-blur-sm px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
            <p class="text-xs font-medium text-neutral-400 dark:text-neutral-500">Faz o Simples FC &copy; {{ new Date().getFullYear() }}</p>
       </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
