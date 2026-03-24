
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { requestOtp as apiRequestOtp, login as apiLogin, getMe as apiGetMe, type LoginResponse } from '../api/auth.service';
import { workspaceContext } from '../api/workspace-context';

// Safe function to load user from localStorage
function getStoredUser() {
    const stored = localStorage.getItem('fairplay_user');
    if (!stored || stored === 'undefined' || stored === 'null') {
        return null;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('fairplay_user');
        return null;
    }
}

// Callbacks registered by other stores to clear workspace-scoped data on tenant switch.
// This avoids direct store-to-store imports and circular deps.
type ClearCallback = () => void;
const workspaceClearCallbacks: ClearCallback[] = [];

/** Other stores call this to register their clear/reset action. */
export const onWorkspaceChange = (cb: ClearCallback) => {
    workspaceClearCallbacks.push(cb);
};

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any | null>(getStoredUser());
    const token = ref<string | null>(localStorage.getItem('fairplay_token'));
    const isAuthenticated = ref<boolean>(!!token.value);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const currentWorkspaceId = ref<string | null>(workspaceContext.id);

    const currentWorkspace = computed(() => {
        if (!user.value || !user.value.workspaces || !currentWorkspaceId.value) return null;
        return user.value.workspaces.find((ws: any) => ws.id === currentWorkspaceId.value) || null;
    });

    const isAdmin = computed(() => {
        if (!currentWorkspace.value) return false;
        return currentWorkspace.value.role === 'ADMIN' || currentWorkspace.value.role === 'OWNER';
    });

    const setWorkspace = (workspaceId: string) => {
        const isChanging = workspaceId !== currentWorkspaceId.value;
        currentWorkspaceId.value = workspaceId;
        workspaceContext.set(workspaceId);

        // Notify all registered stores to clear their workspace-scoped data
        if (isChanging) {
            workspaceClearCallbacks.forEach((cb) => cb());
        }
    };

    const setAuth = (response: LoginResponse) => {
        if (!response.data || !response.data.user) {
            console.error('Invalid login response structure', response);
            return;
        }
        user.value = response.data.user;
        token.value = response.data.accessToken;
        isAuthenticated.value = true;
        localStorage.setItem('fairplay_token', response.data.accessToken);
        try {
            localStorage.setItem('fairplay_user', JSON.stringify(response.data.user));
        } catch (e) {
            console.error('Failed to stringify user for localStorage', e);
        }

        const savedWorkspaceId = workspaceContext.id;
        if (savedWorkspaceId && user.value.workspaces?.some((ws: any) => ws.id === savedWorkspaceId)) {
            currentWorkspaceId.value = savedWorkspaceId;
        } else if (user.value.workspaces && user.value.workspaces.length > 0) {
            setWorkspace(user.value.workspaces[0].id);
        } else {
            currentWorkspaceId.value = null;
            workspaceContext.set(null);
        }
    };

    const clearAuth = () => {
        user.value = null;
        token.value = null;
        isAuthenticated.value = false;
        currentWorkspaceId.value = null;
        workspaceContext.set(null);
        localStorage.removeItem('fairplay_token');
        localStorage.removeItem('fairplay_user');
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
        // Navigate via href to fully reset app state without circular dep on router
        window.location.replace('/login');
    };

    const checkAuth = async () => {
        if (!token.value) {
            return false;
        }
        try {
            const response = await apiGetMe();
            const userData = response.data?.data || response.data;

            if (userData && typeof userData === 'object') {
                user.value = userData;
                try {
                    localStorage.setItem('fairplay_user', JSON.stringify(userData));
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
        currentWorkspaceId,
        currentWorkspace,
        isAdmin,
        loading,
        error,
        setWorkspace,
        requestOtp,
        login,
        logout,
        checkAuth
    };
});

