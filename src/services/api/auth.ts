import { apiClient } from './client';

export interface AuthRegisterPayload {
  email: string;
  password: string;
  name?: string;
  full_name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;
  activity_level?: string;
}

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    name?: string;
    role?: string;
    created_at?: string;
  };
}

export const AuthApi = {
  async register(payload: AuthRegisterPayload): Promise<AuthResponse> {
    const body = {
      ...payload,
      full_name: payload.full_name || payload.name || 'Athlete',
    };
    const res = await apiClient.post<AuthResponse>('/auth/register', body, { skipAuth: true });
    if (res.access_token) {
      apiClient.setAuthToken(res.access_token);
    }
    return res;
  },

  async login(payload: AuthLoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', payload, { skipAuth: true });
    if (res.access_token) {
      apiClient.setAuthToken(res.access_token);
    }
    return res;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true });
    if (res.access_token) {
      apiClient.setAuthToken(res.access_token);
    }
    return res;
  },

  async getMe(): Promise<any> {
    return apiClient.get('/auth/me');
  },

  logout(): void {
    apiClient.setAuthToken(null);
  },
};
