// Simple Node.js script to run Sepolia deployment
// This bypasses PowerShell execution policy issues

const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting LandKrypt Enhanced Sepolia Deployment...\n');

// Check environment variables
const requiredEnvVars = [
  'ALCHEMY_API_KEY',
  'DEPLOYER_PRIVATE_KEY', 
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY'
];

console.log('🔍 Checking environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: ${envVar} not set in .env file`);
    process.exit(1);
  }
  console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? '***' + process.env[envVar].slice(-4) : process.env[envVar]}`);
}

console.log('\n📋 Deployment Configuration:');
console.log(`Network: Sepolia (Chain ID: 11155111)`);
console.log(`RPC URL: https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
console.log(`Deployer: ${process.env.DEPLOYER_PRIVATE_KEY ? 'Set' : 'Not Set'}`);
console.log(`Pinata API: ${process.env.PINATA_API_KEY ? 'Set' : 'Not Set'}`);

console.log('\n🎯 This deployment will:');
console.log('- Deploy 6 enhanced contracts to Sepolia testnet');
console.log('- Upload NFT images to Pinata IPFS');
console.log('- Mint 5 NFTs to your address (0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC)');
console.log('- Update environment files with deployed addresses');
console.log('- Generate comprehensive deployment report');

console.log('\n⚡ Starting deployment...\n');

// Set environment variables for the child process
const env = {
  ...process.env,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY
};

// Run the deployment
const deploymentCommand = 'node_modules\\.bin\\hardhat run scripts/deploy-sepolia-enhanced.js --network sepolia';

const deploymentProcess = exec(deploymentCommand, { 
  cwd: __dirname,
  env: env,
  maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large output
}, (error, stdout, stderr) => {
  if (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (stderr) {
      console.error('Error details:', stderr);
    }
    process.exit(1);
  }
  
  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📊 Check the deployment report at:');
  console.log('   deployments/sepolia-enhanced-deployment.json');
  console.log('\n📝 Environment files updated:');
  console.log('   .env.local - Development configuration');
  console.log('   .env.sepolia - Sepolia testnet configuration');
  console.log('   .env.production - Updated with Sepolia addresses');
  
  process.exit(0);
});

// Stream output in real-time
deploymentProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

deploymentProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Deployment interrupted by user');
  deploymentProcess.kill('SIGINT');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Deployment terminated');
  deploymentProcess.kill('SIGTERM');
  process.exit(1);
});
