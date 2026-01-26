import { getDatabase } from '../../memory/database';
import { createLogger } from '../../lib/logger';
import { DatabaseError } from '../errors';
import { User, RefreshToken } from './types';

const logger = createLogger({ module: 'auth-persistence' });

let createUserStmt: any = null;
let getUserByIdStmt: any = null;
let getUserByUsernameStmt: any = null;
let getUserByEmailStmt: any = null;
let createRefreshTokenStmt: any = null;
let getRefreshTokenStmt: any = null;
let revokeRefreshTokenStmt: any = null;
let deleteExpiredTokensStmt: any = null;

function initStatements(): void {
  const db = getDatabase();

  createUserStmt = db.prepare(`
    INSERT INTO users (id, email, username, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  getUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  getUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
  getUserByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?');

  createRefreshTokenStmt = db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  getRefreshTokenStmt = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?');
  revokeRefreshTokenStmt = db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?');
  deleteExpiredTokensStmt = db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?');
}

function ensureStatements(): void {
  if (!createUserStmt) {
    initStatements();
  }
}

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    password_hash: row.password_hash,
    name: row.name,
    role: row.role as 'user' | 'admin',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToRefreshToken(row: any): RefreshToken {
  return {
    id: row.id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    expires_at: row.expires_at,
    revoked: Boolean(row.revoked),
    created_at: row.created_at,
  };
}

export function createUser(user: User): void {
  ensureStatements();
  try {
    createUserStmt.run(
      user.id,
      user.email,
      user.username || null,
      user.password_hash || null,
      user.name || null,
      user.role || 'user',
      user.created_at,
      user.updated_at
    );
  } catch (error) {
    logger.error({ email: user.email, error }, 'Failed to create user');
    throw new DatabaseError('Failed to create user', error);
  }
}

export function getUserByUsername(username: string): User | null {
  ensureStatements();
  try {
    const row = getUserByUsernameStmt.get(username);
    return row ? mapRowToUser(row) : null;
  } catch (error) {
    logger.error({ username, error }, 'Failed to get user by username');
    throw new DatabaseError('Failed to get user', error);
  }
}

export function getUserByEmail(email: string): User | null {
  ensureStatements();
  try {
    const row = getUserByEmailStmt.get(email);
    return row ? mapRowToUser(row) : null;
  } catch (error) {
    logger.error({ email, error }, 'Failed to get user by email');
    throw new DatabaseError('Failed to get user', error);
  }
}

export function getUserById(id: string): User | null {
  ensureStatements();
  try {
    const row = getUserByIdStmt.get(id);
    return row ? mapRowToUser(row) : null;
  } catch (error) {
    logger.error({ userId: id, error }, 'Failed to get user by ID');
    throw new DatabaseError('Failed to get user', error);
  }
}

export function storeRefreshToken(token: RefreshToken): void {
  ensureStatements();
  try {
    createRefreshTokenStmt.run(
      token.id,
      token.user_id,
      token.token_hash,
      token.expires_at,
      token.revoked ? 1 : 0,
      token.created_at
    );
  } catch (error) {
    logger.error({ userId: token.user_id, error }, 'Failed to store refresh token');
    throw new DatabaseError('Failed to store refresh token', error);
  }
}

export function getRefreshToken(tokenHash: string): RefreshToken | null {
  ensureStatements();
  try {
    const row = getRefreshTokenStmt.get(tokenHash);
    return row ? mapRowToRefreshToken(row) : null;
  } catch (error) {
    logger.error({ error }, 'Failed to get refresh token');
    throw new DatabaseError('Failed to get refresh token', error);
  }
}

export function revokeRefreshToken(id: string): void {
  ensureStatements();
  try {
    revokeRefreshTokenStmt.run(id);
  } catch (error) {
    logger.error({ tokenId: id, error }, 'Failed to revoke refresh token');
    throw new DatabaseError('Failed to revoke refresh token', error);
  }
}

export function cleanupExpiredTokens(): void {
  ensureStatements();
  try {
    deleteExpiredTokensStmt.run(Date.now());
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired tokens');
  }
}

export function resetStatements(): void {
  createUserStmt = null;
  getUserByIdStmt = null;
  getUserByUsernameStmt = null;
  getUserByEmailStmt = null;
  createRefreshTokenStmt = null;
  getRefreshTokenStmt = null;
  revokeRefreshTokenStmt = null;
  deleteExpiredTokensStmt = null;
}
