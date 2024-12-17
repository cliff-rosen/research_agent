import { api, handleApiError } from './index'

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
    relevance_score: number;
    pagemap?: {
        [key: string]: any;
    };
}

export interface URLContent {
    url: string;
    title: string;
    text: string;
    error?: string;
    content_type: 'html' | 'markdown' | 'code' | 'text';
}

export const searchApi = {
    search: async (query: string): Promise<SearchResult[]> => {
        try {
            const response = await api.get(`/api/search/search?query=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    fetchUrls: async (urls: string[]): Promise<URLContent[]> => {
        try {
            const response = await api.post('/api/search/fetch-urls', { urls });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    // Add utility functions for consistency
    handleError: handleApiError
} 