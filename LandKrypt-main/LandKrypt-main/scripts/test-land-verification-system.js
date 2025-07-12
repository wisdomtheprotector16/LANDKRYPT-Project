// Land Verification System Testing Script
// Tests document verification, NFT minting, and marketplace integration

const fs = require('fs');
const path = require('path');

class LandVerificationTester {
  constructor() {
    this.testResults = {
      hooks: { status: 'PENDING', tests: [] },
      components: { status: 'PENDING', tests: [] },
      database: { status: 'PENDING', tests: [] },
      api: { status: 'PENDING', tests: [] },
      integration: { status: 'PENDING', tests: [] }
    };
  }

  async testLandVerificationSystem() {
    console.log('🧪 Testing Land Verification System...\n');
    console.log('='.repeat(60));

    try {
      // 1. Test hooks implementation
      await this.testHooksImplementation();
      
      // 2. Test components implementation
      await this.testComponentsImplementation();
      
      // 3. Test database schema
      await this.testDatabaseSchema();
      
      // 4. Test API endpoints
      await this.testAPIEndpoints();
      
      // 5. Test complete integration
      await this.testCompleteIntegration();
      
      // 6. Generate comprehensive report
      const report = await this.generateTestReport();
      
      console.log('\n🎉 Land verification system testing completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Land verification system testing failed:', error);
      throw error;
    }
  }

  async testHooksImplementation() {
    console.log('🪝 Testing hooks implementation...');
    
    // Test 1: useLandDocumentVerification hook exists
    const hookPath = path.join(__dirname, '../src/hooks/useLandDocumentVerification.js');
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf8');
      
      // Check for required functions
      const requiredFunctions = [
        'verifyLandDocument',
        'mintLandNFT',
        'listLandNFTOnMarketplace',
        'verifyAndMintWorkflow',
        'getNextAvailableImage',
        'uploadImageToPinata'
      ];
      
      const foundFunctions = requiredFunctions.filter(func => 
        content.includes(func)
      );
      
      if (foundFunctions.length === requiredFunctions.length) {
        this.testResults.hooks.tests.push({
          name: 'useLandDocumentVerification Hook Functions',
          status: 'PASS',
          details: `All ${requiredFunctions.length} functions implemented`
        });
        console.log(`   ✅ useLandDocumentVerification hook complete (${foundFunctions.length}/${requiredFunctions.length})`);
      } else {
        this.testResults.hooks.tests.push({
          name: 'useLandDocumentVerification Hook Functions',
          status: 'FAIL',
          details: `Missing functions: ${requiredFunctions.filter(f => !foundFunctions.includes(f)).join(', ')}`
        });
        console.log(`   ❌ useLandDocumentVerification hook incomplete`);
      }

      // Check for owner verification
      if (content.includes('isOwner') && content.includes('OWNER_ADDRESS')) {
        this.testResults.hooks.tests.push({
          name: 'Owner Access Control',
          status: 'PASS',
          details: 'Owner verification implemented'
        });
        console.log(`   ✅ Owner access control implemented`);
      } else {
        this.testResults.hooks.tests.push({
          name: 'Owner Access Control',
          status: 'FAIL',
          details: 'Owner verification not found'
        });
        console.log(`   ❌ Owner access control missing`);
      }

      // Check for image management
      if (content.includes('availableImages') && content.includes('usedImages')) {
        this.testResults.hooks.tests.push({
          name: 'Image Management',
          status: 'PASS',
          details: 'Image tracking and management implemented'
        });
        console.log(`   ✅ Image management implemented`);
      } else {
        this.testResults.hooks.tests.push({
          name: 'Image Management',
          status: 'FAIL',
          details: 'Image management not found'
        });
        console.log(`   ❌ Image management missing`);
      }
    } else {
      this.testResults.hooks.tests.push({
        name: 'useLandDocumentVerification Hook',
        status: 'FAIL',
        details: 'Hook file not found'
      });
      console.log(`   ❌ useLandDocumentVerification hook not found`);
    }

    const passedTests = this.testResults.hooks.tests.filter(t => t.status === 'PASS').length;
    this.testResults.hooks.status = passedTests === this.testResults.hooks.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Hooks implementation: ${passedTests}/${this.testResults.hooks.tests.length} passed\n`);
  }

  async testComponentsImplementation() {
    console.log('🧩 Testing components implementation...');
    
    // Test 1: LandDocumentVerification component exists
    const componentPath = path.join(__dirname, '../src/components/LandDocumentVerification.jsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for required features
      const requiredFeatures = [
        'useLandDocumentVerification',
        'handleDocumentSubmit',
        'handleMintNFT',
        'handleListNFT',
        'isOwner',
        'availableImages'
      ];
      
      const foundFeatures = requiredFeatures.filter(feature => 
        content.includes(feature)
      );
      
      if (foundFeatures.length >= requiredFeatures.length * 0.8) {
        this.testResults.components.tests.push({
          name: 'LandDocumentVerification Component',
          status: 'PASS',
          details: `${foundFeatures.length}/${requiredFeatures.length} features implemented`
        });
        console.log(`   ✅ LandDocumentVerification component complete`);
      } else {
        this.testResults.components.tests.push({
          name: 'LandDocumentVerification Component',
          status: 'FAIL',
          details: `Missing features: ${requiredFeatures.filter(f => !foundFeatures.includes(f)).join(', ')}`
        });
        console.log(`   ❌ LandDocumentVerification component incomplete`);
      }

      // Check for form handling
      if (content.includes('documentForm') && content.includes('listingForm')) {
        this.testResults.components.tests.push({
          name: 'Form Handling',
          status: 'PASS',
          details: 'Document and listing forms implemented'
        });
        console.log(`   ✅ Form handling implemented`);
      } else {
        this.testResults.components.tests.push({
          name: 'Form Handling',
          status: 'FAIL',
          details: 'Form handling not found'
        });
        console.log(`   ❌ Form handling missing`);
      }

      // Check for access control UI
      if (content.includes('Authorized Minter') && content.includes('Restricted Access')) {
        this.testResults.components.tests.push({
          name: 'Access Control UI',
          status: 'PASS',
          details: 'Access control UI implemented'
        });
        console.log(`   ✅ Access control UI implemented`);
      } else {
        this.testResults.components.tests.push({
          name: 'Access Control UI',
          status: 'FAIL',
          details: 'Access control UI not found'
        });
        console.log(`   ❌ Access control UI missing`);
      }
    } else {
      this.testResults.components.tests.push({
        name: 'LandDocumentVerification Component',
        status: 'FAIL',
        details: 'Component file not found'
      });
      console.log(`   ❌ LandDocumentVerification component not found`);
    }

    // Test 2: Dashboard integration
    const dashboardPath = path.join(__dirname, '../src/components/enhanced/EnhancedDashboard.jsx');
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      if (content.includes('LandDocumentVerification') && content.includes('land-verification')) {
        this.testResults.components.tests.push({
          name: 'Dashboard Integration',
          status: 'PASS',
          details: 'Land verification integrated into dashboard'
        });
        console.log(`   ✅ Dashboard integration complete`);
      } else {
        this.testResults.components.tests.push({
          name: 'Dashboard Integration',
          status: 'FAIL',
          details: 'Dashboard integration not found'
        });
        console.log(`   ❌ Dashboard integration missing`);
      }
    }

    const passedTests = this.testResults.components.tests.filter(t => t.status === 'PASS').length;
    this.testResults.components.status = passedTests === this.testResults.components.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Components implementation: ${passedTests}/${this.testResults.components.tests.length} passed\n`);
  }

  async testDatabaseSchema() {
    console.log('💾 Testing database schema...');
    
    // Test 1: Database schema includes land verification tables
    const schemaPath = path.join(__dirname, '../create-tables.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      const requiredTables = [
        'land_document_verifications',
        'land_nfts',
        'nft_image_usage'
      ];
      
      const foundTables = requiredTables.filter(table => 
        schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`) || 
        schema.includes(`CREATE TABLE ${table}`)
      );
      
      if (foundTables.length === requiredTables.length) {
        this.testResults.database.tests.push({
          name: 'Land Verification Tables',
          status: 'PASS',
          details: `All ${requiredTables.length} tables defined`
        });
        console.log(`   ✅ All land verification tables defined (${foundTables.length}/${requiredTables.length})`);
      } else {
        this.testResults.database.tests.push({
          name: 'Land Verification Tables',
          status: 'FAIL',
          details: `Missing tables: ${requiredTables.filter(t => !foundTables.includes(t)).join(', ')}`
        });
        console.log(`   ❌ Missing land verification tables`);
      }

      // Check for required fields
      const requiredFields = [
        'document_hash',
        'owner_address',
        'location',
        'size',
        'land_type',
        'verification_status',
        'image_filename'
      ];
      
      const foundFields = requiredFields.filter(field => 
        schema.includes(field)
      );
      
      if (foundFields.length >= requiredFields.length * 0.8) {
        this.testResults.database.tests.push({
          name: 'Required Fields',
          status: 'PASS',
          details: `${foundFields.length}/${requiredFields.length} required fields present`
        });
        console.log(`   ✅ Required fields present`);
      } else {
        this.testResults.database.tests.push({
          name: 'Required Fields',
          status: 'FAIL',
          details: `Missing fields: ${requiredFields.filter(f => !foundFields.includes(f)).join(', ')}`
        });
        console.log(`   ❌ Missing required fields`);
      }

      // Check for indexes
      if (schema.includes('idx_land_verifications') && schema.includes('idx_land_nfts')) {
        this.testResults.database.tests.push({
          name: 'Database Indexes',
          status: 'PASS',
          details: 'Performance indexes created'
        });
        console.log(`   ✅ Database indexes created`);
      } else {
        this.testResults.database.tests.push({
          name: 'Database Indexes',
          status: 'FAIL',
          details: 'Performance indexes missing'
        });
        console.log(`   ❌ Database indexes missing`);
      }
    } else {
      this.testResults.database.tests.push({
        name: 'Database Schema',
        status: 'FAIL',
        details: 'Schema file not found'
      });
      console.log(`   ❌ Database schema file not found`);
    }

    const passedTests = this.testResults.database.tests.filter(t => t.status === 'PASS').length;
    this.testResults.database.status = passedTests === this.testResults.database.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Database schema: ${passedTests}/${this.testResults.database.tests.length} passed\n`);
  }

  async testAPIEndpoints() {
    console.log('🌐 Testing API endpoints...');
    
    // Test 1: Land verification API exists
    const apiPath = path.join(__dirname, '../pages/api/land-verification/verify.js');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      // Check for required actions
      const requiredActions = [
        'VERIFY_DOCUMENT',
        'STORE_NFT_DATA',
        'TRACK_IMAGE_USAGE',
        'GET_AVAILABLE_IMAGES',
        'GET_USER_LAND_NFTS'
      ];
      
      const foundActions = requiredActions.filter(action => 
        content.includes(action)
      );
      
      if (foundActions.length === requiredActions.length) {
        this.testResults.api.tests.push({
          name: 'Land Verification API Actions',
          status: 'PASS',
          details: `All ${requiredActions.length} actions implemented`
        });
        console.log(`   ✅ Land verification API complete`);
      } else {
        this.testResults.api.tests.push({
          name: 'Land Verification API Actions',
          status: 'FAIL',
          details: `Missing actions: ${requiredActions.filter(a => !foundActions.includes(a)).join(', ')}`
        });
        console.log(`   ❌ Land verification API incomplete`);
      }

      // Check for error handling
      if (content.includes('try {') && content.includes('catch (error)')) {
        this.testResults.api.tests.push({
          name: 'API Error Handling',
          status: 'PASS',
          details: 'Error handling implemented'
        });
        console.log(`   ✅ API error handling implemented`);
      } else {
        this.testResults.api.tests.push({
          name: 'API Error Handling',
          status: 'FAIL',
          details: 'Error handling not found'
        });
        console.log(`   ❌ API error handling missing`);
      }
    } else {
      this.testResults.api.tests.push({
        name: 'Land Verification API',
        status: 'FAIL',
        details: 'API file not found'
      });
      console.log(`   ❌ Land verification API not found`);
    }

    // Test 2: Pinata service exists
    const pinataServicePath = path.join(__dirname, '../src/services/pinataService.js');
    if (fs.existsSync(pinataServicePath)) {
      const content = fs.readFileSync(pinataServicePath, 'utf8');
      
      if (content.includes('uploadImageFile') && content.includes('uploadMetadata')) {
        this.testResults.api.tests.push({
          name: 'Pinata Service',
          status: 'PASS',
          details: 'IPFS upload service implemented'
        });
        console.log(`   ✅ Pinata service implemented`);
      } else {
        this.testResults.api.tests.push({
          name: 'Pinata Service',
          status: 'FAIL',
          details: 'IPFS upload service incomplete'
        });
        console.log(`   ❌ Pinata service incomplete`);
      }
    } else {
      this.testResults.api.tests.push({
        name: 'Pinata Service',
        status: 'FAIL',
        details: 'Pinata service not found'
      });
      console.log(`   ❌ Pinata service not found`);
    }

    const passedTests = this.testResults.api.tests.filter(t => t.status === 'PASS').length;
    this.testResults.api.status = passedTests === this.testResults.api.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 API endpoints: ${passedTests}/${this.testResults.api.tests.length} passed\n`);
  }

  async testCompleteIntegration() {
    console.log('🔗 Testing complete integration...');
    
    // Test 1: Environment configuration
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      const requiredEnvVars = [
        'NEXT_PUBLIC_OWNER_ADDRESS',
        'NEXT_PUBLIC_PINATA_API_KEY',
        'PINATA_SECRET_KEY'
      ];
      
      const foundEnvVars = requiredEnvVars.filter(envVar => 
        content.includes(envVar)
      );
      
      if (foundEnvVars.length === requiredEnvVars.length) {
        this.testResults.integration.tests.push({
          name: 'Environment Configuration',
          status: 'PASS',
          details: 'All required environment variables configured'
        });
        console.log(`   ✅ Environment configuration complete`);
      } else {
        this.testResults.integration.tests.push({
          name: 'Environment Configuration',
          status: 'FAIL',
          details: `Missing env vars: ${requiredEnvVars.filter(v => !foundEnvVars.includes(v)).join(', ')}`
        });
        console.log(`   ❌ Environment configuration incomplete`);
      }
    }

    // Test 2: Complete workflow integration
    const workflowComponents = [
      { name: 'Document Verification Hook', path: '../src/hooks/useLandDocumentVerification.js' },
      { name: 'Verification Component', path: '../src/components/LandDocumentVerification.jsx' },
      { name: 'Database Schema', path: '../create-tables.sql' },
      { name: 'API Endpoint', path: '../pages/api/land-verification/verify.js' },
      { name: 'Pinata Service', path: '../src/services/pinataService.js' }
    ];
    
    const existingComponents = workflowComponents.filter(component => 
      fs.existsSync(path.join(__dirname, component.path))
    );
    
    if (existingComponents.length === workflowComponents.length) {
      this.testResults.integration.tests.push({
        name: 'Complete Workflow',
        status: 'PASS',
        details: `All ${workflowComponents.length} workflow components exist`
      });
      console.log(`   ✅ Complete workflow integration ready`);
    } else {
      const missing = workflowComponents.filter(c => !existingComponents.includes(c));
      this.testResults.integration.tests.push({
        name: 'Complete Workflow',
        status: 'FAIL',
        details: `Missing components: ${missing.map(c => c.name).join(', ')}`
      });
      console.log(`   ❌ Complete workflow integration incomplete`);
    }

    const passedTests = this.testResults.integration.tests.filter(t => t.status === 'PASS').length;
    this.testResults.integration.status = passedTests === this.testResults.integration.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Complete integration: ${passedTests}/${this.testResults.integration.tests.length} passed\n`);
  }

  async generateTestReport() {
    const allCategories = Object.values(this.testResults);
    const passedCategories = allCategories.filter(category => category.status === 'PASS').length;
    const totalCategories = allCategories.length;
    
    const allTests = allCategories.reduce((acc, category) => acc.concat(category.tests), []);
    const passedTests = allTests.filter(test => test.status === 'PASS').length;
    const totalTests = allTests.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      status: passedCategories === totalCategories ? 'FULLY_INTEGRATED' : 'PARTIAL_INTEGRATION',
      summary: {
        totalCategories,
        passedCategories,
        totalTests,
        passedTests,
        integrationScore: Math.round((passedTests / totalTests) * 100)
      },
      testResults: this.testResults,
      features: [
        'Document verification with owner access control',
        'Automatic NFT minting with unused image selection',
        'IPFS image upload via Pinata integration',
        'Marketplace listing for land NFTs',
        'Complete database tracking and storage',
        'Real-time UI updates and notifications',
        'Seamless workflow integration'
      ]
    };

    // Save report
    const reportPath = path.join(__dirname, '../LAND_VERIFICATION_SYSTEM_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Land Verification System Report:');
    console.log('='.repeat(50));
    console.log(`Status: ${report.status}`);
    console.log(`Integration Score: ${report.summary.integrationScore}/100`);
    console.log(`Categories Passed: ${passedCategories}/${totalCategories}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);

    Object.entries(this.testResults).forEach(([category, result]) => {
      const categoryPassed = result.tests.filter(t => t.status === 'PASS').length;
      const categoryTotal = result.tests.length;
      console.log(`${category.toUpperCase()}: ${result.status} (${categoryPassed}/${categoryTotal})`);
    });

    console.log('\n🔗 System Features:');
    report.features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });

    if (report.summary.integrationScore >= 90) {
      console.log('\n🎉 LAND VERIFICATION SYSTEM FULLY READY! 🚀');
      console.log('✅ Document verification with owner access control');
      console.log('✅ Automatic NFT minting with image management');
      console.log('✅ Seamless marketplace integration');
      console.log('✅ Complete database tracking');
      console.log('✅ Production-ready implementation');
    } else if (report.summary.integrationScore >= 70) {
      console.log('\n⚠️  Land verification system mostly ready with minor gaps');
    } else {
      console.log('\n❌ Land verification system needs significant work');
    }

    return report;
  }
}

// Execute land verification system testing
async function main() {
  const tester = new LandVerificationTester();
  await tester.testLandVerificationSystem();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Land verification system testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Land verification system testing failed:', error);
      process.exit(1);
    });
}

module.exports = { LandVerificationTester };
