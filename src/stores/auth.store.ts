
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { requestOtp as apiRequestOtp, login as apiLogin, getMe as apiGetMe, type LoginResponse } from '../api/auth.service';

// Safe function to load user from localStorage
function getStoredUser() {
    const stored = localStorage.getItem('user');
    if (!stored || stored === 'undefined' || stored === 'null') {
        return null;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('user');
        return null;
    }
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any | null>(getStoredUser());
    const token = ref<string | null>(localStorage.getItem('token'));
    const isAuthenticated = ref<boolean>(!!token.value);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Computed property to check if user is admin in any workspace
    const isAdmin = computed(() => {
        if (!user.value || !user.value.workspaces) return false;
        return user.value.workspaces.some((ws: any) => ws.role === 'ADMIN');
    });


    const setAuth = (response: LoginResponse) => {
        if (!response.data || !response.data.user) {
            console.error('Invalid login response structure', response);
            return;
        }
        user.value = response.data.user;
        token.value = response.data.accessToken;
        isAuthenticated.value = true;
        localStorage.setItem('token', response.data.accessToken);
        try {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (e) {
            console.error('Failed to stringify user for localStorage', e);
        }
    };

    const clearAuth = () => {
        user.value = null;
        token.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const requestOtp = async (phone: string) => {
        loading.value = true;
        error.value = null;
        try {
            const result = await apiRequestOtp(phone);
            console.log(result);

            return true;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Falha ao solicitar código.';
            return false;
        } finally {
            loading.value = false;
        }
    };

    const login = async (phone: string, code: string) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await apiLogin(phone, code);

            // Validate that user data is present in response
            if (!response.data || !response.data.user) {
                console.error('Login response missing user data:', response);
                throw new Error('Erro no servidor: Usuário não retornado.');
            }

            setAuth(response);
            return true;
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Código inválido ou expirado.';
            return false;
        } finally {
            loading.value = false;
        }
    };

    const logout = () => {
        clearAuth();
        window.location.reload(); // Simple way to clear state and redirect
    };

    const checkAuth = async () => {
        if (!token.value) {
            return false;
        }
        try {
            const response = await apiGetMe();
            // Backend returns { success: true, data: user }
            // Handle both response.data.data and response.data structures
            const userData = response.data?.data || response.data;

            if (userData && typeof userData === 'object') {
                user.value = userData;
                try {
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (e) {
                    console.error('Failed to save user to localStorage', e);
                }
                isAuthenticated.value = true;
                return true;
            } else {
                console.warn('Unexpected checkAuth response', response);
                clearAuth();
                return false;
            }
        } catch (err: any) {
            console.error('Check auth failed', err);
            clearAuth();
            return false;
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        requestOtp,
        login,
        logout,
        checkAuth
    };
});

