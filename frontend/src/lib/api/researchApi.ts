import { api, handleApiError } from './index'
import { SearchResult, URLContent } from './searchApi'

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

    // Add utility functions for consistency
    handleError: handleApiError
} 