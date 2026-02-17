// Database Models
export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  systemPrompt: string;
  voiceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Transcript {
  id: string;
  agentId: string;
  userId?: string;
  content: string;
  duration: number;
  createdAt: Date;
}

// Authentication
export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  message?: string;
  data?: T;
}
