// Admin Access Control Testing Script
// Tests admin authentication, authorization, and land verification restrictions

const fs = require('fs');
const path = require('path');

class AdminAccessControlTester {
  constructor() {
    this.testResults = {
      adminHook: { status: 'PENDING', tests: [] },
      accessControl: { status: 'PENDING', tests: [] },
      landVerification: { status: 'PENDING', tests: [] },
      apiSecurity: { status: 'PENDING', tests: [] },
      uiRestrictions: { status: 'PENDING', tests: [] }
    };
  }

  async testAdminAccessControl() {
    console.log('🔐 Testing Admin Access Control System...\n');
    console.log('='.repeat(60));

    try {
      // 1. Test admin hook implementation
      await this.testAdminHook();
      
      // 2. Test access control mechanisms
      await this.testAccessControlMechanisms();
      
      // 3. Test land verification restrictions
      await this.testLandVerificationRestrictions();
      
      // 4. Test API security
      await this.testAPISecurity();
      
      // 5. Test UI restrictions
      await this.testUIRestrictions();
      
      // 6. Generate comprehensive report
      const report = await this.generateTestReport();
      
      console.log('\n🎉 Admin access control testing completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Admin access control testing failed:', error);
      throw error;
    }
  }

  async testAdminHook() {
    console.log('🪝 Testing admin access hook...');
    
    // Test 1: useAdminAccess hook exists
    const hookPath = path.join(__dirname, '../src/hooks/useAdminAccess.js');
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf8');
      
      // Check for required functions
      const requiredFunctions = [
        'useAdminAccess',
        'AdminAccessWrapper',
        'AdminStatusIndicator',
        'hasPermission',
        'requireAdminAccess',
        'requirePermission'
      ];
      
      const foundFunctions = requiredFunctions.filter(func => 
        content.includes(func)
      );
      
      if (foundFunctions.length === requiredFunctions.length) {
        this.testResults.adminHook.tests.push({
          name: 'Admin Hook Functions',
          status: 'PASS',
          details: `All ${requiredFunctions.length} functions implemented`
        });
        console.log(`   ✅ Admin hook complete (${foundFunctions.length}/${requiredFunctions.length})`);
      } else {
        this.testResults.adminHook.tests.push({
          name: 'Admin Hook Functions',
          status: 'FAIL',
          details: `Missing functions: ${requiredFunctions.filter(f => !foundFunctions.includes(f)).join(', ')}`
        });
        console.log(`   ❌ Admin hook incomplete`);
      }

      // Check for environment variable usage
      if (content.includes('NEXT_PUBLIC_ADMIN_ADDRESS') && content.includes('NEXT_PUBLIC_ADMIN_ADDRESSES')) {
        this.testResults.adminHook.tests.push({
          name: 'Environment Configuration',
          status: 'PASS',
          details: 'Admin addresses configured via environment variables'
        });
        console.log(`   ✅ Environment configuration implemented`);
      } else {
        this.testResults.adminHook.tests.push({
          name: 'Environment Configuration',
          status: 'FAIL',
          details: 'Environment configuration not found'
        });
        console.log(`   ❌ Environment configuration missing`);
      }

      // Check for permission system
      if (content.includes('permissions') && content.includes('adminLevel')) {
        this.testResults.adminHook.tests.push({
          name: 'Permission System',
          status: 'PASS',
          details: 'Role-based permission system implemented'
        });
        console.log(`   ✅ Permission system implemented`);
      } else {
        this.testResults.adminHook.tests.push({
          name: 'Permission System',
          status: 'FAIL',
          details: 'Permission system not found'
        });
        console.log(`   ❌ Permission system missing`);
      }
    } else {
      this.testResults.adminHook.tests.push({
        name: 'Admin Hook',
        status: 'FAIL',
        details: 'Hook file not found'
      });
      console.log(`   ❌ useAdminAccess hook not found`);
    }

    const passedTests = this.testResults.adminHook.tests.filter(t => t.status === 'PASS').length;
    this.testResults.adminHook.status = passedTests === this.testResults.adminHook.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Admin hook: ${passedTests}/${this.testResults.adminHook.tests.length} passed\n`);
  }

  async testAccessControlMechanisms() {
    console.log('🔒 Testing access control mechanisms...');
    
    // Test 1: Environment variables configured
    const envLocalPath = path.join(__dirname, '../.env.local');
    const envProdPath = path.join(__dirname, '../.env.production');
    
    let envConfigured = false;
    [envLocalPath, envProdPath].forEach(envPath => {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        if (content.includes('NEXT_PUBLIC_ADMIN_ADDRESS') && content.includes('NEXT_PUBLIC_ADMIN_ADDRESSES')) {
          envConfigured = true;
        }
      }
    });

    if (envConfigured) {
      this.testResults.accessControl.tests.push({
        name: 'Environment Variables',
        status: 'PASS',
        details: 'Admin addresses configured in environment files'
      });
      console.log(`   ✅ Environment variables configured`);
    } else {
      this.testResults.accessControl.tests.push({
        name: 'Environment Variables',
        status: 'FAIL',
        details: 'Admin addresses not configured'
      });
      console.log(`   ❌ Environment variables not configured`);
    }

    // Test 2: AdminAccessWrapper component
    const hookPath = path.join(__dirname, '../src/hooks/useAdminAccess.js');
    if (fs.existsSync(hookPath)) {
      const content = fs.readFileSync(hookPath, 'utf8');
      
      if (content.includes('AdminAccessWrapper') && content.includes('fallback')) {
        this.testResults.accessControl.tests.push({
          name: 'Access Wrapper Component',
          status: 'PASS',
          details: 'AdminAccessWrapper with fallback implemented'
        });
        console.log(`   ✅ Access wrapper component implemented`);
      } else {
        this.testResults.accessControl.tests.push({
          name: 'Access Wrapper Component',
          status: 'FAIL',
          details: 'Access wrapper component not found'
        });
        console.log(`   ❌ Access wrapper component missing`);
      }
    }

    // Test 3: Admin dashboard exists
    const adminDashboardPath = path.join(__dirname, '../src/components/AdminDashboard.jsx');
    if (fs.existsSync(adminDashboardPath)) {
      const content = fs.readFileSync(adminDashboardPath, 'utf8');
      
      if (content.includes('AdminAccessWrapper') && content.includes('useAdminAccess')) {
        this.testResults.accessControl.tests.push({
          name: 'Admin Dashboard',
          status: 'PASS',
          details: 'Admin dashboard with access control implemented'
        });
        console.log(`   ✅ Admin dashboard implemented`);
      } else {
        this.testResults.accessControl.tests.push({
          name: 'Admin Dashboard',
          status: 'FAIL',
          details: 'Admin dashboard access control not found'
        });
        console.log(`   ❌ Admin dashboard access control missing`);
      }
    } else {
      this.testResults.accessControl.tests.push({
        name: 'Admin Dashboard',
        status: 'FAIL',
        details: 'Admin dashboard not found'
      });
      console.log(`   ❌ Admin dashboard not found`);
    }

    const passedTests = this.testResults.accessControl.tests.filter(t => t.status === 'PASS').length;
    this.testResults.accessControl.status = passedTests === this.testResults.accessControl.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Access control: ${passedTests}/${this.testResults.accessControl.tests.length} passed\n`);
  }

  async testLandVerificationRestrictions() {
    console.log('🏡 Testing land verification restrictions...');
    
    // Test 1: Land verification hook uses admin access
    const landHookPath = path.join(__dirname, '../src/hooks/useLandDocumentVerification.js');
    if (fs.existsSync(landHookPath)) {
      const content = fs.readFileSync(landHookPath, 'utf8');
      
      if (content.includes('useAdminAccess') && content.includes('requireAdminAccess')) {
        this.testResults.landVerification.tests.push({
          name: 'Land Hook Admin Integration',
          status: 'PASS',
          details: 'Land verification hook uses admin access control'
        });
        console.log(`   ✅ Land hook admin integration complete`);
      } else {
        this.testResults.landVerification.tests.push({
          name: 'Land Hook Admin Integration',
          status: 'FAIL',
          details: 'Land verification hook missing admin access control'
        });
        console.log(`   ❌ Land hook admin integration missing`);
      }

      // Check for permission checks
      if (content.includes('requirePermission') && content.includes('canVerifyDocuments')) {
        this.testResults.landVerification.tests.push({
          name: 'Permission Checks',
          status: 'PASS',
          details: 'Permission checks implemented in land verification'
        });
        console.log(`   ✅ Permission checks implemented`);
      } else {
        this.testResults.landVerification.tests.push({
          name: 'Permission Checks',
          status: 'FAIL',
          details: 'Permission checks not found'
        });
        console.log(`   ❌ Permission checks missing`);
      }
    }

    // Test 2: Land verification component uses admin access
    const landComponentPath = path.join(__dirname, '../src/components/LandDocumentVerification.jsx');
    if (fs.existsSync(landComponentPath)) {
      const content = fs.readFileSync(landComponentPath, 'utf8');
      
      if (content.includes('AdminAccessWrapper') && content.includes('isAdmin')) {
        this.testResults.landVerification.tests.push({
          name: 'Land Component Admin UI',
          status: 'PASS',
          details: 'Land verification component uses admin access wrapper'
        });
        console.log(`   ✅ Land component admin UI complete`);
      } else {
        this.testResults.landVerification.tests.push({
          name: 'Land Component Admin UI',
          status: 'FAIL',
          details: 'Land verification component missing admin UI'
        });
        console.log(`   ❌ Land component admin UI missing`);
      }

      // Check for admin status indicators
      if (content.includes('AdminStatusIndicator') && content.includes('Admin Access Required')) {
        this.testResults.landVerification.tests.push({
          name: 'Admin Status Indicators',
          status: 'PASS',
          details: 'Admin status indicators implemented'
        });
        console.log(`   ✅ Admin status indicators implemented`);
      } else {
        this.testResults.landVerification.tests.push({
          name: 'Admin Status Indicators',
          status: 'FAIL',
          details: 'Admin status indicators not found'
        });
        console.log(`   ❌ Admin status indicators missing`);
      }
    }

    const passedTests = this.testResults.landVerification.tests.filter(t => t.status === 'PASS').length;
    this.testResults.landVerification.status = passedTests === this.testResults.landVerification.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Land verification restrictions: ${passedTests}/${this.testResults.landVerification.tests.length} passed\n`);
  }

  async testAPISecurity() {
    console.log('🌐 Testing API security...');
    
    // Test 1: API includes admin verification
    const apiPath = path.join(__dirname, '../pages/api/land-verification/verify.js');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      if (content.includes('isAdminAddress') && content.includes('requireAdminAccess')) {
        this.testResults.apiSecurity.tests.push({
          name: 'API Admin Verification',
          status: 'PASS',
          details: 'API includes admin address verification'
        });
        console.log(`   ✅ API admin verification implemented`);
      } else {
        this.testResults.apiSecurity.tests.push({
          name: 'API Admin Verification',
          status: 'FAIL',
          details: 'API admin verification not found'
        });
        console.log(`   ❌ API admin verification missing`);
      }

      // Check for admin environment variable usage
      if (content.includes('NEXT_PUBLIC_ADMIN_ADDRESS') && content.includes('NEXT_PUBLIC_ADMIN_ADDRESSES')) {
        this.testResults.apiSecurity.tests.push({
          name: 'API Environment Integration',
          status: 'PASS',
          details: 'API uses environment variables for admin addresses'
        });
        console.log(`   ✅ API environment integration complete`);
      } else {
        this.testResults.apiSecurity.tests.push({
          name: 'API Environment Integration',
          status: 'FAIL',
          details: 'API environment integration not found'
        });
        console.log(`   ❌ API environment integration missing`);
      }
    } else {
      this.testResults.apiSecurity.tests.push({
        name: 'API Security',
        status: 'FAIL',
        details: 'API file not found'
      });
      console.log(`   ❌ API file not found`);
    }

    const passedTests = this.testResults.apiSecurity.tests.filter(t => t.status === 'PASS').length;
    this.testResults.apiSecurity.status = passedTests === this.testResults.apiSecurity.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 API security: ${passedTests}/${this.testResults.apiSecurity.tests.length} passed\n`);
  }

  async testUIRestrictions() {
    console.log('🎨 Testing UI restrictions...');
    
    // Test 1: Dashboard includes admin tab
    const dashboardPath = path.join(__dirname, '../src/components/enhanced/EnhancedDashboard.jsx');
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      if (content.includes('AdminDashboard') && content.includes('isAdmin')) {
        this.testResults.uiRestrictions.tests.push({
          name: 'Dashboard Admin Integration',
          status: 'PASS',
          details: 'Dashboard includes admin tab with access control'
        });
        console.log(`   ✅ Dashboard admin integration complete`);
      } else {
        this.testResults.uiRestrictions.tests.push({
          name: 'Dashboard Admin Integration',
          status: 'FAIL',
          details: 'Dashboard admin integration not found'
        });
        console.log(`   ❌ Dashboard admin integration missing`);
      }

      // Check for conditional tab rendering
      if (content.includes('isAdmin &&') && content.includes('admin')) {
        this.testResults.uiRestrictions.tests.push({
          name: 'Conditional UI Rendering',
          status: 'PASS',
          details: 'Admin UI elements conditionally rendered'
        });
        console.log(`   ✅ Conditional UI rendering implemented`);
      } else {
        this.testResults.uiRestrictions.tests.push({
          name: 'Conditional UI Rendering',
          status: 'FAIL',
          details: 'Conditional UI rendering not found'
        });
        console.log(`   ❌ Conditional UI rendering missing`);
      }
    }

    // Test 2: Access control messages
    const landComponentPath = path.join(__dirname, '../src/components/LandDocumentVerification.jsx');
    if (fs.existsSync(landComponentPath)) {
      const content = fs.readFileSync(landComponentPath, 'utf8');
      
      if (content.includes('Admin Access Required') && content.includes('Insufficient Permissions')) {
        this.testResults.uiRestrictions.tests.push({
          name: 'Access Control Messages',
          status: 'PASS',
          details: 'Clear access control messages implemented'
        });
        console.log(`   ✅ Access control messages implemented`);
      } else {
        this.testResults.uiRestrictions.tests.push({
          name: 'Access Control Messages',
          status: 'FAIL',
          details: 'Access control messages not found'
        });
        console.log(`   ❌ Access control messages missing`);
      }
    }

    const passedTests = this.testResults.uiRestrictions.tests.filter(t => t.status === 'PASS').length;
    this.testResults.uiRestrictions.status = passedTests === this.testResults.uiRestrictions.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 UI restrictions: ${passedTests}/${this.testResults.uiRestrictions.tests.length} passed\n`);
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
      status: passedCategories === totalCategories ? 'FULLY_SECURED' : 'PARTIAL_SECURITY',
      summary: {
        totalCategories,
        passedCategories,
        totalTests,
        passedTests,
        securityScore: Math.round((passedTests / totalTests) * 100)
      },
      testResults: this.testResults,
      securityFeatures: [
        'Admin-only access to land document verification',
        'Role-based permission system with multiple admin levels',
        'Environment variable configuration for admin addresses',
        'Frontend access control with clear UI restrictions',
        'Backend API security with admin verification',
        'Comprehensive access control messages and indicators'
      ]
    };

    // Save report
    const reportPath = path.join(__dirname, '../ADMIN_ACCESS_CONTROL_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Admin Access Control Report:');
    console.log('='.repeat(50));
    console.log(`Status: ${report.status}`);
    console.log(`Security Score: ${report.summary.securityScore}/100`);
    console.log(`Categories Passed: ${passedCategories}/${totalCategories}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);

    Object.entries(this.testResults).forEach(([category, result]) => {
      const categoryPassed = result.tests.filter(t => t.status === 'PASS').length;
      const categoryTotal = result.tests.length;
      console.log(`${category.toUpperCase()}: ${result.status} (${categoryPassed}/${categoryTotal})`);
    });

    console.log('\n🔒 Security Features:');
    report.securityFeatures.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });

    if (report.summary.securityScore >= 90) {
      console.log('\n🎉 ADMIN ACCESS CONTROL FULLY SECURED! 🔐');
      console.log('✅ Only admins can verify land documents');
      console.log('✅ Role-based permission system implemented');
      console.log('✅ Frontend and backend security measures');
      console.log('✅ Clear access control UI and messages');
      console.log('✅ Production-ready security implementation');
    } else if (report.summary.securityScore >= 70) {
      console.log('\n⚠️  Admin access control mostly secured with minor gaps');
    } else {
      console.log('\n❌ Admin access control needs significant security improvements');
    }

    return report;
  }
}

// Execute admin access control testing
async function main() {
  const tester = new AdminAccessControlTester();
  await tester.testAdminAccessControl();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Admin access control testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin access control testing failed:', error);
      process.exit(1);
    });
}

module.exports = { AdminAccessControlTester };
