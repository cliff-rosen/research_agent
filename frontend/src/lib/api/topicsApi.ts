import { api, handleApiError, formatTimestamp } from './index'

export const UNCATEGORIZED_TOPIC_ID = 0;
export const ALL_TOPICS_TOPIC_ID = -1;

// sample call
// const newTopic = { topic_name: 'New Topic' } 
// const response = await topicsApi.createTopic(newTopic)
// console.log(response)

// const response = await topicsApi.getTopics()
// console.log(response)

export interface Topic {
    topic_id: number;
    topic_name: string;
    entry_count?: number;
    user_id: number;
    creation_date: string;
}

export interface TopicCreate {
    topic_name: string;
}

export interface TopicUpdate {
    topic_name: string;
}

export interface UncategorizedTopic {
    topic_id: 0;
    topic_name: string;
    user_id: number;
    created_at: string;
    entry_count: number;
}

export interface AllTopicsTopic {
    topic_id: -1;
    topic_name: string;
    user_id: number;
    created_at: string;
    entry_count: number;
}


export const topicsApi = {

    createTopic: async (topic: TopicCreate): Promise<Topic> => {
        const response = await api.post('/api/topics', topic)
        return response.data
    },

    getTopic: async (topicId: number): Promise<Topic> => {
        const response = await api.get(`/api/topics/${topicId}`)
        return response.data
    },

    getTopics: async (): Promise<(Topic | UncategorizedTopic)[]> => {
        const response = await api.get('/api/topics')
        return response.data
    },

    updateTopic: async (topicId: number, topic: TopicUpdate): Promise<Topic> => {
        const response = await api.patch(`/api/topics/${topicId}`, topic)
        return response.data
    },


    deleteTopic: async (topicId: number): Promise<void> => {
        await api.delete(`/api/topics/${topicId}`)
    },

    // Add utility functions for consistency
    formatTopicTimestamp: formatTimestamp,
    handleError: handleApiError

} 