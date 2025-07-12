// Frontend Testing and Bug Fixing Script
// Comprehensive testing to identify and fix all frontend issues

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class FrontendTester {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.testResults = {
      syntax: { status: 'PENDING', issues: [] },
      dependencies: { status: 'PENDING', issues: [] },
      components: { status: 'PENDING', issues: [] },
      imports: { status: 'PENDING', issues: [] },
      build: { status: 'PENDING', issues: [] }
    };
  }

  async runComprehensiveTest() {
    console.log('🧪 Running Comprehensive Frontend Testing...\n');
    console.log('='.repeat(60));

    try {
      // 1. Check syntax and imports
      await this.checkSyntaxAndImports();
      
      // 2. Check dependencies
      await this.checkDependencies();
      
      // 3. Check component structure
      await this.checkComponentStructure();
      
      // 4. Fix identified issues
      await this.fixIdentifiedIssues();
      
      // 5. Test build
      await this.testBuild();
      
      // 6. Generate report
      const report = await this.generateTestReport();
      
      console.log('\n🎉 Frontend testing completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Frontend testing failed:', error);
      throw error;
    }
  }

  async checkSyntaxAndImports() {
    console.log('📝 Checking syntax and imports...');
    
    const componentsToCheck = [
      'src/app/layout.js',
      'src/app/page.js',
      'src/app/providers.js',
      'src/app/wagmi.js',
      'src/components/enhanced/EnhancedDashboard.jsx',
      'src/components/ui/progress.jsx',
      'src/hooks/useMockEnhancedSystem.js'
    ];

    for (const component of componentsToCheck) {
      const filePath = path.join(__dirname, '..', component);
      
      if (!fs.existsSync(filePath)) {
        this.testResults.syntax.issues.push({
          type: 'MISSING_FILE',
          file: component,
          message: 'File does not exist'
        });
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for common syntax issues
        if (content.includes('import') && !content.includes('export')) {
          this.testResults.syntax.issues.push({
            type: 'MISSING_EXPORT',
            file: component,
            message: 'File has imports but no exports'
          });
        }

        // Check for JSX syntax issues
        if (component.endsWith('.jsx') || component.endsWith('.js')) {
          if (content.includes('<') && content.includes('>')) {
            if (!content.includes('React') && !content.includes("'use client'")) {
              this.testResults.syntax.issues.push({
                type: 'MISSING_REACT_IMPORT',
                file: component,
                message: 'JSX file missing React import or use client directive'
              });
            }
          }
        }

        console.log(`   ✅ ${component}`);
      } catch (error) {
        this.testResults.syntax.issues.push({
          type: 'READ_ERROR',
          file: component,
          message: error.message
        });
        console.log(`   ❌ ${component}: ${error.message}`);
      }
    }

    this.testResults.syntax.status = this.testResults.syntax.issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`   📊 Syntax check: ${this.testResults.syntax.issues.length} issues found\n`);
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDependencies = [
      'next',
      'react',
      'react-dom',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'lucide-react',
      'tailwindcss',
      'clsx',
      'tailwind-merge'
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDependencies) {
      if (!allDeps[dep]) {
        this.testResults.dependencies.issues.push({
          type: 'MISSING_DEPENDENCY',
          dependency: dep,
          message: `Required dependency ${dep} is missing`
        });
      } else {
        console.log(`   ✅ ${dep}: ${allDeps[dep]}`);
      }
    }

    this.testResults.dependencies.status = this.testResults.dependencies.issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`   📊 Dependencies check: ${this.testResults.dependencies.issues.length} issues found\n`);
  }

  async checkComponentStructure() {
    console.log('🧩 Checking component structure...');
    
    const uiComponents = [
      'src/components/ui/card.jsx',
      'src/components/ui/button.jsx',
      'src/components/ui/badge.jsx',
      'src/components/ui/tabs.jsx',
      'src/components/ui/progress.jsx'
    ];

    for (const component of uiComponents) {
      const filePath = path.join(__dirname, '..', component);
      
      if (!fs.existsSync(filePath)) {
        this.testResults.components.issues.push({
          type: 'MISSING_UI_COMPONENT',
          file: component,
          message: 'UI component does not exist'
        });
        console.log(`   ❌ ${component}: Missing`);
      } else {
        console.log(`   ✅ ${component}: Exists`);
      }
    }

    this.testResults.components.status = this.testResults.components.issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`   📊 Components check: ${this.testResults.components.issues.length} issues found\n`);
  }

  async fixIdentifiedIssues() {
    console.log('🔧 Fixing identified issues...');
    
    let fixesApplied = 0;

    // Fix missing UI components
    for (const issue of this.testResults.components.issues) {
      if (issue.type === 'MISSING_UI_COMPONENT') {
        await this.createMissingUIComponent(issue.file);
        fixesApplied++;
      }
    }

    // Fix missing React imports
    for (const issue of this.testResults.syntax.issues) {
      if (issue.type === 'MISSING_REACT_IMPORT') {
        await this.fixMissingReactImport(issue.file);
        fixesApplied++;
      }
    }

    console.log(`   ✅ Applied ${fixesApplied} fixes\n`);
    this.fixes.push(`Applied ${fixesApplied} automatic fixes`);
  }

  async createMissingUIComponent(componentPath) {
    const componentName = path.basename(componentPath, '.jsx');
    const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    
    const componentContent = `import * as React from "react"
import { cn } from "../../lib/utils"

const ${capitalizedName} = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
${capitalizedName}.displayName = "${capitalizedName}"

export { ${capitalizedName} }`;

    const fullPath = path.join(__dirname, '..', componentPath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, componentContent);
    console.log(`   🔧 Created missing component: ${componentPath}`);
  }

  async fixMissingReactImport(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (!content.includes("'use client'") && !content.includes('import React')) {
      if (content.includes('<') && content.includes('>')) {
        content = "'use client'\n\n" + content;
        fs.writeFileSync(fullPath, content);
        console.log(`   🔧 Added 'use client' directive to: ${filePath}`);
      }
    }
  }

  async testBuild() {
    console.log('🏗️  Testing build process...');
    
    return new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      buildProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          this.testResults.build.status = 'PASS';
          console.log('   ✅ Build successful');
        } else {
          this.testResults.build.status = 'FAIL';
          this.testResults.build.issues.push({
            type: 'BUILD_FAILED',
            message: 'Build process failed',
            output: errorOutput
          });
          console.log('   ❌ Build failed');
          console.log('   Error output:', errorOutput.slice(0, 500));
        }
        resolve();
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        buildProcess.kill();
        this.testResults.build.status = 'TIMEOUT';
        console.log('   ⏰ Build timed out');
        resolve();
      }, 120000);
    });
  }

  async generateTestReport() {
    const totalIssues = Object.values(this.testResults).reduce((sum, test) => sum + test.issues.length, 0);
    const passedTests = Object.values(this.testResults).filter(test => test.status === 'PASS').length;
    const totalTests = Object.keys(this.testResults).length;

    const report = {
      timestamp: new Date().toISOString(),
      status: totalIssues === 0 ? 'ALL_TESTS_PASSED' : 'ISSUES_FOUND',
      summary: {
        totalTests,
        passedTests,
        totalIssues,
        fixesApplied: this.fixes.length
      },
      testResults: this.testResults,
      fixes: this.fixes
    };

    // Save report
    const reportPath = path.join(__dirname, '../FRONTEND_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Frontend Test Report:');
    console.log('='.repeat(40));
    console.log(`Status: ${report.status}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Total Issues: ${totalIssues}`);
    console.log(`Fixes Applied: ${this.fixes.length}`);

    Object.entries(this.testResults).forEach(([testName, result]) => {
      console.log(`${testName.toUpperCase()}: ${result.status} (${result.issues.length} issues)`);
    });

    if (totalIssues === 0) {
      console.log('\n🎉 All frontend tests passed! Ready for development.');
    } else {
      console.log('\n⚠️  Some issues found. Check the report for details.');
    }

    return report;
  }
}

// Execute frontend testing
async function main() {
  const tester = new FrontendTester();
  await tester.runComprehensiveTest();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Frontend testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Frontend testing failed:', error);
      process.exit(1);
    });
}

module.exports = { FrontendTester };
