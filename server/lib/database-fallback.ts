/**
 * Fallback database service using direct SQLite when Prisma is not available
 */
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export class DatabaseFallback {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DATABASE_URL?.replace('file:', '') || 
                  path.join(process.cwd(), 'dev.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Auth User operations
  async findUserByEmail(email: string) {
    return this.get(
      'SELECT * FROM auth_users WHERE email = ?',
      [email]
    );
  }

  async createUser(userData: {
    email: string;
    displayName: string;
    passwordHash: string;
    role?: string;
  }) {
    const { email, displayName, passwordHash, role = 'user' } = userData;
    const result = await this.run(
      `INSERT INTO auth_users (id, email, displayName, passwordHash, role, emailVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [this.generateId(), email, displayName, passwordHash, role, false]
    );
    return result;
  }

  async updateUser(id: string, updates: any) {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    return this.run(
      `UPDATE auth_users SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`,
      [...values, id]
    );
  }

  // Session operations
  async createSession(sessionData: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { userId, tokenHash, expiresAt, ipAddress, userAgent } = sessionData;
    return this.run(
      `INSERT INTO auth_sessions (id, userId, tokenHash, expiresAt, ipAddress, userAgent, isActive, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [this.generateId(), userId, tokenHash, expiresAt.toISOString(), ipAddress, userAgent, true]
    );
  }

  async findActiveSession(tokenHash: string) {
    return this.get(
      'SELECT * FROM auth_sessions WHERE tokenHash = ? AND isActive = 1 AND expiresAt > datetime("now")',
      [tokenHash]
    );
  }

  async deactivateUserSessions(userId: string) {
    return this.run(
      'UPDATE auth_sessions SET isActive = 0 WHERE userId = ? AND isActive = 1',
      [userId]
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async close() {
    return new Promise<void>((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  }
}

export const dbFallback = new DatabaseFallback();