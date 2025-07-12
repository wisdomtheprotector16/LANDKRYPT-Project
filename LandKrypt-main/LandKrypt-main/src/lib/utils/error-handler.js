// Production Error Handling System
// Centralized error handling with classification, recovery, and reporting

const logger = require('./logger');

// Error types and classifications
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  BLOCKCHAIN: 'BLOCKCHAIN_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  NETWORK: 'NETWORK_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR'
};

const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AppError extends Error {
  constructor(message, type = ERROR_TYPES.INTERNAL, statusCode = 500, isOperational = true) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.severity = this.determineSeverity(type, statusCode);
    
    Error.captureStackTrace(this, this.constructor);
  }

  determineSeverity(type, statusCode) {
    if (statusCode >= 500) return ERROR_SEVERITY.HIGH;
    if (type === ERROR_TYPES.BLOCKCHAIN) return ERROR_SEVERITY.HIGH;
    if (type === ERROR_TYPES.DATABASE) return ERROR_SEVERITY.MEDIUM;
    if (statusCode >= 400) return ERROR_SEVERITY.MEDIUM;
    return ERROR_SEVERITY.LOW;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, ERROR_TYPES.VALIDATION, 400);
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, ERROR_TYPES.AUTHENTICATION, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, ERROR_TYPES.AUTHORIZATION, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, ERROR_TYPES.NOT_FOUND, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, ERROR_TYPES.CONFLICT, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, ERROR_TYPES.RATE_LIMIT, 429);
  }
}

class BlockchainError extends AppError {
  constructor(message, txHash = null) {
    super(message, ERROR_TYPES.BLOCKCHAIN, 500);
    this.txHash = txHash;
  }
}

class DatabaseError extends AppError {
  constructor(message, query = null) {
    super(message, ERROR_TYPES.DATABASE, 500);
    this.query = query;
  }
}

class ExternalAPIError extends AppError {
  constructor(message, service = null, statusCode = 500) {
    super(message, ERROR_TYPES.EXTERNAL_API, statusCode);
    this.service = service;
  }
}

class TimeoutError extends AppError {
  constructor(operation = 'Operation', timeout = null) {
    super(`${operation} timed out`, ERROR_TYPES.TIMEOUT, 408);
    this.timeout = timeout;
  }
}

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
  }

  // Main error handling method
  handle(error, context = {}) {
    // Ensure error is an AppError instance
    const appError = this.normalizeError(error);
    
    // Log the error
    this.logError(appError, context);
    
    // Track error for monitoring
    this.trackError(appError);
    
    // Check for circuit breaker patterns
    this.checkCircuitBreaker(appError);
    
    // Send alerts for critical errors
    if (appError.severity === ERROR_SEVERITY.CRITICAL) {
      this.sendAlert(appError, context);
    }
    
    return appError;
  }

  normalizeError(error) {
    if (error instanceof AppError) {
      return error;
    }
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }
    
    if (error.name === 'CastError' || error.name === 'MongoError') {
      return new DatabaseError(error.message);
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ExternalAPIError(error.message);
    }
    
    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError();
    }
    
    // Default to internal error
    return new AppError(
      error.message || 'An unexpected error occurred',
      ERROR_TYPES.INTERNAL,
      500,
      false
    );
  }

  logError(error, context) {
    const logData = {
      error: error.toJSON(),
      context,
      userAgent: context.userAgent,
      ip: context.ip,
      userId: context.userId,
      requestId: context.requestId
    };
    
    if (error.severity === ERROR_SEVERITY.CRITICAL || error.severity === ERROR_SEVERITY.HIGH) {
      logger.error(error.message, logData);
    } else {
      logger.warn(error.message, logData);
    }
  }

  trackError(error) {
    const key = `${error.type}:${error.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
    
    // Clean up old counts periodically
    if (this.errorCounts.size > 1000) {
      this.cleanupErrorCounts();
    }
  }

  cleanupErrorCounts() {
    // Keep only the most recent 500 error types
    const entries = Array.from(this.errorCounts.entries());
    entries.sort((a, b) => b[1] - a[1]);
    
    this.errorCounts.clear();
    entries.slice(0, 500).forEach(([key, count]) => {
      this.errorCounts.set(key, count);
    });
  }

  checkCircuitBreaker(error) {
    if (error.type === ERROR_TYPES.EXTERNAL_API || error.type === ERROR_TYPES.DATABASE) {
      const service = error.service || 'unknown';
      const failures = this.circuitBreakers.get(service) || 0;
      
      this.circuitBreakers.set(service, failures + 1);
      
      // Open circuit breaker after 5 failures
      if (failures >= 5) {
        logger.warn(`Circuit breaker opened for service: ${service}`, {
          failures,
          type: 'circuit_breaker'
        });
      }
    }
  }

  async sendAlert(error, context) {
    try {
      // Send to monitoring service
      if (process.env.ALERT_WEBHOOK) {
        const axios = require('axios');
        await axios.post(process.env.ALERT_WEBHOOK, {
          error: error.toJSON(),
          context,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        });
      }
      
      // Send to Slack/Discord if configured
      if (process.env.SLACK_WEBHOOK) {
        await this.sendSlackAlert(error, context);
      }
    } catch (alertError) {
      logger.error('Failed to send alert', { error: alertError.message });
    }
  }

  async sendSlackAlert(error, context) {
    try {
      const axios = require('axios');
      const message = {
        text: `🚨 Critical Error in LandKrypt`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Error Type', value: error.type, short: true },
            { title: 'Message', value: error.message, short: false },
            { title: 'Environment', value: process.env.NODE_ENV, short: true },
            { title: 'Timestamp', value: error.timestamp, short: true }
          ]
        }]
      };
      
      await axios.post(process.env.SLACK_WEBHOOK, message);
    } catch (slackError) {
      logger.error('Failed to send Slack alert', { error: slackError.message });
    }
  }

  // Express.js error middleware
  expressMiddleware() {
    return (error, req, res, next) => {
      const context = {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        requestId: req.id
      };
      
      const appError = this.handle(error, context);
      
      // Don't expose internal errors in production
      const isProduction = process.env.NODE_ENV === 'production';
      const shouldExposeError = appError.isOperational || !isProduction;
      
      res.status(appError.statusCode).json({
        success: false,
        error: {
          type: appError.type,
          message: shouldExposeError ? appError.message : 'Internal server error',
          ...(shouldExposeError && { details: appError.toJSON() })
        },
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      });
    };
  }

  // Next.js API error handler
  nextApiHandler(error, req, res) {
    const context = {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.connection.remoteAddress
    };
    
    const appError = this.handle(error, context);
    
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldExposeError = appError.isOperational || !isProduction;
    
    res.status(appError.statusCode).json({
      success: false,
      error: {
        type: appError.type,
        message: shouldExposeError ? appError.message : 'Internal server error'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Async wrapper for route handlers
  asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Process-level error handlers
  setupProcessHandlers() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      
      // Graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { 
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString()
      });
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorTypes: Object.fromEntries(this.errorCounts),
      circuitBreakers: Object.fromEntries(this.circuitBreakers)
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Setup process handlers
errorHandler.setupProcessHandlers();

module.exports = {
  ErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BlockchainError,
  DatabaseError,
  ExternalAPIError,
  TimeoutError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  errorHandler
};
