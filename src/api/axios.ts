import axios from 'axios';
import { workspaceContext } from './workspace-context';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fairplay_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Reads from the reactive workspace context, which is always
        // up-to-date because the auth store writes to it on every change.
        const workspaceId = workspaceContext.id;
        if (workspaceId) {
            config.headers['x-workspace-id'] = workspaceId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

export default api;
