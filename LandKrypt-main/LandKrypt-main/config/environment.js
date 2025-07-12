// Environment Configuration Management
// Centralized configuration with validation and security

const fs = require('fs');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    this.loadEnvironment();
    this.validateConfiguration();
  }

  loadEnvironment() {
    // Load environment variables from multiple sources
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
    require('dotenv').config({ path: path.join(__dirname, '../.env.production') });
  }

  validateConfiguration() {
    const errors = [];
    
    // Validate required environment variables
    const requiredVars = this.getRequiredVariables();
    
    for (const [category, vars] of Object.entries(requiredVars)) {
      for (const varName of vars) {
        if (!process.env[varName]) {
          errors.push(`Missing ${category} variable: ${varName}`);
        }
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ Environment Configuration Errors:');
      errors.forEach(error => console.error(`   ${error}`));
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid environment configuration for production');
      } else {
        console.warn('⚠️  Some environment variables are missing. Using defaults where possible.');
      }
    }
  }

  getRequiredVariables() {
    const base = {
      database: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ],
      blockchain: [
        'DEPLOYER_PRIVATE_KEY'
      ],
      ipfs: [
        'PINATA_API_KEY',
        'PINATA_SECRET_API_KEY'
      ]
    };

    if (process.env.NODE_ENV === 'production') {
      base.blockchain.push('MAINNET_RPC_URL', 'ETHERSCAN_API_KEY');
    } else {
      base.blockchain.push('ALCHEMY_SEPOLIA_URL');
    }

    return base;
  }

  // ====== DATABASE CONFIGURATION ======

  getDatabaseConfig() {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    };
  }

  // ====== BLOCKCHAIN CONFIGURATION ======

  getBlockchainConfig() {
    const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia';
    
    const config = {
      network,
      rpcUrl: this.getRpcUrl(network),
      privateKey: process.env.DEPLOYER_PRIVATE_KEY,
      gasSettings: {
        maxFeePerGas: process.env.MAX_FEE_PER_GAS || '50000000000', // 50 gwei
        maxPriorityFeePerGas: process.env.MAX_PRIORITY_FEE_PER_GAS || '2000000000' // 2 gwei
      },
      contracts: this.getContractAddresses(network)
    };

    return config;
  }

  getRpcUrl(network) {
    switch (network) {
      case 'mainnet':
        return process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_URL;
      case 'sepolia':
        return process.env.ALCHEMY_SEPOLIA_URL || process.env.SEPOLIA_RPC_URL;
      case 'localhost':
        return process.env.LOCALHOST_RPC_URL || 'http://127.0.0.1:8545';
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  getContractAddresses(network) {
    return {
      lkusd: process.env.NEXT_PUBLIC_LKUSD_ADDRESS,
      lkst: process.env.NEXT_PUBLIC_LKST_ADDRESS,
      realEstateNFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
      oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS,
      exchange: process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS,
      nftMarketplace: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
      developmentContract: process.env.NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS,
      stakingFactory: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
      nftDAO: process.env.NEXT_PUBLIC_NFT_DAO_ADDRESS
    };
  }

  // ====== IPFS CONFIGURATION ======

  getIPFSConfig() {
    return {
      pinata: {
        apiKey: process.env.PINATA_API_KEY,
        secretKey: process.env.PINATA_SECRET_API_KEY,
        gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
        uploadEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        jsonEndpoint: 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
      },
      fallbackGateways: [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/'
      ]
    };
  }

  // ====== APPLICATION CONFIGURATION ======

  getAppConfig() {
    return {
      name: 'LandKrypt',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      features: {
        enableStaking: process.env.ENABLE_STAKING !== 'false',
        enableMarketplace: process.env.ENABLE_MARKETPLACE !== 'false',
        enableDAO: process.env.ENABLE_DAO !== 'false',
        enableTierSystem: process.env.ENABLE_TIER_SYSTEM !== 'false'
      },
      limits: {
        maxNFTsPerUser: parseInt(process.env.MAX_NFTS_PER_USER) || 100,
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        rateLimit: parseInt(process.env.RATE_LIMIT) || 100
      }
    };
  }

  // ====== SECURITY CONFIGURATION ======

  getSecurityConfig() {
    return {
      jwt: {
        secret: process.env.JWT_SECRET || 'default-dev-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY || 'default-dev-encryption-key',
        algorithm: 'aes-256-gcm'
      },
      cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
        credentials: true
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
      }
    };
  }

  // ====== MONITORING CONFIGURATION ======

  getMonitoringConfig() {
    return {
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1
      },
      analytics: {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
        mixpanelToken: process.env.MIXPANEL_TOKEN
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
      }
    };
  }

  // ====== UTILITY METHODS ======

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  // ====== CONFIGURATION EXPORT ======

  getFullConfig() {
    return {
      app: this.getAppConfig(),
      database: this.getDatabaseConfig(),
      blockchain: this.getBlockchainConfig(),
      ipfs: this.getIPFSConfig(),
      security: this.getSecurityConfig(),
      monitoring: this.getMonitoringConfig()
    };
  }

  // ====== ENVIRONMENT FILE GENERATION ======

  generateEnvTemplate() {
    const template = `# LandKrypt Environment Configuration
# Copy this file to .env.local and fill in your values

# ====== APPLICATION ======
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ====== DATABASE (Supabase) ======
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ====== BLOCKCHAIN ======
DEPLOYER_PRIVATE_KEY=your_private_key
ALCHEMY_SEPOLIA_URL=your_alchemy_sepolia_url
ALCHEMY_MAINNET_URL=your_alchemy_mainnet_url
ETHERSCAN_API_KEY=your_etherscan_api_key

# ====== IPFS (Pinata) ======
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# ====== CONTRACT ADDRESSES ======
NEXT_PUBLIC_LKUSD_ADDRESS=
NEXT_PUBLIC_LKST_ADDRESS=
NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS=
NEXT_PUBLIC_ORACLE_ADDRESS=
NEXT_PUBLIC_EXCHANGE_ADDRESS=
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=
NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS=
NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=
NEXT_PUBLIC_NFT_DAO_ADDRESS=

# ====== SECURITY ======
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# ====== MONITORING ======
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# ====== FEATURE FLAGS ======
ENABLE_STAKING=true
ENABLE_MARKETPLACE=true
ENABLE_DAO=true
ENABLE_TIER_SYSTEM=true

# ====== LIMITS ======
MAX_NFTS_PER_USER=100
MAX_FILE_SIZE=10485760
RATE_LIMIT_MAX=100
`;

    const templatePath = path.join(__dirname, '../.env.example');
    fs.writeFileSync(templatePath, template);
    console.log(`✅ Environment template generated: ${templatePath}`);
    
    return template;
  }

  // ====== VALIDATION METHODS ======

  validateDatabaseConnection() {
    const config = this.getDatabaseConfig();
    
    if (!config.url || !config.serviceRoleKey) {
      throw new Error('Database configuration incomplete');
    }
    
    // Test URL format
    try {
      new URL(config.url);
    } catch (error) {
      throw new Error('Invalid Supabase URL format');
    }
    
    return true;
  }

  validateBlockchainConnection() {
    const config = this.getBlockchainConfig();
    
    if (!config.rpcUrl || !config.privateKey) {
      throw new Error('Blockchain configuration incomplete');
    }
    
    // Validate private key format
    if (!/^0x[a-fA-F0-9]{64}$/.test(config.privateKey)) {
      throw new Error('Invalid private key format');
    }
    
    return true;
  }

  validateIPFSConnection() {
    const config = this.getIPFSConfig();
    
    if (!config.pinata.apiKey || !config.pinata.secretKey) {
      throw new Error('IPFS configuration incomplete');
    }
    
    return true;
  }

  async runFullValidation() {
    const results = {
      database: false,
      blockchain: false,
      ipfs: false,
      errors: []
    };
    
    try {
      this.validateDatabaseConnection();
      results.database = true;
    } catch (error) {
      results.errors.push(`Database: ${error.message}`);
    }
    
    try {
      this.validateBlockchainConnection();
      results.blockchain = true;
    } catch (error) {
      results.errors.push(`Blockchain: ${error.message}`);
    }
    
    try {
      this.validateIPFSConnection();
      results.ipfs = true;
    } catch (error) {
      results.errors.push(`IPFS: ${error.message}`);
    }
    
    return results;
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;
