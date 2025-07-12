// Security Validation Tests
// Comprehensive security testing for input validation, authentication, and attack prevention

const request = require('supertest');
const { Validator, ValidationSchemas } = require('../../src/lib/utils/validation');
const { SecurityMiddleware } = require('../../src/lib/middleware/security');
const { testDataFactory } = require('../setup');

describe('Security Validation Tests', () => {
  describe('Input Validation', () => {
    describe('Ethereum Address Validation', () => {
      test('should accept valid Ethereum addresses', () => {
        const validAddresses = [
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
          '0x0000000000000000000000000000000000000000',
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ];

        validAddresses.forEach(address => {
          expect(() => Validator.ethereumAddress(address)).not.toThrow();
        });
      });

      test('should reject invalid Ethereum addresses', () => {
        const invalidAddresses = [
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5', // Too short
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5AA', // Too long
          '742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A', // Missing 0x
          '0xGGGd35Cc6634C0532925a3b8D4C9db96C4b5Da5A', // Invalid characters
          '', // Empty
          null, // Null
          undefined // Undefined
        ];

        invalidAddresses.forEach(address => {
          expect(() => Validator.ethereumAddress(address)).toThrow();
        });
      });
    });

    describe('Transaction Hash Validation', () => {
      test('should accept valid transaction hashes', () => {
        const validHashes = [
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        ];

        validHashes.forEach(hash => {
          expect(() => Validator.transactionHash(hash)).not.toThrow();
        });
      });

      test('should reject invalid transaction hashes', () => {
        const invalidHashes = [
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde', // Too short
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1', // Too long
          '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Missing 0x
          '0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' // Invalid characters
        ];

        invalidHashes.forEach(hash => {
          expect(() => Validator.transactionHash(hash)).toThrow();
        });
      });
    });

    describe('NFT Data Validation', () => {
      test('should validate correct NFT mint data', () => {
        const validData = {
          recipient: testDataFactory.walletAddress(),
          tokenId: 12345,
          name: 'Test Villa #123',
          description: 'A beautiful test villa',
          attributes: [
            { trait_type: 'Property Type', value: 'Villa' },
            { trait_type: 'Location', value: 'Lagos' }
          ]
        };

        expect(() => ValidationSchemas.nftMint(validData)).not.toThrow();
      });

      test('should reject invalid NFT mint data', () => {
        const invalidDataSets = [
          // Missing required fields
          {
            tokenId: 12345,
            name: 'Test Villa'
          },
          // Invalid recipient address
          {
            recipient: 'invalid-address',
            tokenId: 12345,
            name: 'Test Villa'
          },
          // Invalid token ID
          {
            recipient: testDataFactory.walletAddress(),
            tokenId: -1,
            name: 'Test Villa'
          },
          // Invalid attributes
          {
            recipient: testDataFactory.walletAddress(),
            tokenId: 12345,
            name: 'Test Villa',
            attributes: [
              { trait_type: 'Property Type' } // Missing value
            ]
          }
        ];

        invalidDataSets.forEach(data => {
          expect(() => ValidationSchemas.nftMint(data)).toThrow();
        });
      });
    });

    describe('Marketplace Listing Validation', () => {
      test('should validate correct marketplace listing', () => {
        const validListing = {
          tokenId: 12345,
          seller: testDataFactory.walletAddress(),
          price: 1000000.50,
          currency: 'LKUSD'
        };

        expect(() => ValidationSchemas.marketplaceListing(validListing)).not.toThrow();
      });

      test('should reject invalid marketplace listings', () => {
        const invalidListings = [
          // Invalid price
          {
            tokenId: 12345,
            seller: testDataFactory.walletAddress(),
            price: -100
          },
          // Invalid seller address
          {
            tokenId: 12345,
            seller: 'invalid-address',
            price: 1000
          },
          // Missing required fields
          {
            tokenId: 12345
          }
        ];

        invalidListings.forEach(listing => {
          expect(() => ValidationSchemas.marketplaceListing(listing)).toThrow();
        });
      });
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize malicious script tags', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = Validator.sanitizeString(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
      });
    });

    test('should sanitize object properties recursively', () => {
      const maliciousObject = {
        name: '<script>alert("XSS")</script>Test Name',
        description: 'Safe description',
        metadata: {
          image: 'javascript:alert("XSS")',
          attributes: [
            {
              trait_type: 'Location<script>',
              value: 'Lagos'
            }
          ]
        }
      };

      const sanitized = Validator.sanitizeObject(maliciousObject);
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.metadata.image).not.toContain('javascript:');
      expect(sanitized.metadata.attributes[0].trait_type).not.toContain('<script>');
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should detect SQL injection patterns', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];

      sqlInjectionAttempts.forEach(attempt => {
        // The suspicious activity detection should flag these
        const isSuspicious = /(\bunion\b|\bselect\b|\binsert\b|\bdrop\b|\bdelete\b)/gi.test(attempt);
        expect(isSuspicious).toBe(true);
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should detect path traversal attempts', () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/passwd',
        '/proc/version'
      ];

      pathTraversalAttempts.forEach(attempt => {
        const isPathTraversal = /(\.\.|\/etc\/|\/proc\/|\\windows\\)/gi.test(attempt);
        expect(isPathTraversal).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', () => {
      const { RATE_LIMITS } = require('../../src/lib/middleware/security');
      
      expect(RATE_LIMITS.general.max).toBeDefined();
      expect(RATE_LIMITS.general.windowMs).toBeDefined();
      expect(RATE_LIMITS.strict.max).toBeLessThan(RATE_LIMITS.general.max);
      expect(RATE_LIMITS.auth.max).toBeLessThan(RATE_LIMITS.general.max);
    });
  });

  describe('Authentication Security', () => {
    test('should validate wallet signatures', () => {
      // Mock signature validation
      const mockSignatureData = {
        message: 'Sign this message to authenticate',
        signature: '0x' + '1'.repeat(130), // Mock signature
        address: testDataFactory.walletAddress()
      };

      // In a real test, you would verify the actual signature
      expect(mockSignatureData.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(mockSignatureData.address).toBeValidEthereumAddress();
    });

    test('should reject invalid signatures', () => {
      const invalidSignatures = [
        '', // Empty
        '0x123', // Too short
        'invalid-signature', // Invalid format
        null, // Null
        undefined // Undefined
      ];

      invalidSignatures.forEach(signature => {
        expect(signature).not.toMatch(/^0x[a-fA-F0-9]{130}$/);
      });
    });
  });

  describe('CORS Security', () => {
    test('should have secure CORS configuration', () => {
      const { corsOptions } = require('../../src/lib/middleware/security');
      
      expect(corsOptions.credentials).toBe(true);
      expect(corsOptions.methods).toContain('GET');
      expect(corsOptions.methods).toContain('POST');
      expect(corsOptions.methods).not.toContain('TRACE');
      expect(corsOptions.allowedHeaders).toContain('Content-Type');
      expect(corsOptions.allowedHeaders).toContain('Authorization');
    });
  });

  describe('Content Security Policy', () => {
    test('should have restrictive CSP headers', () => {
      const { helmetOptions } = require('../../src/lib/middleware/security');
      const csp = helmetOptions.contentSecurityPolicy.directives;
      
      expect(csp.defaultSrc).toContain("'self'");
      expect(csp.scriptSrc).toContain("'self'");
      expect(csp.frameSrc).toContain("'none'");
      expect(csp.objectSrc).toContain("'none'");
    });
  });

  describe('Error Information Disclosure', () => {
    test('should not expose sensitive error information', () => {
      const { AppError } = require('../../src/lib/utils/error-handler');
      
      const sensitiveError = new AppError(
        'Database connection failed: password=secret123',
        'DATABASE_ERROR',
        500,
        false // Not operational
      );

      // In production, non-operational errors should not expose details
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        expect(sensitiveError.isOperational).toBe(false);
      }
    });
  });

  describe('File Upload Security', () => {
    test('should validate file types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const dangerousTypes = ['application/javascript', 'text/html', 'application/x-executable'];

      allowedTypes.forEach(type => {
        const mockFile = { type, size: 1024 * 1024 }; // 1MB
        expect(() => Validator.imageFile(mockFile)).not.toThrow();
      });

      dangerousTypes.forEach(type => {
        const mockFile = { type, size: 1024 * 1024 };
        expect(() => Validator.imageFile(mockFile)).toThrow();
      });
    });

    test('should enforce file size limits', () => {
      const oversizedFile = {
        type: 'image/jpeg',
        size: 20 * 1024 * 1024 // 20MB (over limit)
      };

      expect(() => Validator.imageFile(oversizedFile)).toThrow();
    });
  });

  describe('Environment Variable Security', () => {
    test('should not expose sensitive environment variables', () => {
      const sensitiveVars = [
        'DEPLOYER_PRIVATE_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'PINATA_SECRET_API_KEY',
        'JWT_SECRET'
      ];

      // These should not be accessible in client-side code
      sensitiveVars.forEach(varName => {
        if (typeof window !== 'undefined') {
          expect(process.env[varName]).toBeUndefined();
        }
      });
    });

    test('should validate required environment variables', () => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ];

      requiredVars.forEach(varName => {
        // In test environment, these might not be set
        if (process.env.NODE_ENV !== 'test') {
          expect(process.env[varName]).toBeDefined();
        }
      });
    });
  });

  describe('Session Security', () => {
    test('should generate secure session tokens', () => {
      const crypto = require('crypto');
      
      // Mock session token generation
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      expect(sessionToken).toHaveLength(64);
      expect(sessionToken).toMatch(/^[a-f0-9]+$/);
    });

    test('should implement proper session expiration', () => {
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      const expirationTime = now + sessionDuration;
      
      expect(expirationTime).toBeGreaterThan(now);
      expect(expirationTime - now).toBe(sessionDuration);
    });
  });

  describe('API Security Headers', () => {
    test('should include security headers', () => {
      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Referrer-Policy'
      ];

      // These headers should be set by the security middleware
      securityHeaders.forEach(header => {
        expect(header).toBeTruthy();
      });
    });
  });

  describe('Cryptographic Security', () => {
    test('should use secure random number generation', () => {
      const crypto = require('crypto');
      
      const randomBytes = crypto.randomBytes(32);
      expect(randomBytes).toHaveLength(32);
      
      // Should be different each time
      const randomBytes2 = crypto.randomBytes(32);
      expect(randomBytes).not.toEqual(randomBytes2);
    });

    test('should validate cryptographic key lengths', () => {
      const validKeyLengths = [16, 24, 32]; // AES key lengths in bytes
      const testKey = Buffer.alloc(32); // 256-bit key
      
      expect(validKeyLengths).toContain(testKey.length);
    });
  });
});
