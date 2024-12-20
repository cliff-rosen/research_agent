import { api, handleApiError } from './index'
import { SearchResult, URLContent } from './searchApi'
import { makeStreamRequest, StreamUpdate } from './streamUtils'

export interface CurrentEventsCheck {
    requires_current_context: boolean;
    reasoning: string;
    timeframe: string;
    key_events: string[];
    search_queries: string[];
}

export interface QuestionAnalysisResponse {
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

export type { SearchResult, StreamUpdate };

export const researchApi = {
    checkCurrentEventsStream: async function* (question: string): AsyncGenerator<StreamUpdate> {
        yield* makeStreamRequest('/api/research/check-current-events/stream', { question });
    },

    checkCurrentEvents: async (question: string): Promise<CurrentEventsCheck> => {
        try {
            const response = await api.get(`/api/research/check-current-events?question=${encodeURIComponent(question)}`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    analyzeQuestionStream: async function* (question: string): AsyncGenerator<StreamUpdate> {
        yield* makeStreamRequest('/api/research/analyze-question/stream', { question });
    },

    expandQuestionStream: async function* (question: string): AsyncGenerator<StreamUpdate> {
        yield* makeStreamRequest('/api/research/expand-question/stream', { question });
    },

    executeQueriesStream: async function* (queries: string[]): AsyncGenerator<StreamUpdate> {
        yield* makeStreamRequest('/api/research/execute-queries/stream', { queries });
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
    handleError: handleApiError,

    // DEPRECATED

    analyzeQuestion: async (question: string): Promise<QuestionAnalysisResponse> => {
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
} 