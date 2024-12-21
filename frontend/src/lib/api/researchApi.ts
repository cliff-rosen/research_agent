import { api, handleApiError } from './index'
import { SearchResult, URLContent } from './searchApi'
import { makeStreamRequest, StreamUpdate } from './streamUtils'

export interface QuestionAnalysisResponse {
    key_components: string[];
    scope_boundaries: string[];
    success_criteria: string[];
    conflicting_viewpoints: string[];
}

export interface ResearchEvaluation {
    completeness_score: number;
    accuracy_score: number;
    relevance_score: number;
    overall_score: number;
    missing_aspects: string[];
    improvement_suggestions: string[];
    conflicting_aspects: Array<{
        aspect: string;
        conflict: string;
    }>;
}

export interface ResearchAnswer {
    answer: string;
    sources_used: string[];
    confidence_score: number;
}

export interface CurrentEventsCheck {
    requires_current_context: boolean;
    reasoning: string;
    timeframe: string;
    key_events: string[];
    search_queries: string[];
}

export type { SearchResult, StreamUpdate };

export const researchApi = {

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

    evaluateAnswer: async (
        question: string,
        analysis: QuestionAnalysisResponse,
        answer: string
    ): Promise<ResearchEvaluation> => {
        try {
            const response = await api.post('/api/research/evaluate-answer', {
                question,
                analysis,
                answer
            });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },
} 