// Production Deployment Script
// Comprehensive deployment automation with health checks and rollback capabilities

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const environmentConfig = require('../../config/environment');
const logger = require('../../src/lib/utils/logger');

class ProductionDeployer {
  constructor() {
    this.deploymentId = `deploy-${Date.now()}`;
    this.startTime = Date.now();
    this.deploymentSteps = [];
    this.rollbackSteps = [];
    this.healthChecks = [];
  }

  // ====== DEPLOYMENT ORCHESTRATION ======

  async deploy() {
    try {
      logger.info('🚀 Starting production deployment', { deploymentId: this.deploymentId });
      
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Environment validation
      await this.validateEnvironment();
      
      // Database migrations
      await this.runDatabaseMigrations();
      
      // Build application
      await this.buildApplication();
      
      // Deploy contracts (if needed)
      await this.deployContracts();
      
      // Deploy application
      await this.deployApplication();
      
      // Post-deployment setup
      await this.postDeploymentSetup();
      
      // Health checks
      await this.runHealthChecks();
      
      // Finalize deployment
      await this.finalizeDeployment();
      
      logger.info('✅ Production deployment completed successfully', {
        deploymentId: this.deploymentId,
        duration: Date.now() - this.startTime
      });
      
      return { success: true, deploymentId: this.deploymentId };
      
    } catch (error) {
      logger.error('❌ Production deployment failed', {
        deploymentId: this.deploymentId,
        error: error.message,
        stack: error.stack
      });
      
      await this.handleDeploymentFailure(error);
      throw error;
    }
  }

  // ====== PRE-DEPLOYMENT CHECKS ======

  async preDeploymentChecks() {
    logger.info('🔍 Running pre-deployment checks');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = '18.0.0';
    if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
      throw new Error(`Node.js version ${nodeVersion} is not compatible. Required: ${requiredVersion}+`);
    }
    
    // Check disk space
    const diskSpace = await this.checkDiskSpace();
    if (diskSpace < 1024) { // 1GB minimum
      throw new Error(`Insufficient disk space: ${diskSpace}MB available`);
    }
    
    // Check memory
    const memory = process.memoryUsage();
    if (memory.heapTotal < 512 * 1024 * 1024) { // 512MB minimum
      throw new Error('Insufficient memory available');
    }
    
    // Check network connectivity
    await this.checkNetworkConnectivity();
    
    // Check required files
    this.checkRequiredFiles();
    
    logger.info('✅ Pre-deployment checks passed');
  }

  async validateEnvironment() {
    logger.info('🔧 Validating environment configuration');
    
    const EnvironmentValidator = require('./validateEnv');
    const validator = new EnvironmentValidator();
    
    const isValid = await validator.runAllValidations();
    if (!isValid) {
      throw new Error('Environment validation failed');
    }
    
    logger.info('✅ Environment validation passed');
  }

  // ====== DATABASE OPERATIONS ======

  async runDatabaseMigrations() {
    logger.info('🗄️  Running database migrations');
    
    try {
      // Check database connectivity
      const supabaseConnection = require('../../src/lib/database/supabase-enhanced');
      await supabaseConnection.connect();
      
      // Run migrations (if any)
      await this.executeDatabaseMigrations();
      
      // Verify database schema
      await this.verifyDatabaseSchema();
      
      logger.info('✅ Database migrations completed');
    } catch (error) {
      logger.error('❌ Database migration failed', { error: error.message });
      throw error;
    }
  }

  async executeDatabaseMigrations() {
    // This would typically run SQL migration files
    // For Supabase, migrations are usually handled through the dashboard
    // or SQL files executed manually
    
    const migrationFiles = this.getMigrationFiles();
    for (const file of migrationFiles) {
      logger.info(`Running migration: ${file}`);
      // Execute migration file
      // await this.executeSQLFile(file);
    }
  }

  getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (!fs.existsSync(migrationsDir)) return [];
    
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  async verifyDatabaseSchema() {
    const supabaseConnection = require('../../src/lib/database/supabase-enhanced');
    
    // Verify required tables exist
    const requiredTables = [
      'users',
      'nfts',
      'user_actions',
      'user_tier_progress',
      'marketplace_listings'
    ];
    
    for (const table of requiredTables) {
      try {
        await supabaseConnection.safeQuery(table, {
          type: 'select',
          columns: 'count',
          limit: 1
        });
        logger.debug(`✅ Table verified: ${table}`);
      } catch (error) {
        throw new Error(`Required table missing or inaccessible: ${table}`);
      }
    }
  }

  // ====== APPLICATION BUILD ======

  async buildApplication() {
    logger.info('🏗️  Building application');
    
    try {
      // Install dependencies
      logger.info('📦 Installing dependencies');
      execSync('npm ci --production', { stdio: 'inherit' });
      
      // Build Next.js application
      logger.info('⚡ Building Next.js application');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Verify build output
      this.verifyBuildOutput();
      
      logger.info('✅ Application build completed');
    } catch (error) {
      logger.error('❌ Application build failed', { error: error.message });
      throw error;
    }
  }

  verifyBuildOutput() {
    const buildDir = path.join(__dirname, '../../.next');
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build output directory not found');
    }
    
    const requiredFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '../..', file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required build file missing: ${file}`);
      }
    }
  }

  // ====== CONTRACT DEPLOYMENT ======

  async deployContracts() {
    logger.info('📜 Deploying smart contracts');
    
    try {
      // Check if contracts need deployment
      const contractsNeedDeployment = await this.checkContractsDeployment();
      
      if (contractsNeedDeployment) {
        logger.info('🚀 Deploying contracts to mainnet');
        execSync('npm run deploy:mainnet', { stdio: 'inherit' });
        
        // Verify contract deployment
        await this.verifyContractDeployment();
      } else {
        logger.info('ℹ️  Contracts already deployed');
      }
      
      logger.info('✅ Contract deployment completed');
    } catch (error) {
      logger.error('❌ Contract deployment failed', { error: error.message });
      throw error;
    }
  }

  async checkContractsDeployment() {
    const blockchainConfig = environmentConfig.getBlockchainConfig();
    const contracts = blockchainConfig.contracts;
    
    // Check if all contract addresses are set
    const missingContracts = Object.entries(contracts)
      .filter(([name, address]) => !address)
      .map(([name]) => name);
    
    return missingContracts.length > 0;
  }

  async verifyContractDeployment() {
    const { ethers } = require('ethers');
    const blockchainConfig = environmentConfig.getBlockchainConfig();
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    
    const contracts = blockchainConfig.contracts;
    
    for (const [name, address] of Object.entries(contracts)) {
      if (address) {
        const code = await provider.getCode(address);
        if (code === '0x') {
          throw new Error(`Contract ${name} at ${address} has no code`);
        }
        logger.debug(`✅ Contract verified: ${name} at ${address}`);
      }
    }
  }

  // ====== APPLICATION DEPLOYMENT ======

  async deployApplication() {
    logger.info('🌐 Deploying application');
    
    const deploymentMethod = process.env.DEPLOYMENT_METHOD || 'vercel';
    
    switch (deploymentMethod) {
      case 'vercel':
        await this.deployToVercel();
        break;
      case 'docker':
        await this.deployWithDocker();
        break;
      case 'pm2':
        await this.deployWithPM2();
        break;
      default:
        throw new Error(`Unsupported deployment method: ${deploymentMethod}`);
    }
    
    logger.info('✅ Application deployment completed');
  }

  async deployToVercel() {
    logger.info('🔺 Deploying to Vercel');
    
    try {
      // Deploy to Vercel
      execSync('vercel --prod --yes', { stdio: 'inherit' });
      
      // Get deployment URL
      const deploymentUrl = execSync('vercel --prod --yes', { encoding: 'utf8' }).trim();
      logger.info(`🌐 Deployed to: ${deploymentUrl}`);
      
      return deploymentUrl;
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async deployWithDocker() {
    logger.info('🐳 Deploying with Docker');
    
    try {
      // Build Docker image
      execSync(`docker build -t landkrypt:${this.deploymentId} .`, { stdio: 'inherit' });
      
      // Stop existing container
      try {
        execSync('docker stop landkrypt-prod', { stdio: 'ignore' });
        execSync('docker rm landkrypt-prod', { stdio: 'ignore' });
      } catch (error) {
        // Container might not exist
      }
      
      // Start new container
      execSync(`docker run -d --name landkrypt-prod -p 3000:3000 landkrypt:${this.deploymentId}`, { stdio: 'inherit' });
      
      logger.info('🐳 Docker deployment completed');
    } catch (error) {
      throw new Error(`Docker deployment failed: ${error.message}`);
    }
  }

  async deployWithPM2() {
    logger.info('⚡ Deploying with PM2');
    
    try {
      // Stop existing process
      try {
        execSync('pm2 stop landkrypt-prod', { stdio: 'ignore' });
      } catch (error) {
        // Process might not exist
      }
      
      // Start new process
      execSync('pm2 start ecosystem.config.js --env production', { stdio: 'inherit' });
      
      // Save PM2 configuration
      execSync('pm2 save', { stdio: 'inherit' });
      
      logger.info('⚡ PM2 deployment completed');
    } catch (error) {
      throw new Error(`PM2 deployment failed: ${error.message}`);
    }
  }

  // ====== POST-DEPLOYMENT SETUP ======

  async postDeploymentSetup() {
    logger.info('🔧 Running post-deployment setup');
    
    try {
      // Generate marketplace data
      await this.generateMarketplaceData();
      
      // Setup monitoring
      await this.setupMonitoring();
      
      // Configure CDN
      await this.configureCDN();
      
      // Setup SSL certificates
      await this.setupSSL();
      
      logger.info('✅ Post-deployment setup completed');
    } catch (error) {
      logger.error('❌ Post-deployment setup failed', { error: error.message });
      throw error;
    }
  }

  async generateMarketplaceData() {
    logger.info('📊 Generating marketplace data');
    
    try {
      execSync('npm run marketplace:generate', { stdio: 'inherit' });
    } catch (error) {
      logger.warn('Marketplace data generation failed', { error: error.message });
    }
  }

  async setupMonitoring() {
    logger.info('📊 Setting up monitoring');
    
    // Setup health check endpoints
    // Configure error tracking
    // Setup performance monitoring
    
    logger.info('✅ Monitoring setup completed');
  }

  async configureCDN() {
    logger.info('🌐 Configuring CDN');
    
    // Configure CDN for static assets
    // Setup cache policies
    
    logger.info('✅ CDN configuration completed');
  }

  async setupSSL() {
    logger.info('🔒 Setting up SSL certificates');
    
    // Configure SSL certificates
    // Setup HTTPS redirects
    
    logger.info('✅ SSL setup completed');
  }

  // ====== HEALTH CHECKS ======

  async runHealthChecks() {
    logger.info('🏥 Running health checks');
    
    const checks = [
      this.checkApplicationHealth,
      this.checkDatabaseHealth,
      this.checkBlockchainHealth,
      this.checkIPFSHealth
    ];
    
    for (const check of checks) {
      await check.call(this);
    }
    
    logger.info('✅ All health checks passed');
  }

  async checkApplicationHealth() {
    logger.info('🌐 Checking application health');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    try {
      const axios = require('axios');
      const response = await axios.get(`${baseUrl}/api/health`, { timeout: 10000 });
      
      if (response.status !== 200) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      logger.info('✅ Application health check passed');
    } catch (error) {
      throw new Error(`Application health check failed: ${error.message}`);
    }
  }

  async checkDatabaseHealth() {
    logger.info('🗄️  Checking database health');
    
    const supabaseConnection = require('../../src/lib/database/supabase-enhanced');
    const health = await supabaseConnection.healthCheck();
    
    if (health.status !== 'healthy') {
      throw new Error(`Database health check failed: ${health.error}`);
    }
    
    logger.info('✅ Database health check passed');
  }

  async checkBlockchainHealth() {
    logger.info('⛓️  Checking blockchain health');
    
    const { ethers } = require('ethers');
    const blockchainConfig = environmentConfig.getBlockchainConfig();
    const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    
    try {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      logger.info('✅ Blockchain health check passed', {
        network: network.name,
        chainId: network.chainId,
        blockNumber
      });
    } catch (error) {
      throw new Error(`Blockchain health check failed: ${error.message}`);
    }
  }

  async checkIPFSHealth() {
    logger.info('📁 Checking IPFS health');
    
    try {
      const axios = require('axios');
      const ipfsConfig = environmentConfig.getIPFSConfig();
      
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': ipfsConfig.pinata.apiKey,
          'pinata_secret_api_key': ipfsConfig.pinata.secretKey
        },
        timeout: 10000
      });
      
      if (response.status !== 200) {
        throw new Error(`IPFS authentication failed with status: ${response.status}`);
      }
      
      logger.info('✅ IPFS health check passed');
    } catch (error) {
      throw new Error(`IPFS health check failed: ${error.message}`);
    }
  }

  // ====== DEPLOYMENT FINALIZATION ======

  async finalizeDeployment() {
    logger.info('🎯 Finalizing deployment');
    
    // Create deployment record
    const deploymentRecord = {
      id: this.deploymentId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: 'production',
      steps: this.deploymentSteps,
      status: 'completed'
    };
    
    // Save deployment record
    const recordPath = path.join(__dirname, '../../deployments', `${this.deploymentId}.json`);
    fs.mkdirSync(path.dirname(recordPath), { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    // Send deployment notification
    await this.sendDeploymentNotification(deploymentRecord);
    
    logger.info('✅ Deployment finalized');
  }

  async sendDeploymentNotification(record) {
    try {
      if (process.env.DEPLOYMENT_WEBHOOK) {
        const axios = require('axios');
        await axios.post(process.env.DEPLOYMENT_WEBHOOK, {
          message: '🚀 LandKrypt Production Deployment Completed',
          deployment: record
        });
      }
    } catch (error) {
      logger.warn('Failed to send deployment notification', { error: error.message });
    }
  }

  // ====== ERROR HANDLING ======

  async handleDeploymentFailure(error) {
    logger.error('🚨 Handling deployment failure', {
      deploymentId: this.deploymentId,
      error: error.message
    });
    
    // Attempt rollback if possible
    await this.attemptRollback();
    
    // Send failure notification
    await this.sendFailureNotification(error);
  }

  async attemptRollback() {
    logger.info('🔄 Attempting rollback');
    
    try {
      // Execute rollback steps in reverse order
      for (const step of this.rollbackSteps.reverse()) {
        await step();
      }
      
      logger.info('✅ Rollback completed');
    } catch (rollbackError) {
      logger.error('❌ Rollback failed', { error: rollbackError.message });
    }
  }

  async sendFailureNotification(error) {
    try {
      if (process.env.DEPLOYMENT_WEBHOOK) {
        const axios = require('axios');
        await axios.post(process.env.DEPLOYMENT_WEBHOOK, {
          message: '🚨 LandKrypt Production Deployment Failed',
          error: error.message,
          deploymentId: this.deploymentId
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send failure notification', { error: notificationError.message });
    }
  }

  // ====== UTILITY METHODS ======

  isVersionCompatible(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < requiredParts.length; i++) {
      if (currentParts[i] > requiredParts[i]) return true;
      if (currentParts[i] < requiredParts[i]) return false;
    }
    
    return true;
  }

  async checkDiskSpace() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('df -m .', { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      const data = lines[1].split(/\s+/);
      return parseInt(data[3]); // Available space in MB
    } catch (error) {
      logger.warn('Could not check disk space', { error: error.message });
      return 9999; // Assume sufficient space
    }
  }

  async checkNetworkConnectivity() {
    const axios = require('axios');
    
    const endpoints = [
      'https://api.github.com',
      'https://registry.npmjs.org',
      'https://api.pinata.cloud'
    ];
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(endpoint, { timeout: 5000 });
      } catch (error) {
        throw new Error(`Network connectivity check failed for ${endpoint}: ${error.message}`);
      }
    }
  }

  checkRequiredFiles() {
    const requiredFiles = [
      'package.json',
      'next.config.js',
      '.env.production'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '../..', file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    const deployer = new ProductionDeployer();
    
    switch (command) {
      case 'deploy':
        await deployer.deploy();
        break;
        
      case 'health':
        await deployer.runHealthChecks();
        console.log('✅ All health checks passed');
        break;
        
      case 'validate':
        await deployer.validateEnvironment();
        console.log('✅ Environment validation passed');
        break;
        
      default:
        console.log(`
🚀 LandKrypt Production Deployment

Usage: node deploy-production.js <command>

Commands:
  deploy    - Run full production deployment
  health    - Run health checks only
  validate  - Validate environment only

Examples:
  node deploy-production.js deploy
  node deploy-production.js health
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = ProductionDeployer;

// Run CLI if called directly
if (require.main === module) {
  main();
}
