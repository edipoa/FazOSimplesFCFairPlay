import api from './axios';

export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
        user: any;
    };
    message: string;
}

export const requestOtp = async (phone: string): Promise<void> => {
    await api.post('/auth/request-otp', { phone });
};

export const login = async (phone: string, code: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/verify-otp', { phone, code });
    return response.data;
};

export const getMe = async () => {
    return api.get('/auth/me');
};
