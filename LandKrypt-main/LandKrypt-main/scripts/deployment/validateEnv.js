// Enhanced Environment Validation Script
// Validates all environment variables and external service connections

const environmentConfig = require('../../config/environment');
const supabaseConnection = require('../../src/lib/database/supabase-enhanced');
const axios = require('axios');
const { ethers } = require('ethers');

class EnvironmentValidator {
  constructor() {
    this.results = {
      environment: { status: 'pending', tests: [] },
      database: { status: 'pending', tests: [] },
      blockchain: { status: 'pending', tests: [] },
      ipfs: { status: 'pending', tests: [] },
      contracts: { status: 'pending', tests: [] }
    };
  }

  async runAllValidations() {
    console.log('🔍 Starting comprehensive environment validation...\n');

    try {
      await this.validateEnvironmentVariables();
      await this.validateDatabaseConnection();
      await this.validateBlockchainConnection();
      await this.validateIPFSConnection();
      await this.validateContractAddresses();

      this.printResults();
      return this.getOverallStatus();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  async validateEnvironmentVariables() {
    console.log('📋 Validating environment variables...');

    try {
      const validation = await environmentConfig.runFullValidation();

      this.results.environment.tests.push({
        name: 'Required Variables',
        status: validation.errors.length === 0 ? 'pass' : 'fail',
        details: validation.errors.length === 0 ? 'All required variables present' : validation.errors.join(', ')
      });

      // Test environment file existence
      const fs = require('fs');
      const path = require('path');
      const envFiles = ['.env', '.env.local', '.env.production'];

      for (const file of envFiles) {
        const filePath = path.join(__dirname, '../../', file);
        const exists = fs.existsSync(filePath);

        this.results.environment.tests.push({
          name: `Environment file: ${file}`,
          status: exists ? 'pass' : 'warn',
          details: exists ? 'File exists' : 'File not found (optional)'
        });
      }

      this.results.environment.status = validation.errors.length === 0 ? 'pass' : 'fail';
      console.log(`   ${validation.errors.length === 0 ? '✅' : '❌'} Environment variables validation complete\n`);

    } catch (error) {
      this.results.environment.status = 'fail';
      this.results.environment.tests.push({
        name: 'Environment Validation',
        status: 'fail',
        details: error.message
      });
      console.log(`   ❌ Environment validation failed: ${error.message}\n`);
    }
  }

  async validateDatabaseConnection() {
    console.log('🗄️  Validating database connection...');

    try {
      // Test basic connection
      await supabaseConnection.connect();

      this.results.database.tests.push({
        name: 'Database Connection',
        status: 'pass',
        details: 'Successfully connected to Supabase'
      });

      // Test health check
      const health = await supabaseConnection.healthCheck();

      this.results.database.tests.push({
        name: 'Health Check',
        status: health.status === 'healthy' ? 'pass' : 'fail',
        details: health.status === 'healthy' ? `Response time: ${health.responseTime}` : health.error
      });

      // Test table access
      try {
        const stats = await supabaseConnection.getTableStats();

        this.results.database.tests.push({
          name: 'Table Access',
          status: 'pass',
          details: `Accessed ${Object.keys(stats.tables).length} tables`
        });
      } catch (error) {
        this.results.database.tests.push({
          name: 'Table Access',
          status: 'warn',
          details: 'Some tables may not exist yet'
        });
      }

      this.results.database.status = 'pass';
      console.log('   ✅ Database validation complete\n');

    } catch (error) {
      this.results.database.status = 'fail';
      this.results.database.tests.push({
        name: 'Database Connection',
        status: 'fail',
        details: error.message
      });
      console.log(`   ❌ Database validation failed: ${error.message}\n`);
    }
  }

  async validateBlockchainConnection() {
    console.log('⛓️  Validating blockchain connection...');

    try {
      const blockchainConfig = environmentConfig.getBlockchainConfig();

      // Test RPC connection
      const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
      const network = await provider.getNetwork();

      this.results.blockchain.tests.push({
        name: 'RPC Connection',
        status: 'pass',
        details: `Connected to ${network.name} (Chain ID: ${network.chainId})`
      });

      // Test wallet
      const wallet = new ethers.Wallet(blockchainConfig.privateKey, provider);
      const balance = await provider.getBalance(wallet.address);

      this.results.blockchain.tests.push({
        name: 'Wallet Access',
        status: 'pass',
        details: `Wallet: ${wallet.address}, Balance: ${ethers.formatEther(balance)} ETH`
      });

      // Test gas price
      const gasPrice = await provider.getFeeData();

      this.results.blockchain.tests.push({
        name: 'Gas Price',
        status: 'pass',
        details: `Gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`
      });

      this.results.blockchain.status = 'pass';
      console.log('   ✅ Blockchain validation complete\n');

    } catch (error) {
      this.results.blockchain.status = 'fail';
      this.results.blockchain.tests.push({
        name: 'Blockchain Connection',
        status: 'fail',
        details: error.message
      });
      console.log(`   ❌ Blockchain validation failed: ${error.message}\n`);
    }
  }

  async validateIPFSConnection() {
    console.log('📁 Validating IPFS connection...');

    try {
      const ipfsConfig = environmentConfig.getIPFSConfig();

      // Test Pinata API
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'pinata_api_key': ipfsConfig.pinata.apiKey,
          'pinata_secret_api_key': ipfsConfig.pinata.secretKey
        }
      });

      this.results.ipfs.tests.push({
        name: 'Pinata Authentication',
        status: 'pass',
        details: 'Successfully authenticated with Pinata'
      });

      // Test gateway access
      try {
        const gatewayResponse = await axios.get(`${ipfsConfig.pinata.gateway}QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme`, {
          timeout: 5000
        });

        this.results.ipfs.tests.push({
          name: 'Gateway Access',
          status: 'pass',
          details: 'IPFS gateway is accessible'
        });
      } catch (error) {
        this.results.ipfs.tests.push({
          name: 'Gateway Access',
          status: 'warn',
          details: 'Gateway may be slow or unavailable'
        });
      }

      this.results.ipfs.status = 'pass';
      console.log('   ✅ IPFS validation complete\n');

    } catch (error) {
      this.results.ipfs.status = 'fail';
      this.results.ipfs.tests.push({
        name: 'IPFS Connection',
        status: 'fail',
        details: error.message
      });
      console.log(`   ❌ IPFS validation failed: ${error.message}\n`);
    }
  }

  async validateContractAddresses() {
    console.log('📜 Validating contract addresses...');

    try {
      const blockchainConfig = environmentConfig.getBlockchainConfig();
      const contracts = blockchainConfig.contracts;

      let validContracts = 0;
      let totalContracts = 0;

      for (const [name, address] of Object.entries(contracts)) {
        totalContracts++;

        if (!address) {
          this.results.contracts.tests.push({
            name: `Contract: ${name}`,
            status: 'warn',
            details: 'Address not set'
          });
          continue;
        }

        // Validate address format
        if (!ethers.isAddress(address)) {
          this.results.contracts.tests.push({
            name: `Contract: ${name}`,
            status: 'fail',
            details: 'Invalid address format'
          });
          continue;
        }

        // Test if address has code (is a contract)
        try {
          const provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
          const code = await provider.getCode(address);

          if (code === '0x') {
            this.results.contracts.tests.push({
              name: `Contract: ${name}`,
              status: 'warn',
              details: 'Address has no contract code'
            });
          } else {
            this.results.contracts.tests.push({
              name: `Contract: ${name}`,
              status: 'pass',
              details: `Valid contract at ${address}`
            });
            validContracts++;
          }
        } catch (error) {
          this.results.contracts.tests.push({
            name: `Contract: ${name}`,
            status: 'fail',
            details: `Error checking contract: ${error.message}`
          });
        }
      }

      this.results.contracts.status = validContracts > 0 ? 'pass' : 'warn';
      console.log(`   ${validContracts > 0 ? '✅' : '⚠️'} Contract validation complete (${validContracts}/${totalContracts} valid)\n`);

    } catch (error) {
      this.results.contracts.status = 'fail';
      this.results.contracts.tests.push({
        name: 'Contract Validation',
        status: 'fail',
        details: error.message
      });
      console.log(`   ❌ Contract validation failed: ${error.message}\n`);
    }
  }

  printResults() {
    console.log('📊 Validation Results Summary:');
    console.log('═'.repeat(50));

    for (const [category, result] of Object.entries(this.results)) {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      console.log(`\n${statusIcon} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);

      for (const test of result.tests) {
        const testIcon = test.status === 'pass' ? '  ✓' : test.status === 'warn' ? '  ⚠' : '  ✗';
        console.log(`${testIcon} ${test.name}: ${test.details}`);
      }
    }

    console.log('\n' + '═'.repeat(50));
  }

  getOverallStatus() {
    const statuses = Object.values(this.results).map(r => r.status);

    if (statuses.includes('fail')) {
      console.log('❌ Overall Status: FAILED - Critical issues found');
      return false;
    } else if (statuses.includes('warn')) {
      console.log('⚠️  Overall Status: WARNING - Some issues found');
      return true;
    } else {
      console.log('✅ Overall Status: PASSED - All validations successful');
      return true;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: environmentConfig.getAppConfig().environment,
      results: this.results,
      summary: {
        total: Object.keys(this.results).length,
        passed: Object.values(this.results).filter(r => r.status === 'pass').length,
        warned: Object.values(this.results).filter(r => r.status === 'warn').length,
        failed: Object.values(this.results).filter(r => r.status === 'fail').length
      }
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../reports', `validation-${Date.now()}.json`);

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);

    return report;
  }
}

// CLI Interface
async function main() {
  const validator = new EnvironmentValidator();

  try {
    const success = await validator.runAllValidations();
    await validator.generateReport();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation process failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = EnvironmentValidator;

// Run if called directly
if (require.main === module) {
  main();
}
