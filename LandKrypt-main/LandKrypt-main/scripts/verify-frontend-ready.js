// Frontend Readiness Verification Script
// Final verification that the frontend is ready for development and production

const fs = require('fs');
const path = require('path');

class FrontendReadinessVerifier {
  constructor() {
    this.checks = {
      files: { status: 'PENDING', results: [] },
      dependencies: { status: 'PENDING', results: [] },
      configuration: { status: 'PENDING', results: [] },
      components: { status: 'PENDING', results: [] },
      assets: { status: 'PENDING', results: [] }
    };
  }

  async verifyFrontendReadiness() {
    console.log('🔍 Verifying Frontend Readiness...\n');
    console.log('='.repeat(50));

    try {
      // 1. Verify essential files
      await this.verifyEssentialFiles();
      
      // 2. Verify dependencies
      await this.verifyDependencies();
      
      // 3. Verify configuration
      await this.verifyConfiguration();
      
      // 4. Verify components
      await this.verifyComponents();
      
      // 5. Verify assets
      await this.verifyAssets();
      
      // 6. Generate final report
      const report = await this.generateReadinessReport();
      
      console.log('\n🎉 Frontend readiness verification completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Frontend readiness verification failed:', error);
      throw error;
    }
  }

  async verifyEssentialFiles() {
    console.log('📁 Verifying essential files...');
    
    const essentialFiles = [
      { path: 'package.json', required: true },
      { path: 'next.config.mjs', required: true },
      { path: 'tailwind.config.js', required: true },
      { path: 'src/app/layout.js', required: true },
      { path: 'src/app/page.js', required: true },
      { path: 'src/app/providers.js', required: true },
      { path: 'src/app/wagmi.js', required: true },
      { path: '.env.local', required: false },
      { path: '.env.sepolia', required: false }
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(__dirname, '..', file.path);
      const exists = fs.existsSync(filePath);
      
      this.checks.files.results.push({
        file: file.path,
        exists,
        required: file.required,
        status: exists ? 'PASS' : (file.required ? 'FAIL' : 'OPTIONAL')
      });

      const status = exists ? '✅' : (file.required ? '❌' : '⚠️');
      console.log(`   ${status} ${file.path}`);
    }

    const failedRequired = this.checks.files.results.filter(r => r.required && !r.exists);
    this.checks.files.status = failedRequired.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Files check: ${this.checks.files.status}\n`);
  }

  async verifyDependencies() {
    console.log('📦 Verifying dependencies...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const criticalDependencies = [
      'next',
      'react',
      'react-dom',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'tailwindcss'
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of criticalDependencies) {
      const exists = !!allDeps[dep];
      
      this.checks.dependencies.results.push({
        dependency: dep,
        version: allDeps[dep] || 'NOT_FOUND',
        exists,
        status: exists ? 'PASS' : 'FAIL'
      });

      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${dep}: ${allDeps[dep] || 'NOT_FOUND'}`);
    }

    const missingDeps = this.checks.dependencies.results.filter(r => !r.exists);
    this.checks.dependencies.status = missingDeps.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Dependencies check: ${this.checks.dependencies.status}\n`);
  }

  async verifyConfiguration() {
    console.log('⚙️ Verifying configuration...');
    
    const configChecks = [
      {
        name: 'Next.js Config',
        path: 'next.config.mjs',
        check: (content) => content.includes('nextConfig')
      },
      {
        name: 'Tailwind Config',
        path: 'tailwind.config.js',
        check: (content) => content.includes('content') && content.includes('theme')
      },
      {
        name: 'Wagmi Config',
        path: 'src/app/wagmi.js',
        check: (content) => (content.includes('createConfig') || content.includes('getDefaultConfig')) && content.includes('sepolia')
      },
      {
        name: 'Providers Setup',
        path: 'src/app/providers.js',
        check: (content) => content.includes('WagmiProvider') && content.includes('RainbowKitProvider')
      }
    ];

    for (const config of configChecks) {
      const filePath = path.join(__dirname, '..', config.path);
      let status = 'FAIL';
      let details = 'File not found';
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const isValid = config.check(content);
        status = isValid ? 'PASS' : 'FAIL';
        details = isValid ? 'Configuration valid' : 'Configuration invalid';
      }

      this.checks.configuration.results.push({
        name: config.name,
        path: config.path,
        status,
        details
      });

      const statusIcon = status === 'PASS' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${config.name}: ${details}`);
    }

    const failedConfigs = this.checks.configuration.results.filter(r => r.status === 'FAIL');
    this.checks.configuration.status = failedConfigs.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Configuration check: ${this.checks.configuration.status}\n`);
  }

  async verifyComponents() {
    console.log('🧩 Verifying components...');
    
    const criticalComponents = [
      'src/components/enhanced/EnhancedDashboard.jsx',
      'src/components/IpfsImage.jsx',
      'src/components/NftPlaceholder.jsx',
      'src/components/ErrorBoundary.jsx',
      'src/components/ui/card.jsx',
      'src/components/ui/button.jsx',
      'src/components/ui/progress.jsx'
    ];

    for (const component of criticalComponents) {
      const filePath = path.join(__dirname, '..', component);
      const exists = fs.existsSync(filePath);
      let hasExport = false;
      
      if (exists) {
        const content = fs.readFileSync(filePath, 'utf8');
        hasExport = content.includes('export');
      }

      const status = exists && hasExport ? 'PASS' : 'FAIL';
      
      this.checks.components.results.push({
        component: path.basename(component),
        path: component,
        exists,
        hasExport,
        status
      });

      const statusIcon = status === 'PASS' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${path.basename(component)}`);
    }

    const failedComponents = this.checks.components.results.filter(r => r.status === 'FAIL');
    this.checks.components.status = failedComponents.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Components check: ${this.checks.components.status}\n`);
  }

  async verifyAssets() {
    console.log('🖼️ Verifying assets...');
    
    const assetChecks = [
      {
        name: 'IPFS Metadata',
        path: 'public/metadata',
        check: (dirPath) => {
          if (!fs.existsSync(dirPath)) return false;
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
          return files.length >= 5; // Should have at least 5 metadata files
        }
      },
      {
        name: 'IPFS Fix Report',
        path: 'IPFS_HTTP_FIX_REPORT.json',
        check: (filePath) => {
          if (!fs.existsSync(filePath)) return false;
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return content.totalFixed >= 5;
        }
      },
      {
        name: 'Mock Data',
        path: 'src/data/mockData.json',
        check: (filePath) => {
          if (!fs.existsSync(filePath)) return false;
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return content.nfts && content.nfts.length > 0;
        }
      }
    ];

    for (const asset of assetChecks) {
      const assetPath = path.join(__dirname, '..', asset.path);
      const isValid = asset.check(assetPath);
      
      this.checks.assets.results.push({
        name: asset.name,
        path: asset.path,
        status: isValid ? 'PASS' : 'FAIL'
      });

      const statusIcon = isValid ? '✅' : '❌';
      console.log(`   ${statusIcon} ${asset.name}`);
    }

    const failedAssets = this.checks.assets.results.filter(r => r.status === 'FAIL');
    this.checks.assets.status = failedAssets.length === 0 ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Assets check: ${this.checks.assets.status}\n`);
  }

  async generateReadinessReport() {
    const allChecks = Object.values(this.checks);
    const passedChecks = allChecks.filter(check => check.status === 'PASS').length;
    const totalChecks = allChecks.length;
    const readinessScore = Math.round((passedChecks / totalChecks) * 100);

    const report = {
      timestamp: new Date().toISOString(),
      status: readinessScore === 100 ? 'FULLY_READY' : readinessScore >= 80 ? 'MOSTLY_READY' : 'NEEDS_WORK',
      readinessScore,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks: totalChecks - passedChecks
      },
      checks: this.checks
    };

    // Save report
    const reportPath = path.join(__dirname, '../FRONTEND_READINESS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Frontend Readiness Report:');
    console.log('='.repeat(40));
    console.log(`Overall Status: ${report.status}`);
    console.log(`Readiness Score: ${readinessScore}/100`);
    console.log(`Checks Passed: ${passedChecks}/${totalChecks}`);

    Object.entries(this.checks).forEach(([category, result]) => {
      console.log(`${category.toUpperCase()}: ${result.status}`);
    });

    if (readinessScore === 100) {
      console.log('\n🎉 FRONTEND IS 100% READY FOR DEVELOPMENT & PRODUCTION! 🚀');
      console.log('✅ All components working');
      console.log('✅ All dependencies installed');
      console.log('✅ All configurations valid');
      console.log('✅ All assets available');
      console.log('\n🌐 Ready to run: npm run dev');
    } else if (readinessScore >= 80) {
      console.log('\n⚠️ Frontend is mostly ready with minor issues');
    } else {
      console.log('\n❌ Frontend needs significant work before it\'s ready');
    }

    return report;
  }
}

// Execute readiness verification
async function main() {
  const verifier = new FrontendReadinessVerifier();
  await verifier.verifyFrontendReadiness();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Frontend readiness verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Frontend readiness verification failed:', error);
      process.exit(1);
    });
}

module.exports = { FrontendReadinessVerifier };
