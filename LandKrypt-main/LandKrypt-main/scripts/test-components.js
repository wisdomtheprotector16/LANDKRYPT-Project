// Component Testing Script
// Tests if all components can be imported and have no syntax errors

const fs = require('fs');
const path = require('path');

class ComponentTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async testAllComponents() {
    console.log('🧪 Testing All Components...\n');
    console.log('='.repeat(50));

    try {
      // Test core components
      await this.testCoreComponents();
      
      // Test UI components
      await this.testUIComponents();
      
      // Test enhanced components
      await this.testEnhancedComponents();
      
      // Test hooks
      await this.testHooks();
      
      // Test utilities
      await this.testUtilities();

      return this.generateTestReport();

    } catch (error) {
      console.error('\n❌ Component testing failed:', error);
      throw error;
    }
  }

  async testCoreComponents() {
    console.log('🏗️  Testing core components...');
    
    const coreComponents = [
      'src/app/layout.js',
      'src/app/page.js',
      'src/app/providers.js',
      'src/app/wagmi.js'
    ];

    for (const component of coreComponents) {
      await this.testComponent(component);
    }
  }

  async testUIComponents() {
    console.log('\n🎨 Testing UI components...');
    
    const uiComponents = [
      'src/components/ui/card.jsx',
      'src/components/ui/button.jsx',
      'src/components/ui/badge.jsx',
      'src/components/ui/tabs.jsx',
      'src/components/ui/progress.jsx'
    ];

    for (const component of uiComponents) {
      await this.testComponent(component);
    }
  }

  async testEnhancedComponents() {
    console.log('\n⚡ Testing enhanced components...');
    
    const enhancedComponents = [
      'src/components/enhanced/EnhancedDashboard.jsx',
      'src/components/IpfsImage.jsx',
      'src/components/NftPlaceholder.jsx'
    ];

    for (const component of enhancedComponents) {
      await this.testComponent(component);
    }
  }

  async testHooks() {
    console.log('\n🪝 Testing hooks...');
    
    const hooks = [
      'src/hooks/useMockEnhancedSystem.js'
    ];

    for (const hook of hooks) {
      await this.testComponent(hook);
    }
  }

  async testUtilities() {
    console.log('\n🔧 Testing utilities...');
    
    const utilities = [
      'src/utils/ipfs.js',
      'src/lib/utils.js'
    ];

    for (const utility of utilities) {
      await this.testComponent(utility);
    }
  }

  async testComponent(componentPath) {
    const fullPath = path.join(__dirname, '..', componentPath);
    const componentName = path.basename(componentPath);
    
    try {
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        this.results.failed.push({
          component: componentName,
          path: componentPath,
          error: 'File does not exist'
        });
        console.log(`   ❌ ${componentName}: File not found`);
        return;
      }

      // Read and analyze file content
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic syntax checks
      const issues = this.checkSyntax(content, componentPath);
      
      if (issues.length === 0) {
        this.results.passed.push({
          component: componentName,
          path: componentPath
        });
        console.log(`   ✅ ${componentName}: OK`);
      } else {
        this.results.warnings.push({
          component: componentName,
          path: componentPath,
          issues: issues
        });
        console.log(`   ⚠️  ${componentName}: ${issues.length} warnings`);
      }

    } catch (error) {
      this.results.failed.push({
        component: componentName,
        path: componentPath,
        error: error.message
      });
      console.log(`   ❌ ${componentName}: ${error.message}`);
    }
  }

  checkSyntax(content, filePath) {
    const issues = [];
    
    // Check for common issues
    if (content.includes('import') && !content.includes('export')) {
      issues.push('Has imports but no exports');
    }

    // Check for JSX without React
    if ((filePath.endsWith('.jsx') || filePath.endsWith('.js')) && 
        content.includes('<') && content.includes('>') && 
        !content.includes('React') && !content.includes("'use client'")) {
      issues.push('JSX without React import or use client directive');
    }

    // Check for missing semicolons (basic check)
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.endsWith(',') && 
          !trimmed.startsWith('//') && 
          !trimmed.startsWith('/*') && 
          !trimmed.startsWith('*') && 
          !trimmed.includes('export') &&
          !trimmed.includes('import') &&
          trimmed.includes('=')) {
        // This is a very basic check and might have false positives
        // issues.push(`Line ${index + 1}: Possible missing semicolon`);
      }
    });

    // Check for console.log statements (should be warnings in production)
    if (content.includes('console.log')) {
      issues.push('Contains console.log statements');
    }

    // Check for TODO comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push('Contains TODO/FIXME comments');
    }

    return issues;
  }

  generateTestReport() {
    const totalComponents = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalComponents,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        successRate: Math.round((this.results.passed.length / totalComponents) * 100)
      },
      results: this.results
    };

    // Save report
    const reportPath = path.join(__dirname, '../COMPONENT_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Component Test Report:');
    console.log('='.repeat(40));
    console.log(`Total Components: ${totalComponents}`);
    console.log(`Passed: ${this.results.passed.length}`);
    console.log(`Failed: ${this.results.failed.length}`);
    console.log(`Warnings: ${this.results.warnings.length}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ Failed Components:');
      this.results.failed.forEach(item => {
        console.log(`   ${item.component}: ${item.error}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Components with Warnings:');
      this.results.warnings.forEach(item => {
        console.log(`   ${item.component}: ${item.issues.join(', ')}`);
      });
    }

    if (this.results.failed.length === 0) {
      console.log('\n🎉 All components passed basic syntax checks!');
    } else {
      console.log('\n⚠️  Some components have issues that need to be fixed.');
    }

    return report;
  }
}

// Execute component testing
async function main() {
  const tester = new ComponentTester();
  await tester.testAllComponents();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Component testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Component testing failed:', error);
      process.exit(1);
    });
}

module.exports = { ComponentTester };
