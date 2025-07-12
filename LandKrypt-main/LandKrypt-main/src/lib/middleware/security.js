// Security Middleware System
// Comprehensive security measures for production deployment

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimitError, ValidationError } = require('../utils/error-handler');
const logger = require('../utils/logger');

// Rate limiting configurations
const RATE_LIMITS = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Strict rate limit for sensitive operations
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many sensitive requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Authentication rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  },
  
  // NFT minting rate limit
  minting: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 mints per hour
    message: 'Too many minting requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.logSecurityEvent(`CORS violation from origin: ${origin}`, 'warn');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Helmet configuration for security headers
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for Web3 compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

class SecurityMiddleware {
  // Request ID middleware for tracking
  static requestId() {
    return (req, res, next) => {
      req.id = require('crypto').randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    };
  }

  // Request logging middleware
  static requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logAPIRequest(
          req.method,
          req.originalUrl,
          res.statusCode,
          duration,
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.id
          }
        );
      });
      
      next();
    };
  }

  // IP whitelist middleware
  static ipWhitelist(allowedIPs = []) {
    return (req, res, next) => {
      if (allowedIPs.length === 0) return next();
      
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        logger.logSecurityEvent(`IP not whitelisted: ${clientIP}`, 'warn', {
          ip: clientIP,
          url: req.originalUrl
        });
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
    };
  }

  // API key validation middleware
  static apiKeyAuth(requiredKey = null) {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      const expectedKey = requiredKey || process.env.API_KEY;
      
      if (!expectedKey) {
        logger.warn('API key authentication enabled but no key configured');
        return next();
      }
      
      if (!apiKey || apiKey !== expectedKey) {
        logger.logSecurityEvent('Invalid API key attempt', 'warn', {
          ip: req.ip,
          providedKey: apiKey ? 'provided' : 'missing',
          url: req.originalUrl
        });
        return res.status(401).json({ error: 'Invalid or missing API key' });
      }
      
      next();
    };
  }

  // Wallet signature verification middleware
  static walletAuth() {
    return async (req, res, next) => {
      try {
        const { signature, message, address } = req.body;
        
        if (!signature || !message || !address) {
          throw new ValidationError('Missing signature, message, or address');
        }
        
        // Verify the signature (simplified - implement proper verification)
        const { ethers } = require('ethers');
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          logger.logSecurityEvent('Invalid wallet signature', 'warn', {
            providedAddress: address,
            recoveredAddress,
            ip: req.ip
          });
          throw new ValidationError('Invalid signature');
        }
        
        req.user = { address: address.toLowerCase() };
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Input sanitization middleware
  static sanitizeInput() {
    return (req, res, next) => {
      const { Validator } = require('../utils/validation');
      
      if (req.body && typeof req.body === 'object') {
        req.body = Validator.sanitizeObject(req.body);
      }
      
      if (req.query && typeof req.query === 'object') {
        req.query = Validator.sanitizeObject(req.query);
      }
      
      next();
    };
  }

  // Content type validation
  static validateContentType(allowedTypes = ['application/json']) {
    return (req, res, next) => {
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }
      
      const contentType = req.get('Content-Type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({ 
          error: 'Unsupported Media Type',
          allowed: allowedTypes
        });
      }
      
      next();
    };
  }

  // Request size limit
  static requestSizeLimit(limit = '10mb') {
    return require('express').json({ limit });
  }

  // Suspicious activity detection
  static suspiciousActivityDetection() {
    const suspiciousPatterns = [
      /(\<script\>|\<\/script\>)/gi, // Script tags
      /(javascript:|data:)/gi, // Dangerous protocols
      /(union|select|insert|delete|drop|create|alter)/gi, // SQL injection
      /(\.\.|\/etc\/|\/proc\/)/gi, // Path traversal
      /(eval\(|exec\(|system\()/gi // Code execution
    ];
    
    return (req, res, next) => {
      const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.originalUrl;
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(checkString)) {
          logger.logSecurityEvent('Suspicious activity detected', 'high', {
            pattern: pattern.toString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            body: req.body,
            query: req.query
          });
          
          return res.status(400).json({ error: 'Suspicious activity detected' });
        }
      }
      
      next();
    };
  }

  // Blockchain transaction validation
  static validateTransaction() {
    return async (req, res, next) => {
      try {
        const { txHash } = req.body;
        
        if (txHash) {
          const { Validator } = require('../utils/validation');
          Validator.transactionHash(txHash, 'transaction hash');
          
          // Additional validation: check if transaction exists and is confirmed
          // This would require blockchain provider integration
          // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
          // const tx = await provider.getTransaction(txHash);
          // if (!tx) throw new ValidationError('Transaction not found');
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Environment-based security
  static environmentSecurity() {
    return (req, res, next) => {
      // Add security headers based on environment
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      }
      
      // Remove sensitive headers
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      
      next();
    };
  }

  // Create rate limiter with custom options
  static createRateLimit(options = {}) {
    const config = { ...RATE_LIMITS.general, ...options };
    
    return rateLimit({
      ...config,
      handler: (req, res) => {
        logger.logSecurityEvent('Rate limit exceeded', 'warn', {
          ip: req.ip,
          url: req.originalUrl,
          limit: config.max,
          window: config.windowMs
        });
        
        res.status(429).json({
          error: 'Too Many Requests',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }
    });
  }

  // Complete security middleware stack
  static createSecurityStack() {
    return [
      // Basic security headers
      helmet(helmetOptions),
      
      // CORS
      cors(corsOptions),
      
      // Request tracking
      this.requestId(),
      this.requestLogger(),
      
      // Environment-based security
      this.environmentSecurity(),
      
      // Input validation and sanitization
      this.validateContentType(),
      this.sanitizeInput(),
      this.suspiciousActivityDetection(),
      
      // Rate limiting
      this.createRateLimit(RATE_LIMITS.general)
    ];
  }
}

module.exports = {
  SecurityMiddleware,
  RATE_LIMITS,
  corsOptions,
  helmetOptions
};
