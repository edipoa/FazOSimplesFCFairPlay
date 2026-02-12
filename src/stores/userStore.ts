import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/axios';

interface UserProfile {
    id?: string;
    name: string;
    mainPosition: string;
    secondaryPositions: string[];
    dominantFoot: 'LEFT' | 'RIGHT' | 'BOTH';
}

export const useUserStore = defineStore('user', () => {
    const user = ref<UserProfile | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchProfile = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.get('/players/me/profile');
            // Handle both nested (response.data.data) and flat (response.data) structures
            user.value = response.data.data || response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Failed to fetch profile';
        } finally {
            loading.value = false;
        }
    };

    const saveProfile = async (profileData: UserProfile) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.put('/players/me/profile', profileData);
            user.value = response.data;
            return true; // Success
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Failed to save profile';
            // Only log non-validation errors (400 is expected for validation failures)
            if (err.response?.status !== 400) {
                console.error(err);
            }
            return false;
        } finally {
            loading.value = false;
        }
    };

    return {
        user,
        loading,
        error,
        fetchProfile,
        saveProfile,
    };
});
