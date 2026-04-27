import { APIRequestContext } from '@playwright/test';
import { BaseApiClient, ApiResponse } from '../clients/BaseApiClient';

// ── Domain types ──────────────────────────────────────────────────────────────

export type UserRole   = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface AuthResponse {
  token: string;
  username: string;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ReportsSummary {
  total: number;
  active: number;
  inactive: number;
  byRole: { Admin: number; Editor: number; Viewer: number };
}

export interface ActivityEntry {
  id: number;
  action: 'add' | 'edit' | 'delete' | 'toggle';
  userName: string;
  timestamp: string;
}

// ── API client ────────────────────────────────────────────────────────────────

export class UsersApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async health(): Promise<ApiResponse<HealthResponse>> {
    return this.get<HealthResponse>('/api/health');
  }

  async login(username: string, password: string): Promise<ApiResponse<AuthResponse & ErrorResponse>> {
    return this.post<AuthResponse & ErrorResponse>('/api/auth/login', { username, password });
  }

  async logout(): Promise<ApiResponse<MessageResponse>> {
    return this.post<MessageResponse>('/api/auth/logout', {});
  }

  async getUsers(): Promise<ApiResponse<UsersListResponse>> {
    return this.get<UsersListResponse>('/api/users');
  }

  async createUser(user: Omit<User, 'id'>): Promise<ApiResponse<User & ErrorResponse>> {
    return this.post<User & ErrorResponse>('/api/users', user);
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<ApiResponse<User & ErrorResponse>> {
    return this.put<User & ErrorResponse>(`/api/users/${id}`, updates);
  }

  async deleteUser(id: number): Promise<ApiResponse<MessageResponse & ErrorResponse>> {
    return this.delete<MessageResponse & ErrorResponse>(`/api/users/${id}`);
  }

  async getReportsSummary(): Promise<ApiResponse<ReportsSummary>> {
    return this.get<ReportsSummary>('/api/reports/summary');
  }

  async getReportsActivity(): Promise<ApiResponse<ActivityEntry[]>> {
    return this.get<ActivityEntry[]>('/api/reports/activity');
  }
}
