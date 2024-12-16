import settings from '../../config/settings';

export interface StreamUpdate {
    data: string;
}

// Add this to store the handleSessionExpired callback
let sessionExpiredHandler: (() => void) | null = null;

export const setStreamSessionExpiredHandler = (handler: () => void) => {
    sessionExpiredHandler = handler;
};

export async function* makeStreamRequest(endpoint: string, params: Record<string, string>): AsyncGenerator<StreamUpdate> {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
        
    const token = localStorage.getItem('authToken');
    const response = await fetch(
        `${settings.apiUrl}${endpoint}?${queryString}`,
        {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
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