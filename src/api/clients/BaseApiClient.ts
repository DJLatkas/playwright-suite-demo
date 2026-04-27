import { APIRequestContext } from '@playwright/test';

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

export class BaseApiClient {
  protected readonly request: APIRequestContext;
  protected readonly baseURL: string;
  private token: string | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  protected buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  protected async get<T>(path: string): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseURL}${path}`, {
      headers: this.buildHeaders(),
    });
    return {
      status: response.status(),
      body: await response.json() as T,
      headers: response.headers() as Record<string, string>,
    };
  }

  protected async post<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseURL}${path}`, {
      headers: this.buildHeaders(),
      data: JSON.stringify(data),
    });
    return {
      status: response.status(),
      body: await response.json() as T,
      headers: response.headers() as Record<string, string>,
    };
  }

  protected async put<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseURL}${path}`, {
      headers: this.buildHeaders(),
      data: JSON.stringify(data),
    });
    return {
      status: response.status(),
      body: await response.json() as T,
      headers: response.headers() as Record<string, string>,
    };
  }

  protected async delete<T>(path: string): Promise<ApiResponse<T>> {
    const response = await this.request.delete(`${this.baseURL}${path}`, {
      headers: this.buildHeaders(),
    });
    return {
      status: response.status(),
      body: await response.json() as T,
      headers: response.headers() as Record<string, string>,
    };
  }
}
