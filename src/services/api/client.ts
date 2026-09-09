import { Platform } from 'react-native';

export class ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;

  constructor(message: string, status: number = 500, data: any = null, isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  skipAuth?: boolean;
}

class ApiClient {
  private defaultPort = 8000;
  private defaultTimeoutMs = 10000;
  private defaultRetries = 2;
  private authToken: string | null = null;

  /**
   * Determine the optimal local backend host:
   * - EXPO_PUBLIC_API_URL if configured
   * - Android Emulator: http://10.0.2.2:8000
   * - Web / iOS Simulator: http://localhost:8000
   */
  getBaseUrl(): string {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    }

    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${this.defaultPort}`;
    }

    return `http://localhost:${this.defaultPort}`;
  }

  getApiV1Url(): string {
    return `${this.getBaseUrl()}/api/v1`;
  }

  /**
   * Set or clear active authorization token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Centralized HTTP Request Dispatcher with retry strategy and timeout
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeoutMs = this.defaultTimeoutMs,
      retries = this.defaultRetries,
      skipAuth = false,
      headers = {},
      ...fetchOptions
    } = options;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.getApiV1Url()}${cleanEndpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth && this.authToken) {
      requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    let attempt = 0;
    let lastError: any = null;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let responseData: any = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        if (!response.ok) {
          const errorMessage =
            (typeof responseData === 'object' && responseData !== null && (responseData.detail || responseData.message)) ||
            `HTTP ${response.status}: Request to ${cleanEndpoint} failed`;

          // If server error 5xx, retry
          if (response.status >= 500 && attempt < retries) {
            attempt++;
            await this.sleep(300 * Math.pow(2, attempt - 1));
            continue;
          }

          throw new ApiError(errorMessage, response.status, responseData, false);
        }

        return responseData as T;
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (err instanceof ApiError) {
          throw err;
        }

        const isAbort = err.name === 'AbortError';
        const isNetwork = !isAbort;
        lastError = new ApiError(
          isAbort ? `Request timeout after ${timeoutMs}ms` : `Network error: ${err.message || 'Server unreachable'}`,
          isAbort ? 408 : 0,
          null,
          isNetwork
        );

        if (attempt < retries) {
          attempt++;
          await this.sleep(300 * Math.pow(2, attempt - 1));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new ApiError('Unexpected API request failure', 500);
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
