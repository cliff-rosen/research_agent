import settings from '../../config/settings';

export interface StreamUpdate {
    data: string;
}

// Add this to store the handleSessionExpired callback
let sessionExpiredHandler: (() => void) | null = null;

export const setStreamSessionExpiredHandler = (handler: () => void) => {
    sessionExpiredHandler = handler;
};

export async function* makeStreamRequest(endpoint: string, params: Record<string, string | string[]>): AsyncGenerator<StreamUpdate> {
    const queryString = Object.entries(params)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                // For arrays, use POST with JSON body
                return null;
            }
            return `${key}=${encodeURIComponent(value)}`;
        })
        .filter(Boolean)
        .join('&');
        
    const token = localStorage.getItem('authToken');
    const hasArrayParams = Object.values(params).some(Array.isArray);
    
    const response = await fetch(
        `${settings.apiUrl}${endpoint}${queryString ? `?${queryString}` : ''}`,
        {
            method: hasArrayParams ? 'POST' : 'GET',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(hasArrayParams ? { 'Content-Type': 'application/json' } : {}),
            },
            ...(hasArrayParams ? { body: JSON.stringify(params) } : {}),
        }
    );

    if (!response.ok) {
        // Handle authentication/authorization errors
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            if (sessionExpiredHandler) {
                sessionExpiredHandler();
            }
            throw new Error('Authentication required');
        }
        throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Stream not available');
    }

    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                const final = decoder.decode(); // Flush any remaining bytes
                if (final) yield { data: final };
                break;
            }

            const decoded = decoder.decode(value, { stream: true });
            if (decoded) yield { data: decoded };
        }
    } finally {
        reader.releaseLock();
    }
} 