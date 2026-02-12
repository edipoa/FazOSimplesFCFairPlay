import api from './axios';

export interface RatingHistoryItem {
    ratedId: string;
    score: number;
}

export const fetchUserRatings = async (): Promise<RatingHistoryItem[]> => {
    const response = await api.get('/ratings');
    // Assuming the response structure is { success: true, data: [...] } based on requirements
    return response.data.data;
};
