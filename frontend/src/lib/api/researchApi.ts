import { api, handleApiError } from './index'
import { SearchResult, URLContent } from './searchApi'
import settings from '../../config/settings'

export interface QuestionAnalysis {
    key_components: string[];
    scope_boundaries: string[];
    success_criteria: string[];
    conflicting_viewpoints: string[];
}

export interface ResearchAnswer {
    answer: string;
    sources_used: string[];
    confidence_score: number;
}

export interface StreamUpdate {
    data: string;
}

export type AnalyzeQuestionResponse = QuestionAnalysis;

export type { SearchResult };

export const researchApi = {
    analyzeQuestion: async (question: string): Promise<AnalyzeQuestionResponse> => {
        try {
            const response = await api.get(`/api/research/analyze-question?question=${encodeURIComponent(question)}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    expandQuestion: async (question: string): Promise<string[]> => {
        try {
            const response = await api.get(`/api/research/expand-question?question=${encodeURIComponent(question)}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    executeQueries: async (queries: string[]): Promise<SearchResult[]> => {
        try {
            const response = await api.post('/api/research/execute-queries', { queries });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    getResearchAnswer: async (question: string, sourceContent: URLContent[]): Promise<ResearchAnswer> => {
        try {
            const response = await api.post('/api/research/get-answer', {
                question,
                source_content: sourceContent
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    analyzeQuestionStream: async function* (question: string): AsyncGenerator<StreamUpdate> {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
            `${settings.apiUrl}/api/research/analyze-question/stream?question=${encodeURIComponent(question)}`,
            {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to analyze question');
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Stream not available');
        }

        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                if (text) {
                    yield { data: text };
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    // Add utility functions for consistency
    handleError: handleApiError
} 