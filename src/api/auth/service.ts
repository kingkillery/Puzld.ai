import { randomUUID, randomBytes, createHash } from 'crypto';
import bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';
import { User, AuthTokens } from './types';
import * as persistence from './persistence';
import { AppError } from '../errors';

const SALT_ROUNDS = 10;
// 7 days for refresh token
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function generateRefreshTokenString(): string {
  return randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function registerUser(username: string, password: string): Promise<User> {
  // Legacy registration - treat username as email if possible, or just username
  const existing = persistence.getUserByUsername(username) || persistence.getUserByEmail(username);
  if (existing) {
    throw new AppError('Username/Email already exists', 409, 'USER_EXISTS');
  }

  const passwordHash = await hashPassword(password);
  const now = Date.now();
  const user: User = {
    id: randomUUID(),
    username,
    email: username.includes('@') ? username : `${username}@local.dev`, // Fallback for legacy
    password_hash: passwordHash,
    role: 'user',
    created_at: now,
    updated_at: now,
  };

  persistence.createUser(user);
  return user;
}

export async function loginUser(username: string, password: string, fastify: FastifyInstance): Promise<AuthTokens> {
  const user = persistence.getUserByUsername(username) || persistence.getUserByEmail(username);
  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
  }

  return generateTokens(user, fastify);
}

export async function refreshTokens(refreshToken: string, fastify: FastifyInstance): Promise<AuthTokens> {
  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = persistence.getRefreshToken(tokenHash);

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  if (storedToken.revoked) {
    // Revoked token usage - potential theft!
    throw new AppError('Token revoked', 401, 'TOKEN_REVOKED');
  }

  if (Date.now() > storedToken.expires_at) {
    throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Revoke the used refresh token (Rotation)
  persistence.revokeRefreshToken(storedToken.id);

  const user = persistence.getUserById(storedToken.user_id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return generateTokens(user, fastify);
}

async function generateTokens(user: User, fastify: FastifyInstance): Promise<AuthTokens> {
  // Access Token (JWT)
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });

  // Refresh Token (Opaque)
  const refreshTokenString = generateRefreshTokenString();
  const refreshTokenHash = hashRefreshToken(refreshTokenString);
  const now = Date.now();

  persistence.storeRefreshToken({
    id: randomUUID(),
    user_id: user.id,
    token_hash: refreshTokenHash,
    expires_at: now + REFRESH_TOKEN_EXPIRY,
    revoked: false,
    created_at: now,
  });

  return {
    accessToken,
    refreshToken: refreshTokenString,
    expiresIn: 900, // 15 mins
  };
}
