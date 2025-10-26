export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FileUploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface QRCodeData {
  userId: string;
  estateId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  imageUrl?: string;
}

export interface EstateScopedEntity {
  estate_id: string;
}

export interface UserScopedEntity {
  user_id: string;
}

export interface TimestampedEntity {
  created_at: Date;
  updated_at: Date;
}

export interface SoftDeletableEntity {
  deleted_at?: Date;
}
