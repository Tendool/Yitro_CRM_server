/**
 * HTTP Logging Middleware for Express
 * Provides structured request/response logging with performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { httpLogger } from './logger.js';

export interface RequestLog {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  body?: any;
  params?: any;
  query?: any;
  userId?: string;
  startTime: number;
}

// Extend Express Request type to include logging context
declare global {
  namespace Express {
    interface Request {
      logContext?: RequestLog;
    }
  }
}

/**
 * HTTP request/response logging middleware
 */
export function httpLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Create request log context
  req.logContext = {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    startTime,
  };

  // For API requests, log more details
  if (req.url.startsWith('/api/')) {
    req.logContext.params = req.params;
    req.logContext.query = req.query;
    
    // Log request body for non-GET requests (excluding sensitive data)
    if (req.method !== 'GET' && req.body) {
      const sanitizedBody = sanitizeRequestBody(req.body);
      req.logContext.body = sanitizedBody;
    }

    httpLogger.info('API Request Started', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      params: req.params,
      query: req.query,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
    });
  }

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    
    // Log response for API requests
    if (req.url.startsWith('/api/')) {
      const responseSize = chunk ? (typeof chunk === 'string' ? chunk.length : JSON.stringify(chunk).length) : 0;
      
      httpLogger.info('API Request Completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        responseSize,
        userId: req.logContext?.userId,
      });

      // Log errors separately
      if (res.statusCode >= 400) {
        httpLogger.warn('API Request Error', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userId: req.logContext?.userId,
        });
      }
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...body };

  for (const field of Object.keys(sanitized)) {
    const fieldLower = field.toLowerCase();
    if (sensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Middleware to add user context to logs after authentication
 */
export function addUserContextToLogs(req: Request, res: Response, next: NextFunction): void {
  // If user is authenticated, add to log context
  if ((req as any).user && req.logContext) {
    req.logContext.userId = (req as any).user.id || (req as any).user.email;
  }
  next();
}

/**
 * Error logging middleware - should be added after all other middleware
 */
export function errorLoggingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const duration = req.logContext ? Date.now() - req.logContext.startTime : 0;

  httpLogger.error('Request Error', error, {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode || 500,
    duration,
    userId: req.logContext?.userId,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  });

  next(error);
}