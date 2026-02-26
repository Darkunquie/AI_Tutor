// Centralized API client for frontend
// Provides type-safe fetch wrapper with error handling

import type { ApiResponse, PaginatedResponse, StreakData, AchievementItem, ReviewWord, ReviewStats } from './types';

// Default timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// API client configuration
interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Request options extending fetch options
interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

// API client error
export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static fromResponse(response: Response, body: unknown): ApiClientError {
    const errorBody = body as { error?: { message?: string; code?: string; details?: unknown } };
    return new ApiClientError(
      errorBody?.error?.message || response.statusText || 'Request failed',
      response.status,
      errorBody?.error?.code || 'UNKNOWN_ERROR',
      errorBody?.error?.details
    );
  }
}

// Create API client instance
function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl || '';
  const defaultTimeout = config.timeout || DEFAULT_TIMEOUT;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // Build URL with query params
  function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, baseUrl || window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  // Make request with timeout
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeout = defaultTimeout, params, body, headers, ...fetchOptions } = options;

    const url = buildUrl(path, params);

    // Get auth token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...defaultHeaders,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body with error handling
      let responseBody: any;
      try {
        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        responseBody = isJson ? await response.json() : await response.text();
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }

      // Handle error responses
      if (!response.ok) {
        // On 401, clear stale auth and redirect to login (unless already on login/signup)
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
            window.location.href = '/login';
          }
        }
        throw ApiClientError.fromResponse(response, responseBody);
      }

      // Auto-unwrap { data: ... } envelope from successResponse/paginatedResponse
      if (
        responseBody &&
        typeof responseBody === 'object' &&
        'data' in responseBody &&
        !('meta' in responseBody)
      ) {
        return (responseBody as { data: T }).data;
      }

      return responseBody as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError('Request timeout', 408, 'TIMEOUT');
        }
        throw new ApiClientError(error.message, 0, 'NETWORK_ERROR');
      }

      throw new ApiClientError('Unknown error', 0, 'UNKNOWN_ERROR');
    }
  }

  // HTTP method helpers
  return {
    get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
      return request<T>(path, { ...options, method: 'GET' });
    },

    post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
      return request<T>(path, { ...options, method: 'POST', body });
    },

    put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
      return request<T>(path, { ...options, method: 'PUT', body });
    },

    patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
      return request<T>(path, { ...options, method: 'PATCH', body });
    },

    delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
      return request<T>(path, { ...options, method: 'DELETE' });
    },
  };
}

// Default API client instance
export const apiClient = createApiClient();

// Type-safe API helpers
// Note: apiClient auto-unwraps { data: ... } envelope, so return types
// should be the inner data shape, not the envelope.
export const api = {
  // Chat
  chat: {
    send: (data: {
      message: string;
      mode: string;
      level: string;
      sessionId: string;
      context?: { topic?: string; scenario?: string; character?: string; userRole?: string; debateTopic?: string; debatePosition?: string };
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => apiClient.post<{ reply: string; sessionId: string }>('/api/chat', data),

    stream: async function* (data: {
      message: string;
      mode: string;
      level: string;
      sessionId: string;
      context?: { topic?: string; scenario?: string; character?: string; userRole?: string; debateTopic?: string; debatePosition?: string };
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
    }, options?: { timeout?: number }): AsyncGenerator<string> {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const controller = new AbortController();
      const timeout = options?.timeout ?? 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
              window.location.href = '/login';
            }
          }
          const body = await response.json().catch(() => ({}));
          throw ApiClientError.fromResponse(response, body);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new ApiClientError('No stream body', 0, 'STREAM_ERROR');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Flush decoder and process remaining buffer
            buffer += decoder.decode();
            if (buffer.trim() && buffer.startsWith('data: ')) {
              const payload = buffer.slice(6);
              if (payload !== '[DONE]') {
                try {
                  const parsed = JSON.parse(payload);
                  if (parsed.error) throw new ApiClientError(parsed.error, 500, 'STREAM_ERROR');
                  if (parsed.token) yield parsed.token;
                } catch (e) {
                  if (e instanceof ApiClientError) throw e;
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') return;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) throw new ApiClientError(parsed.error, 500, 'STREAM_ERROR');
              if (parsed.token) yield parsed.token;
            } catch (e) {
              if (e instanceof ApiClientError) throw e;
            }
          }
        }
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiClientError('Stream timeout', 408, 'TIMEOUT');
        }
        throw new ApiClientError('Stream failed', 0, 'STREAM_ERROR');
      } finally {
        clearTimeout(timeoutId);
      }
    },
  },

  // Sessions
  sessions: {
    create: (data: { mode: string; level: string; userId?: string }) =>
      apiClient.post<{ sessionId: string; userId: string }>('/api/sessions', data),

    get: (id: string) =>
      apiClient.get<Record<string, unknown>>(`/api/sessions/${id}`),

    update: (id: string, data: unknown) =>
      apiClient.patch<Record<string, unknown>>(`/api/sessions/${id}`, data),

    list: (params: { userId: string; page?: number; pageSize?: number }) =>
      apiClient.get<PaginatedResponse<unknown>>('/api/sessions', { params }),
  },

  // Stats
  stats: {
    overview: (params: { userId: string; period?: string }) =>
      apiClient.get<{
        totalSessions: number;
        totalDuration: number;
        averageScore: number;
        wordsLearned: number;
        totalFillerWords: number;
        avgPronunciation: number;
        errorBreakdown: Record<string, number>;
        weeklyChange: number;
      }>('/api/stats', { params }),

    progress: (params: { userId: string; period?: string }) =>
      apiClient.get<{ data: Array<Record<string, unknown>>; period: string }>('/api/stats/progress', { params }),
  },

  // Vocabulary
  vocabulary: {
    save: (data: { userId: string; word: string; context: string; source: string }) =>
      apiClient.post<Record<string, unknown>>('/api/vocabulary', data),

    list: (params: { userId: string; search?: string; source?: string }) =>
      apiClient.get<PaginatedResponse<unknown>>('/api/vocabulary', { params }),

    update: (id: string, data: { definition?: string; mastery?: number }) =>
      apiClient.patch<Record<string, unknown>>(`/api/vocabulary/${id}`, data),

    getReviewWords: (limit?: number) =>
      apiClient.get<{ words: ReviewWord[]; stats: ReviewStats }>('/api/vocabulary/review', {
        params: limit ? { limit } : undefined,
      }),

    submitReview: (id: string, correct: boolean) =>
      apiClient.patch<{ id: string; word: string; mastery: number; reviewedAt: string | null }>(
        `/api/vocabulary/${id}/review`, { correct }
      ),
  },

  // Streaks
  streaks: {
    get: () => apiClient.get<StreakData>('/api/streaks'),
    updateGoal: (dailyGoalMinutes: number) =>
      apiClient.patch<{ dailyGoalMinutes: number }>('/api/streaks', { dailyGoalMinutes }),
  },

  // Achievements
  achievements: {
    list: () => apiClient.get<{ unlocked: AchievementItem[]; locked: AchievementItem[] }>('/api/achievements'),
    check: () => apiClient.post<{ newlyUnlocked: string[] }>('/api/achievements/check'),
  },

  // Messages
  messages: {
    save: (data: {
      sessionId: string;
      role: string;
      content: string;
      corrections?: unknown;
      pronunciationScore?: number;
      fillerWordCount?: number;
    }) => apiClient.post<Record<string, unknown>>('/api/messages', data),
  },

  // Admin
  admin: {
    getStats: () =>
      apiClient.get<{
        users: { total: number; pending: number; approved: number; rejected: number; newThisWeek: number; newThisMonth: number };
        activity: { totalSessions: number; sessionsThisWeek: number; activeUsersThisWeek: number; totalPracticeDuration: number; averageScore: number; totalVocabularyLearned: number };
      }>('/api/admin/stats'),

    getUsers: (params?: { status?: string; search?: string; page?: number; pageSize?: number }) =>
      apiClient.get<{ data: Array<Record<string, unknown>>; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(
        '/api/admin/users', { params }
      ),

    getUser: (id: string) =>
      apiClient.get<Record<string, unknown>>(`/api/admin/users/${id}`),

    updateUserStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
      apiClient.patch<{ id: string; name: string; email: string; status: string }>(
        `/api/admin/users/${id}`, { status }
      ),
  },
};

export { createApiClient };
export type { ApiClientConfig, RequestOptions };
