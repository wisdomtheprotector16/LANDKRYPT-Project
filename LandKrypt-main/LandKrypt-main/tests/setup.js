// Test Setup and Configuration
// Comprehensive testing environment setup for LandKrypt

const { config } = require('dotenv');
const path = require('path');

// Load test environment variables
config({ path: path.join(__dirname, '../.env.test') });

// Global test configuration
global.TEST_CONFIG = {
  // Test database configuration
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/landkrypt_test',
    supabaseUrl: process.env.TEST_SUPABASE_URL,
    supabaseKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Test blockchain configuration
  blockchain: {
    rpcUrl: process.env.TEST_RPC_URL || 'http://127.0.0.1:8545',
    privateKey: process.env.TEST_PRIVATE_KEY || '0x' + '1'.repeat(64),
    chainId: 31337 // Hardhat default
  },
  
  // Test IPFS configuration
  ipfs: {
    apiKey: process.env.TEST_PINATA_API_KEY || 'test-api-key',
    secretKey: process.env.TEST_PINATA_SECRET_KEY || 'test-secret-key'
  },
  
  // Test timeouts
  timeouts: {
    unit: 5000,      // 5 seconds for unit tests
    integration: 30000, // 30 seconds for integration tests
    e2e: 60000       // 60 seconds for e2e tests
  }
};

// Mock implementations for external services
const mockServices = {
  // Mock Supabase client
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
      unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
    }))
  },
  
  // Mock ethers provider
  ethersProvider: {
    getNetwork: jest.fn().mockResolvedValue({ name: 'hardhat', chainId: 31337 }),
    getBalance: jest.fn().mockResolvedValue('1000000000000000000'), // 1 ETH
    getTransaction: jest.fn().mockResolvedValue({
      hash: '0x123',
      blockNumber: 1,
      confirmations: 1
    }),
    getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
    getFeeData: jest.fn().mockResolvedValue({
      gasPrice: '20000000000', // 20 gwei
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '2000000000'
    })
  },
  
  // Mock IPFS/Pinata
  pinata: {
    pinFileToIPFS: jest.fn().mockResolvedValue({
      IpfsHash: 'QmTestHash123456789',
      PinSize: 1024,
      Timestamp: new Date().toISOString()
    }),
    pinJSONToIPFS: jest.fn().mockResolvedValue({
      IpfsHash: 'QmTestJSONHash123456789',
      PinSize: 512,
      Timestamp: new Date().toISOString()
    })
  }
};

// Test data factories
const testDataFactory = {
  // Generate test wallet address
  walletAddress: (index = 0) => {
    const addresses = [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
      '0x8ba1f109551bD432803012645Hac136c9c1e3a9',
      '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      '0x9876543210987654321098765432109876543210'
    ];
    return addresses[index % addresses.length];
  },
  
  // Generate test NFT data
  nftData: (overrides = {}) => ({
    tokenId: Math.floor(Math.random() * 1000000) + 1,
    name: `Test NFT #${Math.floor(Math.random() * 1000)}`,
    description: 'A test NFT for automated testing',
    image: 'QmTestImageHash123456789',
    attributes: [
      { trait_type: 'Property Type', value: 'Villa' },
      { trait_type: 'Location', value: 'Lagos' },
      { trait_type: 'Rarity', value: 'Common' }
    ],
    ...overrides
  }),
  
  // Generate test user data
  userData: (overrides = {}) => ({
    wallet_address: testDataFactory.walletAddress(),
    total_xp: Math.floor(Math.random() * 10000),
    current_tier: Math.floor(Math.random() * 6) + 1,
    tier_progress: Math.floor(Math.random() * 100),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Generate test marketplace listing
  marketplaceListing: (overrides = {}) => ({
    token_id: Math.floor(Math.random() * 1000000) + 1,
    seller_address: testDataFactory.walletAddress(),
    price: (Math.random() * 1000000).toFixed(2),
    currency: 'LKUSD',
    status: 'active',
    created_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Generate test transaction hash
  transactionHash: () => '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join(''),
  
  // Generate test IPFS hash
  ipfsHash: () => 'Qm' + Array.from({ length: 44 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    .charAt(Math.floor(Math.random() * 62))
  ).join('')
};

// Test utilities
const testUtils = {
  // Wait for a specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  },
  
  // Clean up test data
  cleanup: async () => {
    // Clean up any test data created during tests
    // This would typically involve database cleanup
    console.log('Cleaning up test data...');
  },
  
  // Setup test database
  setupTestDatabase: async () => {
    // Setup test database with required tables
    console.log('Setting up test database...');
  },
  
  // Teardown test database
  teardownTestDatabase: async () => {
    // Clean up test database
    console.log('Tearing down test database...');
  },
  
  // Mock API response
  mockApiResponse: (data, status = 200) => ({
    status,
    data,
    headers: { 'content-type': 'application/json' }
  }),
  
  // Mock blockchain transaction
  mockTransaction: (overrides = {}) => ({
    hash: testDataFactory.transactionHash(),
    blockNumber: Math.floor(Math.random() * 1000000),
    gasUsed: '21000',
    status: 1,
    confirmations: 1,
    ...overrides
  }),
  
  // Validate test environment
  validateTestEnvironment: () => {
    const required = [
      'TEST_DATABASE_URL',
      'TEST_RPC_URL'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.warn(`Missing test environment variables: ${missing.join(', ')}`);
    }
    
    return missing.length === 0;
  }
};

// Jest configuration
const jestConfig = {
  // Global setup and teardown
  globalSetup: async () => {
    console.log('🧪 Setting up test environment...');
    await testUtils.setupTestDatabase();
  },
  
  globalTeardown: async () => {
    console.log('🧹 Tearing down test environment...');
    await testUtils.teardownTestDatabase();
  },
  
  // Test environment setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test-utils/**',
    '!**/node_modules/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

// Custom matchers
expect.extend({
  toBeValidEthereumAddress(received) {
    const pass = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid Ethereum address`,
      pass
    };
  },
  
  toBeValidTransactionHash(received) {
    const pass = /^0x[a-fA-F0-9]{64}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid transaction hash`,
      pass
    };
  },
  
  toBeValidIPFSHash(received) {
    const pass = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid IPFS hash`,
      pass
    };
  },
  
  toHaveValidNFTStructure(received) {
    const requiredFields = ['name', 'description', 'image', 'attributes'];
    const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
    const hasValidAttributes = Array.isArray(received.attributes) && 
      received.attributes.every(attr => attr.trait_type && attr.value !== undefined);
    
    const pass = hasAllFields && hasValidAttributes;
    return {
      message: () => `expected ${JSON.stringify(received)} to have valid NFT structure`,
      pass
    };
  }
});

// Global test setup
beforeAll(async () => {
  // Validate test environment
  testUtils.validateTestEnvironment();
  
  // Setup global mocks
  global.mockServices = mockServices;
  global.testDataFactory = testDataFactory;
  global.testUtils = testUtils;
});

afterAll(async () => {
  // Global cleanup
  await testUtils.cleanup();
});

// Export test utilities
module.exports = {
  testDataFactory,
  testUtils,
  mockServices,
  jestConfig
};
