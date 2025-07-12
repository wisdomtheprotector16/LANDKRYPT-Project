// Input Validation System
// Comprehensive validation for all user inputs with security focus

const { ValidationError } = require('./error-handler');

// Validation rules and patterns
const VALIDATION_PATTERNS = {
  // Ethereum address pattern
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  
  // Transaction hash pattern
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  
  // Private key pattern (64 hex characters, no 0x prefix)
  PRIVATE_KEY: /^[a-fA-F0-9]{64}$/,
  
  // Email pattern
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // URL pattern
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // IPFS hash pattern
  IPFS_HASH: /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/,
  
  // Alphanumeric with spaces
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
  
  // Safe string (letters, numbers, spaces, basic punctuation)
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  
  // Numeric string
  NUMERIC: /^\d+$/,
  
  // Decimal number
  DECIMAL: /^\d+(\.\d+)?$/
};

// Validation limits
const VALIDATION_LIMITS = {
  // String lengths
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MAX_STRING_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_NAME_LENGTH: 100,
  
  // Numeric limits
  MIN_TOKEN_ID: 1,
  MAX_TOKEN_ID: 999999999,
  MIN_PRICE: 0.000001,
  MAX_PRICE: 1000000000,
  MIN_XP: 0,
  MAX_XP: 999999999,
  
  // Array limits
  MAX_ARRAY_LENGTH: 1000,
  MAX_ATTRIBUTES_COUNT: 50,
  
  // File limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.json']
};

class Validator {
  // Basic type validations
  static isString(value, fieldName = 'field') {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    return true;
  }

  static isNumber(value, fieldName = 'field') {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
    }
    return true;
  }

  static isBoolean(value, fieldName = 'field') {
    if (typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`, fieldName);
    }
    return true;
  }

  static isArray(value, fieldName = 'field') {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    return true;
  }

  static isObject(value, fieldName = 'field') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`, fieldName);
    }
    return true;
  }

  // Required field validation
  static required(value, fieldName = 'field') {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return true;
  }

  // String validations
  static minLength(value, min, fieldName = 'field') {
    this.isString(value, fieldName);
    if (value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`, fieldName);
    }
    return true;
  }

  static maxLength(value, max, fieldName = 'field') {
    this.isString(value, fieldName);
    if (value.length > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max} characters long`, fieldName);
    }
    return true;
  }

  static pattern(value, pattern, fieldName = 'field', message = null) {
    this.isString(value, fieldName);
    if (!pattern.test(value)) {
      const defaultMessage = `${fieldName} format is invalid`;
      throw new ValidationError(message || defaultMessage, fieldName);
    }
    return true;
  }

  // Numeric validations
  static min(value, min, fieldName = 'field') {
    this.isNumber(value, fieldName);
    if (value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName);
    }
    return true;
  }

  static max(value, max, fieldName = 'field') {
    this.isNumber(value, fieldName);
    if (value > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max}`, fieldName);
    }
    return true;
  }

  static range(value, min, max, fieldName = 'field') {
    this.min(value, min, fieldName);
    this.max(value, max, fieldName);
    return true;
  }

  // Array validations
  static arrayLength(value, min, max, fieldName = 'field') {
    this.isArray(value, fieldName);
    if (value.length < min || value.length > max) {
      throw new ValidationError(`${fieldName} must contain between ${min} and ${max} items`, fieldName);
    }
    return true;
  }

  // Blockchain-specific validations
  static ethereumAddress(value, fieldName = 'address') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.ETH_ADDRESS, fieldName, 'Invalid Ethereum address format');
    return true;
  }

  static transactionHash(value, fieldName = 'transaction hash') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.TX_HASH, fieldName, 'Invalid transaction hash format');
    return true;
  }

  static privateKey(value, fieldName = 'private key') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.PRIVATE_KEY, fieldName, 'Invalid private key format');
    return true;
  }

  static tokenId(value, fieldName = 'token ID') {
    this.required(value, fieldName);
    this.isNumber(value, fieldName);
    this.range(value, VALIDATION_LIMITS.MIN_TOKEN_ID, VALIDATION_LIMITS.MAX_TOKEN_ID, fieldName);
    return true;
  }

  static price(value, fieldName = 'price') {
    this.required(value, fieldName);
    this.isNumber(value, fieldName);
    this.range(value, VALIDATION_LIMITS.MIN_PRICE, VALIDATION_LIMITS.MAX_PRICE, fieldName);
    return true;
  }

  // NFT-specific validations
  static nftName(value, fieldName = 'NFT name') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.minLength(value, 1, fieldName);
    this.maxLength(value, VALIDATION_LIMITS.MAX_NAME_LENGTH, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.SAFE_STRING, fieldName, 'NFT name contains invalid characters');
    return true;
  }

  static nftDescription(value, fieldName = 'NFT description') {
    if (value !== null && value !== undefined && value !== '') {
      this.isString(value, fieldName);
      this.maxLength(value, VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH, fieldName);
    }
    return true;
  }

  static nftAttributes(value, fieldName = 'NFT attributes') {
    if (value !== null && value !== undefined) {
      this.isArray(value, fieldName);
      this.arrayLength(value, 0, VALIDATION_LIMITS.MAX_ATTRIBUTES_COUNT, fieldName);
      
      value.forEach((attr, index) => {
        this.isObject(attr, `${fieldName}[${index}]`);
        this.required(attr.trait_type, `${fieldName}[${index}].trait_type`);
        this.required(attr.value, `${fieldName}[${index}].value`);
        this.isString(attr.trait_type, `${fieldName}[${index}].trait_type`);
      });
    }
    return true;
  }

  // File validations
  static imageFile(file, fieldName = 'image file') {
    this.required(file, fieldName);
    
    if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE) {
      throw new ValidationError(`${fieldName} size exceeds maximum limit of ${VALIDATION_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`, fieldName);
    }
    
    if (!VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ValidationError(`${fieldName} type must be one of: ${VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`, fieldName);
    }
    
    return true;
  }

  // URL and IPFS validations
  static url(value, fieldName = 'URL') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.URL, fieldName, 'Invalid URL format');
    return true;
  }

  static ipfsHash(value, fieldName = 'IPFS hash') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.IPFS_HASH, fieldName, 'Invalid IPFS hash format');
    return true;
  }

  // Email validation
  static email(value, fieldName = 'email') {
    this.required(value, fieldName);
    this.isString(value, fieldName);
    this.pattern(value, VALIDATION_PATTERNS.EMAIL, fieldName, 'Invalid email format');
    return true;
  }

  // Tier system validations
  static xpAmount(value, fieldName = 'XP amount') {
    this.required(value, fieldName);
    this.isNumber(value, fieldName);
    this.range(value, VALIDATION_LIMITS.MIN_XP, VALIDATION_LIMITS.MAX_XP, fieldName);
    return true;
  }

  static tierLevel(value, fieldName = 'tier level') {
    this.required(value, fieldName);
    this.isNumber(value, fieldName);
    this.range(value, 1, 6, fieldName);
    return true;
  }

  // Security validations
  static sanitizeString(value) {
    if (typeof value !== 'string') return value;
    
    // Remove potentially dangerous characters
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Composite validations
  static validateNFTMintData(data) {
    this.isObject(data, 'mint data');
    this.ethereumAddress(data.recipient, 'recipient');
    this.tokenId(data.tokenId, 'tokenId');
    this.nftName(data.name, 'name');
    this.nftDescription(data.description, 'description');
    this.nftAttributes(data.attributes, 'attributes');
    
    return this.sanitizeObject(data);
  }

  static validateMarketplaceListing(data) {
    this.isObject(data, 'listing data');
    this.tokenId(data.tokenId, 'tokenId');
    this.ethereumAddress(data.seller, 'seller');
    this.price(data.price, 'price');
    
    if (data.currency) {
      this.isString(data.currency, 'currency');
      this.maxLength(data.currency, 10, 'currency');
    }
    
    return this.sanitizeObject(data);
  }

  static validateUserTierData(data) {
    this.isObject(data, 'tier data');
    this.ethereumAddress(data.walletAddress, 'walletAddress');
    
    if (data.xpAmount !== undefined) {
      this.xpAmount(data.xpAmount, 'xpAmount');
    }
    
    if (data.tierLevel !== undefined) {
      this.tierLevel(data.tierLevel, 'tierLevel');
    }
    
    return this.sanitizeObject(data);
  }

  // Batch validation
  static validateBatch(items, validator, fieldName = 'items') {
    this.isArray(items, fieldName);
    this.arrayLength(items, 1, VALIDATION_LIMITS.MAX_ARRAY_LENGTH, fieldName);
    
    return items.map((item, index) => {
      try {
        return validator(item);
      } catch (error) {
        throw new ValidationError(`${fieldName}[${index}]: ${error.message}`, `${fieldName}[${index}]`);
      }
    });
  }
}

// Middleware for Express.js
function createValidationMiddleware(validator) {
  return (req, res, next) => {
    try {
      req.validatedData = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Validation schemas for common operations
const ValidationSchemas = {
  nftMint: (data) => Validator.validateNFTMintData(data),
  marketplaceListing: (data) => Validator.validateMarketplaceListing(data),
  userTier: (data) => Validator.validateUserTierData(data),
  
  // API parameter validations
  walletAddress: (address) => {
    Validator.ethereumAddress(address, 'wallet address');
    return address;
  },
  
  tokenId: (id) => {
    const numId = parseInt(id);
    Validator.tokenId(numId, 'token ID');
    return numId;
  },
  
  pagination: (query) => {
    const { page = 1, limit = 20 } = query;
    const numPage = parseInt(page);
    const numLimit = parseInt(limit);
    
    Validator.min(numPage, 1, 'page');
    Validator.range(numLimit, 1, 100, 'limit');
    
    return { page: numPage, limit: numLimit };
  }
};

module.exports = {
  Validator,
  ValidationSchemas,
  createValidationMiddleware,
  VALIDATION_PATTERNS,
  VALIDATION_LIMITS
};
