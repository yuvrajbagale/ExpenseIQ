export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
