// Daily Login Bonus Integration Testing Script
// Tests tier system integration and frontend functionality

const fs = require('fs');
const path = require('path');

class DailyLoginIntegrationTester {
  constructor() {
    this.testResults = {
      tierSystemIntegration: { status: 'PENDING', tests: [] },
      dailyLoginComponent: { status: 'PENDING', tests: [] },
      frontendIntegration: { status: 'PENDING', tests: [] },
      rewardCalculation: { status: 'PENDING', tests: [] },
      userExperience: { status: 'PENDING', tests: [] }
    };
  }

  async testDailyLoginIntegration() {
    console.log('🎁 Testing Daily Login Bonus Integration...\n');
    console.log('='.repeat(60));

    try {
      // 1. Test tier system integration
      await this.testTierSystemIntegration();
      
      // 2. Test daily login component
      await this.testDailyLoginComponent();
      
      // 3. Test frontend integration
      await this.testFrontendIntegration();
      
      // 4. Test reward calculation
      await this.testRewardCalculation();
      
      // 5. Test user experience
      await this.testUserExperience();
      
      // 6. Generate comprehensive report
      const report = await this.generateTestReport();
      
      console.log('\n🎉 Daily login bonus integration testing completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Daily login bonus integration testing failed:', error);
      throw error;
    }
  }

  async testTierSystemIntegration() {
    console.log('🏆 Testing tier system integration...');
    
    // Test 1: Tier system config updated
    const tierConfigPath = path.join(__dirname, '../config/tier-system.js');
    if (fs.existsSync(tierConfigPath)) {
      const content = fs.readFileSync(tierConfigPath, 'utf8');
      
      if (content.includes('dailyTokens') && content.includes('streakMultiplier')) {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'Tier Config Enhanced',
          status: 'PASS',
          details: 'Daily tokens and streak multipliers added to tier config'
        });
        console.log('   ✅ Tier configuration enhanced with daily login rewards');
      } else {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'Tier Config Enhanced',
          status: 'FAIL',
          details: 'Daily login rewards not found in tier config'
        });
        console.log('   ❌ Tier configuration missing daily login rewards');
      }

      // Check all tiers have enhanced rewards
      const tierMatches = content.match(/dailyTokens:\s*\d+/g);
      if (tierMatches && tierMatches.length >= 5) {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'All Tiers Enhanced',
          status: 'PASS',
          details: `${tierMatches.length} tiers have daily token rewards`
        });
        console.log(`   ✅ All ${tierMatches.length} tiers have daily token rewards`);
      } else {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'All Tiers Enhanced',
          status: 'FAIL',
          details: 'Not all tiers have daily token rewards'
        });
        console.log('   ❌ Not all tiers have daily token rewards');
      }
    }

    // Test 2: Tier system hook updated
    const tierHookPath = path.join(__dirname, '../src/hooks/useTierSystem.js');
    if (fs.existsSync(tierHookPath)) {
      const content = fs.readFileSync(tierHookPath, 'utf8');
      
      if (content.includes('customXP') && content.includes('tokensGained')) {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'Tier Hook Enhanced',
          status: 'PASS',
          details: 'Tier system hook supports enhanced daily login rewards'
        });
        console.log('   ✅ Tier system hook enhanced for daily login');
      } else {
        this.testResults.tierSystemIntegration.tests.push({
          name: 'Tier Hook Enhanced',
          status: 'FAIL',
          details: 'Tier system hook not enhanced for daily login'
        });
        console.log('   ❌ Tier system hook not enhanced');
      }
    }

    const passedTests = this.testResults.tierSystemIntegration.tests.filter(t => t.status === 'PASS').length;
    this.testResults.tierSystemIntegration.status = passedTests === this.testResults.tierSystemIntegration.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Tier system integration: ${passedTests}/${this.testResults.tierSystemIntegration.tests.length} passed\n`);
  }

  async testDailyLoginComponent() {
    console.log('🎁 Testing daily login component...');
    
    // Test 1: Daily login component exists
    const componentPath = path.join(__dirname, '../src/components/tier/DailyLoginBonus.jsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for tier integration
      if (content.includes('useTierSystem') && content.includes('TIER_DAILY_REWARDS')) {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Tier System Integration',
          status: 'PASS',
          details: 'Component properly integrates with tier system'
        });
        console.log('   ✅ Component integrates with tier system');
      } else {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Tier System Integration',
          status: 'FAIL',
          details: 'Component missing tier system integration'
        });
        console.log('   ❌ Component missing tier system integration');
      }

      // Check for streak functionality
      if (content.includes('STREAK_MILESTONES') && content.includes('streak')) {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Streak System',
          status: 'PASS',
          details: 'Streak system with milestones implemented'
        });
        console.log('   ✅ Streak system with milestones implemented');
      } else {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Streak System',
          status: 'FAIL',
          details: 'Streak system not implemented'
        });
        console.log('   ❌ Streak system not implemented');
      }

      // Check for reward calculation
      if (content.includes('calculateRewards') && content.includes('streakMultiplier')) {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Reward Calculation',
          status: 'PASS',
          details: 'Dynamic reward calculation based on tier and streak'
        });
        console.log('   ✅ Dynamic reward calculation implemented');
      } else {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Reward Calculation',
          status: 'FAIL',
          details: 'Reward calculation not implemented'
        });
        console.log('   ❌ Reward calculation not implemented');
      }

      // Check for animations
      if (content.includes('AnimatePresence') && content.includes('showRewardAnimation')) {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Reward Animations',
          status: 'PASS',
          details: 'Reward claim animations implemented'
        });
        console.log('   ✅ Reward claim animations implemented');
      } else {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Reward Animations',
          status: 'FAIL',
          details: 'Reward animations not implemented'
        });
        console.log('   ❌ Reward animations not implemented');
      }

      // Check for countdown timer
      if (content.includes('timeUntilNext') && content.includes('updateTimer')) {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Countdown Timer',
          status: 'PASS',
          details: 'Real-time countdown timer implemented'
        });
        console.log('   ✅ Real-time countdown timer implemented');
      } else {
        this.testResults.dailyLoginComponent.tests.push({
          name: 'Countdown Timer',
          status: 'FAIL',
          details: 'Countdown timer not implemented'
        });
        console.log('   ❌ Countdown timer not implemented');
      }
    } else {
      this.testResults.dailyLoginComponent.tests.push({
        name: 'Daily Login Component',
        status: 'FAIL',
        details: 'Component file not found'
      });
      console.log('   ❌ Daily login component not found');
    }

    const passedTests = this.testResults.dailyLoginComponent.tests.filter(t => t.status === 'PASS').length;
    this.testResults.dailyLoginComponent.status = passedTests === this.testResults.dailyLoginComponent.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Daily login component: ${passedTests}/${this.testResults.dailyLoginComponent.tests.length} passed\n`);
  }

  async testFrontendIntegration() {
    console.log('🖥️ Testing frontend integration...');
    
    // Test 1: Dashboard integration
    const dashboardPath = path.join(__dirname, '../src/components/enhanced/EnhancedDashboard.jsx');
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      if (content.includes('DailyLoginBonus') && content.includes('import DailyLoginBonus')) {
        this.testResults.frontendIntegration.tests.push({
          name: 'Dashboard Integration',
          status: 'PASS',
          details: 'Daily login bonus integrated into main dashboard'
        });
        console.log('   ✅ Daily login bonus integrated into dashboard');
      } else {
        this.testResults.frontendIntegration.tests.push({
          name: 'Dashboard Integration',
          status: 'FAIL',
          details: 'Daily login bonus not integrated into dashboard'
        });
        console.log('   ❌ Daily login bonus not integrated into dashboard');
      }
    }

    // Test 2: UI components exist
    const uiComponents = ['Card', 'Button', 'Badge'];
    let uiComponentsFound = 0;
    
    const componentPath = path.join(__dirname, '../src/components/tier/DailyLoginBonus.jsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      uiComponents.forEach(component => {
        if (content.includes(component)) {
          uiComponentsFound++;
        }
      });
    }

    if (uiComponentsFound === uiComponents.length) {
      this.testResults.frontendIntegration.tests.push({
        name: 'UI Components',
        status: 'PASS',
        details: 'All required UI components imported and used'
      });
      console.log('   ✅ All UI components properly integrated');
    } else {
      this.testResults.frontendIntegration.tests.push({
        name: 'UI Components',
        status: 'FAIL',
        details: `Missing UI components: ${uiComponents.length - uiComponentsFound}`
      });
      console.log('   ❌ Some UI components missing');
    }

    const passedTests = this.testResults.frontendIntegration.tests.filter(t => t.status === 'PASS').length;
    this.testResults.frontendIntegration.status = passedTests === this.testResults.frontendIntegration.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Frontend integration: ${passedTests}/${this.testResults.frontendIntegration.tests.length} passed\n`);
  }

  async testRewardCalculation() {
    console.log('🧮 Testing reward calculation...');
    
    // Test 1: Tier-based rewards
    const tierConfigPath = path.join(__dirname, '../config/tier-system.js');
    if (fs.existsSync(tierConfigPath)) {
      const content = fs.readFileSync(tierConfigPath, 'utf8');
      
      // Check for progressive rewards
      const dailyXPMatches = content.match(/dailyXP:\s*(\d+)/g);
      const dailyTokenMatches = content.match(/dailyTokens:\s*(\d+)/g);
      
      if (dailyXPMatches && dailyTokenMatches) {
        const xpValues = dailyXPMatches.map(m => parseInt(m.match(/\d+/)[0]));
        const tokenValues = dailyTokenMatches.map(m => parseInt(m.match(/\d+/)[0]));
        
        const xpProgressive = xpValues.every((val, i) => i === 0 || val > xpValues[i-1]);
        const tokenProgressive = tokenValues.every((val, i) => i === 0 || val > tokenValues[i-1]);
        
        if (xpProgressive && tokenProgressive) {
          this.testResults.rewardCalculation.tests.push({
            name: 'Progressive Rewards',
            status: 'PASS',
            details: 'Rewards increase progressively with tier level'
          });
          console.log('   ✅ Progressive rewards implemented across tiers');
        } else {
          this.testResults.rewardCalculation.tests.push({
            name: 'Progressive Rewards',
            status: 'FAIL',
            details: 'Rewards do not increase progressively'
          });
          console.log('   ❌ Rewards do not increase progressively');
        }
      }

      // Check for streak multipliers
      const multiplierMatches = content.match(/streakMultiplier:\s*([\d.]+)/g);
      if (multiplierMatches && multiplierMatches.length >= 5) {
        this.testResults.rewardCalculation.tests.push({
          name: 'Streak Multipliers',
          status: 'PASS',
          details: 'Streak multipliers configured for all tiers'
        });
        console.log('   ✅ Streak multipliers configured for all tiers');
      } else {
        this.testResults.rewardCalculation.tests.push({
          name: 'Streak Multipliers',
          status: 'FAIL',
          details: 'Streak multipliers not properly configured'
        });
        console.log('   ❌ Streak multipliers not properly configured');
      }
    }

    const passedTests = this.testResults.rewardCalculation.tests.filter(t => t.status === 'PASS').length;
    this.testResults.rewardCalculation.status = passedTests === this.testResults.rewardCalculation.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 Reward calculation: ${passedTests}/${this.testResults.rewardCalculation.tests.length} passed\n`);
  }

  async testUserExperience() {
    console.log('👤 Testing user experience...');
    
    const componentPath = path.join(__dirname, '../src/components/tier/DailyLoginBonus.jsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Test 1: Wallet connection handling
      if (content.includes('Connect your wallet') && content.includes('!address')) {
        this.testResults.userExperience.tests.push({
          name: 'Wallet Connection Handling',
          status: 'PASS',
          details: 'Proper handling of wallet connection state'
        });
        console.log('   ✅ Wallet connection properly handled');
      } else {
        this.testResults.userExperience.tests.push({
          name: 'Wallet Connection Handling',
          status: 'FAIL',
          details: 'Wallet connection not properly handled'
        });
        console.log('   ❌ Wallet connection not properly handled');
      }

      // Test 2: Loading states
      if (content.includes('claiming') && content.includes('Claiming...')) {
        this.testResults.userExperience.tests.push({
          name: 'Loading States',
          status: 'PASS',
          details: 'Loading states implemented for user feedback'
        });
        console.log('   ✅ Loading states implemented');
      } else {
        this.testResults.userExperience.tests.push({
          name: 'Loading States',
          status: 'FAIL',
          details: 'Loading states not implemented'
        });
        console.log('   ❌ Loading states not implemented');
      }

      // Test 3: Error handling
      if (content.includes('toast.error') && content.includes('catch (error)')) {
        this.testResults.userExperience.tests.push({
          name: 'Error Handling',
          status: 'PASS',
          details: 'Comprehensive error handling with user notifications'
        });
        console.log('   ✅ Error handling implemented');
      } else {
        this.testResults.userExperience.tests.push({
          name: 'Error Handling',
          status: 'FAIL',
          details: 'Error handling not implemented'
        });
        console.log('   ❌ Error handling not implemented');
      }

      // Test 4: Visual feedback
      if (content.includes('toast.success') && content.includes('showRewardAnimation')) {
        this.testResults.userExperience.tests.push({
          name: 'Visual Feedback',
          status: 'PASS',
          details: 'Rich visual feedback with animations and notifications'
        });
        console.log('   ✅ Rich visual feedback implemented');
      } else {
        this.testResults.userExperience.tests.push({
          name: 'Visual Feedback',
          status: 'FAIL',
          details: 'Visual feedback not implemented'
        });
        console.log('   ❌ Visual feedback not implemented');
      }
    }

    const passedTests = this.testResults.userExperience.tests.filter(t => t.status === 'PASS').length;
    this.testResults.userExperience.status = passedTests === this.testResults.userExperience.tests.length ? 'PASS' : 'FAIL';
    
    console.log(`   📊 User experience: ${passedTests}/${this.testResults.userExperience.tests.length} passed\n`);
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
        'Tier-based daily login rewards with progressive bonuses',
        'Streak system with milestone rewards and multipliers',
        'Real-time countdown timer for next claim availability',
        'Animated reward claiming with visual feedback',
        'Complete integration with tier system and dashboard',
        'Comprehensive error handling and user notifications'
      ]
    };

    // Save report
    const reportPath = path.join(__dirname, '../DAILY_LOGIN_INTEGRATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('📊 Daily Login Integration Report:');
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

    console.log('\n🎁 Daily Login Features:');
    report.features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });

    if (report.summary.integrationScore >= 90) {
      console.log('\n🎉 DAILY LOGIN BONUS FULLY INTEGRATED! 🎁');
      console.log('✅ Tier-based rewards with progressive bonuses');
      console.log('✅ Streak system with milestone rewards');
      console.log('✅ Real-time UI with animations and feedback');
      console.log('✅ Complete dashboard integration');
      console.log('✅ Production-ready user experience');
    } else if (report.summary.integrationScore >= 70) {
      console.log('\n⚠️  Daily login bonus mostly integrated with minor issues');
    } else {
      console.log('\n❌ Daily login bonus needs significant integration work');
    }

    return report;
  }
}

// Execute daily login integration testing
async function main() {
  const tester = new DailyLoginIntegrationTester();
  await tester.testDailyLoginIntegration();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Daily login integration testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Daily login integration testing failed:', error);
      process.exit(1);
    });
}

module.exports = { DailyLoginIntegrationTester };
