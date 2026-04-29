<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { ArrowLeft, Smartphone } from 'lucide-vue-next';
import BrandLogo from '../components/BrandLogo.vue';
import BFButton from '../components/ui/BFButton.vue';
import BFPhoneInput from '../components/ui/BFPhoneInput.vue';
import BFOTPInput from '../components/ui/BFOTPInput.vue';
import BFAlertMessage from '../components/ui/BFAlertMessage.vue';

const router = useRouter();
const authStore = useAuthStore();

type Step = 'phone' | 'otp';
const step = ref<Step>('phone');
const phone = ref('');
const otp = ref('');
const canResend = ref(false);
const resendCountdown = ref(60);
let resendTimer: ReturnType<typeof setInterval> | null = null;

const isPhoneValid = computed(() => {
    const raw = phone.value.replace(/\D/g, '');
    return raw.length === 10 || raw.length === 11;
});

const isOtpValid = computed(() => otp.value.trim().length === 6);

// Smart Brazilian phone normalization (matches bot-interface logic)
const normalizePhone = (formatted: string): string => {
    let n = formatted.replace(/\D/g, '');
    if (n.length === 11 && n.charAt(2) === '9') {
        const ddd = n.substring(0, 2);
        if (!ddd.startsWith('9')) n = n.slice(0, 2) + n.slice(3);
    }
    return n.startsWith('55') ? n : `55${n}`;
};

const startResendCountdown = () => {
    canResend.value = false;
    resendCountdown.value = 60;
    if (resendTimer) clearInterval(resendTimer);
    resendTimer = setInterval(() => {
        resendCountdown.value--;
        if (resendCountdown.value <= 0) {
            clearInterval(resendTimer!);
            resendTimer = null;
            canResend.value = true;
        }
    }, 1000);
};

const handleSendCode = async () => {
    if (!isPhoneValid.value || authStore.loading) return;
    const success = await authStore.requestOtp(normalizePhone(phone.value));
    if (success) {
        step.value = 'otp';
        startResendCountdown();
    }
};

const handleVerifyCode = async () => {
    if (!isOtpValid.value || authStore.loading) return;
    const success = await authStore.login(normalizePhone(phone.value), otp.value.trim());
    if (success && authStore.currentWorkspaceId) {
        router.push({ name: 'profile', params: { workspaceId: authStore.currentWorkspaceId } });
    }
};

const handleResend = async () => {
    if (!canResend.value || authStore.loading) return;
    otp.value = '';
    authStore.error = null;
    const success = await authStore.requestOtp(normalizePhone(phone.value));
    if (success) startResendCountdown();
};

const handleBack = () => {
    step.value = 'phone';
    otp.value = '';
    authStore.error = null;
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
};
</script>

<template>
    <div class="fixed inset-0 bg-gradient-to-br from-[var(--bf-navy)] via-[var(--bf-navy-light)] to-[var(--bf-blue-primary)] flex items-center justify-center px-4 py-6 overflow-y-auto">
        <div class="w-full max-w-md">

            <!-- Logo + header -->
            <div class="text-center mb-8">
                <div class="flex justify-center mb-6">
                    <div class="bg-white p-4 rounded-2xl shadow-2xl">
                        <BrandLogo size="sm" layout="horizontal" :show-subtitle="true" />
                    </div>
                </div>
                <h1 class="text-3xl font-semibold text-white mb-2">Bem-vindo ao Faz o Simples</h1>
                <p class="text-blue-200 text-sm">
                    {{ step === 'phone' ? 'Entre com seu número de telefone' : 'Digite o código de verificação' }}
                </p>
            </div>

            <!-- Card -->
            <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">

                <!-- Step dots -->
                <div class="flex items-center justify-center gap-2 mb-8">
                    <div :class="['h-2 rounded-full transition-all duration-300', step === 'phone' ? 'bg-[var(--bf-blue-primary)] w-8' : 'bg-gray-200 w-2']" />
                    <div :class="['h-2 rounded-full transition-all duration-300', step === 'otp' ? 'bg-[var(--bf-blue-primary)] w-8' : 'bg-gray-200 w-2']" />
                </div>

                <!-- Error alert -->
                <div v-if="authStore.error" class="mb-6">
                    <BFAlertMessage variant="error" :message="authStore.error" @close="authStore.error = null" />
                </div>

                <!-- Step 1: Phone -->
                <div v-if="step === 'phone'" class="space-y-6">
                    <BFPhoneInput v-model="phone" :disabled="authStore.loading" :auto-focus="true" />

                    <BFButton
                        variant="primary"
                        size="lg"
                        :full-width="true"
                        :loading="authStore.loading"
                        :disabled="!isPhoneValid"
                        @click="handleSendCode"
                    >
                        {{ authStore.loading ? 'Enviando...' : 'Enviar código' }}
                    </BFButton>

                    <div class="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-100 rounded-xl">
                        <Smartphone class="w-5 h-5 text-[var(--bf-blue-primary)] flex-shrink-0 mt-0.5" />
                        <p class="text-sm text-blue-700">Você receberá um código de verificação via WhatsApp</p>
                    </div>
                </div>

                <!-- Step 2: OTP -->
                <div v-else class="space-y-6">
                    <button
                        @click="handleBack"
                        :disabled="authStore.loading"
                        class="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft class="w-4 h-4" />
                        Voltar
                    </button>

                    <div class="text-center">
                        <p class="text-sm text-[var(--muted-foreground)]">Código enviado para</p>
                        <p class="font-medium text-[var(--bf-blue-primary)] mt-1">{{ phone }}</p>
                    </div>

                    <BFOTPInput v-model="otp" :loading="authStore.loading" :auto-focus="true" />

                    <BFButton
                        variant="primary"
                        size="lg"
                        :full-width="true"
                        :loading="authStore.loading"
                        :disabled="!isOtpValid"
                        @click="handleVerifyCode"
                    >
                        {{ authStore.loading ? 'Verificando...' : 'Verificar código' }}
                    </BFButton>

                    <div class="text-center">
                        <button
                            v-if="canResend"
                            @click="handleResend"
                            :disabled="authStore.loading"
                            class="text-sm text-[var(--bf-blue-primary)] hover:underline disabled:opacity-50"
                        >
                            Reenviar código
                        </button>
                        <p v-else class="text-sm text-[var(--muted-foreground)]">
                            Reenviar código em <span class="text-[var(--bf-blue-primary)] font-medium">{{ resendCountdown }}s</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <p class="text-center text-sm text-blue-200 mt-6">
                Ao continuar, você concorda com nossos
                <button class="underline hover:text-white transition-colors">Termos de Uso</button>
            </p>
        </div>
    </div>
</template>
