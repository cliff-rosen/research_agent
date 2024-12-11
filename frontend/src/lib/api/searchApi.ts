import { api, handleApiError, formatTimestamp } from './index'

export const UNCATEGORIZED_TOPIC_ID = 0;
export const ALL_TOPICS_TOPIC_ID = -1;

// sample call
// const newTopic = { topic_name: 'New Topic' } 
// const response = await topicsApi.createTopic(newTopic)
// console.log(response)

// const response = await topicsApi.getTopics()
// console.log(response)


export interface SearchResult {
    topic_id: number;
    topic_name: string;
    relevance_score: number;
    matched_content: string;
    source: string;
}

export const searchApi = {

    search: async (query: string): Promise<SearchResult[]> => {
        const response = await api.get(`/api/search/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Add utility functions for consistency
    formatTopicTimestamp: formatTimestamp,
    handleError: handleApiError

} 