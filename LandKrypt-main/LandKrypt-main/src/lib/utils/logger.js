// Production-Ready Logging System
// Centralized logging with multiple transports and structured output

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFormat = process.env.LOG_FORMAT || 'json';
    this.logDir = path.join(process.cwd(), 'logs');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 5;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      trace: '\x1b[37m', // White
      reset: '\x1b[0m'
    };
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (this.logFormat === 'json') {
      return JSON.stringify(logEntry);
    } else {
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
  }

  writeToFile(level, formattedMessage) {
    try {
      const filename = `${level}.log`;
      const filepath = path.join(this.logDir, filename);
      
      // Check file size and rotate if necessary
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(filepath);
        }
      }
      
      fs.appendFileSync(filepath, formattedMessage + '\n');
      
      // Also write to combined log
      const combinedPath = path.join(this.logDir, 'combined.log');
      fs.appendFileSync(combinedPath, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  rotateLogFile(filepath) {
    try {
      const dir = path.dirname(filepath);
      const basename = path.basename(filepath, '.log');
      
      // Remove oldest backup if it exists
      const oldestBackup = path.join(dir, `${basename}.${this.maxFiles}.log`);
      if (fs.existsSync(oldestBackup)) {
        fs.unlinkSync(oldestBackup);
      }
      
      // Rotate existing backups
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const currentBackup = path.join(dir, `${basename}.${i}.log`);
        const nextBackup = path.join(dir, `${basename}.${i + 1}.log`);
        
        if (fs.existsSync(currentBackup)) {
          fs.renameSync(currentBackup, nextBackup);
        }
      }
      
      // Move current log to backup
      const firstBackup = path.join(dir, `${basename}.1.log`);
      fs.renameSync(filepath, firstBackup);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  writeToConsole(level, message, meta = {}) {
    if (process.env.NODE_ENV === 'test') return;
    
    const color = this.colors[level] || this.colors.reset;
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}${this.colors.reset}`);
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    
    // Add context information
    const enrichedMeta = {
      ...meta,
      pid: process.pid,
      hostname: require('os').hostname(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    const formattedMessage = this.formatMessage(level, message, enrichedMeta);
    
    // Write to console
    this.writeToConsole(level, message, enrichedMeta);
    
    // Write to file
    this.writeToFile(level, formattedMessage);
    
    // Send to external services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalServices(level, message, enrichedMeta);
    }
  }

  async sendToExternalServices(level, message, meta) {
    // Send to Sentry for errors
    if (level === 'error' && process.env.SENTRY_DSN) {
      try {
        // Sentry integration would go here
        // const Sentry = require('@sentry/node');
        // Sentry.captureException(new Error(message), { extra: meta });
      } catch (error) {
        console.error('Failed to send to Sentry:', error);
      }
    }
    
    // Send to other monitoring services
    if (process.env.MONITORING_WEBHOOK) {
      try {
        const axios = require('axios');
        await axios.post(process.env.MONITORING_WEBHOOK, {
          level,
          message,
          meta,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to send to monitoring service:', error);
      }
    }
  }

  // Convenience methods
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  // Structured logging methods
  logTransaction(txHash, action, meta = {}) {
    this.info(`Transaction ${action}`, {
      txHash,
      action,
      type: 'transaction',
      ...meta
    });
  }

  logUserAction(userAddress, action, meta = {}) {
    this.info(`User action: ${action}`, {
      userAddress,
      action,
      type: 'user_action',
      ...meta
    });
  }

  logAPIRequest(method, path, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      type: 'api_request',
      ...meta
    });
  }

  logDatabaseQuery(query, duration, meta = {}) {
    this.debug('Database query executed', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      type: 'database_query',
      ...meta
    });
  }

  logError(error, context = {}) {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      type: 'error',
      ...context
    });
  }

  // Performance logging
  startTimer(label) {
    const start = process.hrtime.bigint();
    return {
      end: (meta = {}) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        this.debug(`Timer ${label} completed`, {
          label,
          duration: `${duration.toFixed(2)}ms`,
          type: 'performance',
          ...meta
        });
        return duration;
      }
    };
  }

  // Health check logging
  logHealthCheck(service, status, meta = {}) {
    const level = status === 'healthy' ? 'info' : 'warn';
    this.log(level, `Health check: ${service} is ${status}`, {
      service,
      status,
      type: 'health_check',
      ...meta
    });
  }

  // Security logging
  logSecurityEvent(event, severity = 'warn', meta = {}) {
    this.log(severity, `Security event: ${event}`, {
      event,
      severity,
      type: 'security',
      ...meta
    });
  }

  // Cleanup old logs
  cleanup() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      files.forEach(file => {
        const filepath = path.join(this.logDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          this.info(`Cleaned up old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to cleanup old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Cleanup old logs on startup
if (process.env.NODE_ENV === 'production') {
  logger.cleanup();
}

module.exports = logger;
