import { api, handleApiError } from './index'

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
    pagemap: Record<string, any>;
}

export const searchApi = {
    search: async (query: string): Promise<SearchResult[]> => {
        const response = await api.get(`/api/search/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Add utility functions for consistency
    handleError: handleApiError
} 