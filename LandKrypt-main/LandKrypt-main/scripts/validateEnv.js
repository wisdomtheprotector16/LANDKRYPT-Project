// Environment Variables Validation Script
// Run this to check if your environment is properly configured
require('dotenv').config();

const requiredVars = {
  // Blockchain essentials
  'ALCHEMY_API_KEY': 'Alchemy API key for blockchain access',
  'ALCHEMY_SEPOLIA_URL': 'Alchemy Sepolia RPC URL for testnet',
  'DEPLOYER_PRIVATE_KEY': 'Private key for contract deployment',
  
  // IPFS/Storage
  'PINATA_API_KEY': 'Pinata API key for IPFS storage',
  'PINATA_SECRET_API_KEY': 'Pinata secret for IPFS storage',
};

const recommendedVars = {
  // Wallet integration
  'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID': 'WalletConnect project ID for better wallet support',
  'ETHERSCAN_API_KEY': 'Etherscan API key for contract verification',
  
  // Database
  'DATABASE_URL': 'Database connection for user data',
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase URL (alternative to PostgreSQL)',
  
  // Security
  'JWT_SECRET': 'JWT secret for API authentication',
  'NEXTAUTH_SECRET': 'NextAuth secret for authentication',
};

const contractAddresses = [
  'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS',
  'NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS',
  'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS',
  'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS',
  'NEXT_PUBLIC_NFT_DAO_ADDRESS',
  'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS',
];

function validateEnvironment() {
  console.log('🔍 LandKrypt Environment Validation');
  console.log('=====================================\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('✅ Required Variables:');
  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    if (!value || value === 'your_' + varName.toLowerCase() || value.includes('your_')) {
      console.log(`❌ ${varName}: MISSING - ${description}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  }

  console.log('\n📝 Recommended Variables:');
  for (const [varName, description] of Object.entries(recommendedVars)) {
    const value = process.env[varName];
    if (!value || value === 'your_' + varName.toLowerCase() || value.includes('your_')) {
      console.log(`⚠️  ${varName}: NOT SET - ${description}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  }

  // Check contract addresses (will be empty before deployment)
  console.log('\n🏗️  Contract Addresses:');
  let deployedContracts = 0;
  for (const contractVar of contractAddresses) {
    const value = process.env[contractVar];
    if (value && value !== '0x0000000000000000000000000000000000000000') {
      console.log(`✅ ${contractVar}: DEPLOYED`);
      deployedContracts++;
    } else {
      console.log(`⏳ ${contractVar}: NOT DEPLOYED`);
    }
  }

  // Environment-specific checks
  console.log('\n🌍 Environment Configuration:');
  const nodeEnv = process.env.NODE_ENV || 'development';
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '11155111';
  const networkName = process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia';

  console.log(`Environment: ${nodeEnv}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Network: ${networkName}`);

  if (nodeEnv === 'production') {
    console.log('\n🚨 Production Environment Checks:');
    
    // Check for production-specific requirements
    if (chainId === '11155111') {
      console.log('⚠️  WARNING: Using testnet in production environment');
      hasWarnings = true;
    }
    
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      console.log('⚠️  WARNING: Debug mode enabled in production');
      hasWarnings = true;
    }
    
    if (!process.env.SENTRY_DSN) {
      console.log('⚠️  WARNING: No error monitoring (Sentry) configured');
      hasWarnings = true;
    }
  }

  // Security checks
  console.log('\n🔒 Security Checks:');
  
  if (process.env.DEPLOYER_PRIVATE_KEY && !process.env.DEPLOYER_PRIVATE_KEY.startsWith('your_')) {
    if (process.env.DEPLOYER_PRIVATE_KEY.startsWith('0x')) {
      console.log('⚠️  WARNING: Private key should not include 0x prefix');
      hasWarnings = true;
    }
    if (process.env.DEPLOYER_PRIVATE_KEY.length !== 64) {
      console.log('❌ ERROR: Private key should be 64 characters long');
      hasErrors = true;
    }
  }

  // API key format checks
  if (process.env.ALCHEMY_API_KEY && !process.env.ALCHEMY_API_KEY.includes('your_')) {
    if (process.env.ALCHEMY_API_KEY.length < 32) {
      console.log('⚠️  WARNING: Alchemy API key seems too short');
      hasWarnings = true;
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`Contract Addresses: ${deployedContracts}/${contractAddresses.length} deployed`);
  
  if (hasErrors) {
    console.log('❌ ENVIRONMENT NOT READY: Missing required variables');
    console.log('\n🛠️  To fix:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your actual API keys and private key');
    console.log('3. Run this script again to verify');
    process.exit(1);
  } else if (deployedContracts === 0) {
    console.log('⏳ ENVIRONMENT READY FOR DEPLOYMENT');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run deploy:contracts');
    console.log('2. Run: npm run generate:marketplace');
    console.log('3. Run: npm run dev');
  } else if (deployedContracts === contractAddresses.length) {
    console.log('✅ ENVIRONMENT FULLY CONFIGURED');
    console.log('\n🎉 Ready to run:');
    console.log('npm run dev');
  } else {
    console.log('⚠️  PARTIAL DEPLOYMENT DETECTED');
    console.log('\n🔄 Consider:');
    console.log('1. Completing deployment: npm run deploy:contracts');
    console.log('2. Or starting fresh with new environment');
  }

  if (hasWarnings) {
    console.log('\n⚠️  Note: There are warnings above that should be addressed for optimal operation.');
  }
}

function showHelp() {
  console.log(`
🔧 LandKrypt Environment Setup Help

Quick Setup:
1. npm run validate:env          # Check current environment
2. Copy .env.example to .env.local and fill in your keys
3. npm run deploy:contracts      # Deploy smart contracts  
4. npm run generate:marketplace  # Generate marketplace data
5. npm run dev                   # Start development server

Required API Keys:
• Alchemy API Key: https://alchemy.com/
• Pinata API Keys: https://pinata.cloud/
• Private Key: Export from MetaMask (keep secret!)

Optional but Recommended:
• WalletConnect Project ID: https://cloud.reown.com/
• Etherscan API Key: https://etherscan.io/apis

For production deployment, use .env.production template.
  `);
}

// CLI handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  validateEnvironment();
}
