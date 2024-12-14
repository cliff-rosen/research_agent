import { api, handleApiError } from './index'

export interface QuestionAnalysis {
    key_components: string[];
    scope_boundaries: string[];
    success_criteria: string[];
    conflicting_viewpoints: string[];
}

export type AnalyzeQuestionResponse = QuestionAnalysis;

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

    // Add utility functions for consistency
    handleError: handleApiError
} 