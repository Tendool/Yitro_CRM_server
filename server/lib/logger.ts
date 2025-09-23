/**
 * Structured logging utility for Yitro CRM Server
 * Provides different log levels and structured output for production deployment
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private context: string;

  constructor(context: string = 'APP', logLevel?: LogLevel) {
    this.context = context;
    this.logLevel = logLevel ?? this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: this.context,
    };

    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    // In production, we might want to write to files or external logging services
    // For now, using console with appropriate methods for log levels
    switch (entry.level) {
      case 'ERROR':
        console.error(logString);
        break;
      case 'WARN':
        console.warn(logString);
        break;
      case 'INFO':
        console.info(logString);
        break;
      case 'DEBUG':
        console.debug(logString);
        break;
      default:
        console.log(logString);
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.formatLogEntry(LogLevel.DEBUG, message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.formatLogEntry(LogLevel.INFO, message, metadata));
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.formatLogEntry(LogLevel.WARN, message, metadata));
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.formatLogEntry(LogLevel.ERROR, message, metadata, error));
    }
  }

  // Convenience methods for common logging scenarios
  http(method: string, url: string, statusCode?: number, duration?: number, metadata?: Record<string, any>): void {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      ...metadata,
    });
  }

  auth(action: string, email?: string, success: boolean = true, metadata?: Record<string, any>): void {
    this.info('Authentication Event', {
      action,
      email: email ? this.maskEmail(email) : undefined,
      success,
      ...metadata,
    });
  }

  database(operation: string, table?: string, duration?: number, metadata?: Record<string, any>): void {
    this.debug('Database Operation', {
      operation,
      table,
      duration,
      ...metadata,
    });
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  // Create child logger with additional context
  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`, this.logLevel);
  }
}

// Create default logger instances for common use cases
export const logger = new Logger('SERVER');
export const authLogger = new Logger('AUTH');
export const dbLogger = new Logger('DATABASE');
export const httpLogger = new Logger('HTTP');

// Export the Logger class for creating custom loggers
export { Logger };