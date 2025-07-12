// Offline Data Validation Script
// Validates data consistency without requiring database connection

const fs = require('fs');
const path = require('path');

class OfflineValidator {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'src', 'data');
    this.contractsDir = path.join(__dirname, '..', 'src', 'contracts');
  }

  // Validate contract addresses and ABIs
  validateContracts() {
    console.log('🔍 Validating smart contract configuration...');
    
    const issues = [];
    
    try {
      const abisPath = path.join(this.contractsDir, 'abis.js');
      
      if (!fs.existsSync(abisPath)) {
        issues.push('Contract ABIs file missing');
        return { isValid: false, issues };
      }

      // Read and validate ABIs file
      const abisContent = fs.readFileSync(abisPath, 'utf8');
      
      // Check for required contract addresses
      const requiredContracts = [
        'REAL_ESTATE_NFT',
        'LANDKRYPT_STABLECOIN',
        'LANDKRYPT_STAKING_TOKEN',
        'NFT_MARKETPLACE',
        'STAKING_FACTORY'
      ];

      requiredContracts.forEach(contract => {
        if (!abisContent.includes(contract)) {
          issues.push(`Missing contract configuration: ${contract}`);
        }
      });

      // Check for required ABIs
      const requiredABIs = [
        'NFT_STAKING_ABI',
        'REAL_ESTATE_NFT_ABI',
        'NFT_MARKETPLACE_ABI',
        'LANDKRYPT_STABLECOIN_ABI'
      ];

      requiredABIs.forEach(abi => {
        if (!abisContent.includes(abi)) {
          issues.push(`Missing ABI definition: ${abi}`);
        }
      });

      console.log(`✅ Contract validation completed. ${requiredContracts.length} contracts checked.`);
      
    } catch (error) {
      issues.push(`Error reading contracts: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Validate marketplace data structure
  validateMarketplaceData() {
    console.log('🔍 Validating marketplace data structure...');
    
    const issues = [];
    
    try {
      const marketplaceFile = path.join(this.dataDir, 'all-listings.json');
      const summaryFile = path.join(this.dataDir, 'marketplace-summary.json');

      // Check file existence
      if (!fs.existsSync(marketplaceFile)) {
        issues.push('Marketplace listings file missing');
      }

      if (!fs.existsSync(summaryFile)) {
        issues.push('Marketplace summary file missing');
      }

      if (fs.existsSync(marketplaceFile)) {
        const listings = JSON.parse(fs.readFileSync(marketplaceFile, 'utf8'));
        
        if (!Array.isArray(listings)) {
          issues.push('Marketplace listings should be an array');
        } else {
          // Validate each listing
          listings.forEach((listing, index) => {
            this.validateListing(listing, index + 1, issues);
          });
          
          console.log(`📊 Validated ${listings.length} marketplace listings`);
        }
      }

      if (fs.existsSync(summaryFile)) {
        const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
        
        const requiredSummaryFields = ['total', 'categories', 'totalValue', 'lastUpdated'];
        requiredSummaryFields.forEach(field => {
          if (!summary[field]) {
            issues.push(`Summary missing required field: ${field}`);
          }
        });
        
        console.log(`📈 Summary validation completed`);
      }

    } catch (error) {
      issues.push(`Error validating marketplace data: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Validate individual listing
  validateListing(listing, index, issues) {
    const requiredFields = [
      'id', 'tokenId', 'title', 'description', 'location',
      'stakingContract', 'originalPrice', 'type', 'category'
    ];

    requiredFields.forEach(field => {
      if (!listing[field]) {
        issues.push(`Listing ${index} missing field: ${field}`);
      }
    });

    // Validate data types and formats
    if (listing.id && typeof listing.id !== 'number') {
      issues.push(`Listing ${index} has invalid ID type`);
    }

    if (listing.stakingContract && !this.isValidAddress(listing.stakingContract)) {
      issues.push(`Listing ${index} has invalid staking contract format`);
    }

    if (listing.originalPrice && isNaN(parseInt(listing.originalPrice))) {
      issues.push(`Listing ${index} has invalid price format`);
    }

    if (listing.type && !['rwa', 'digital asset'].includes(listing.type)) {
      issues.push(`Listing ${index} has invalid type: ${listing.type}`);
    }

    if (listing.category && !['residential', 'commercial', 'office space', 'luxury villa'].includes(listing.category)) {
      issues.push(`Listing ${index} has invalid category: ${listing.category}`);
    }

    if (listing.tokenUrl && !this.isValidUrl(listing.tokenUrl)) {
      issues.push(`Listing ${index} has invalid token URL`);
    }
  }

  // Validate API routes structure
  validateAPIRoutes() {
    console.log('🔍 Validating API routes...');
    
    const issues = [];
    
    try {
      const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
      
      if (!fs.existsSync(apiDir)) {
        issues.push('API directory missing');
        return { isValid: false, issues };
      }

      // Check for required API routes
      const requiredRoutes = [
        'user-actions',
        'nft-analytics',
        'proposals'
      ];

      requiredRoutes.forEach(route => {
        const routePath = path.join(apiDir, route, 'route.js');
        if (!fs.existsSync(routePath)) {
          issues.push(`Missing API route: ${route}`);
        } else {
          // Validate route file structure
          const routeContent = fs.readFileSync(routePath, 'utf8');
          
          if (!routeContent.includes('export async function GET')) {
            issues.push(`Route ${route} missing GET handler`);
          }
          
          if (route === 'user-actions' && !routeContent.includes('export async function POST')) {
            issues.push(`Route ${route} missing POST handler`);
          }
        }
      });

      console.log(`🛣️  Validated ${requiredRoutes.length} API routes`);
      
    } catch (error) {
      issues.push(`Error validating API routes: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Validate hooks structure
  validateHooks() {
    console.log('🔍 Validating React hooks...');
    
    const issues = [];
    
    try {
      const hooksDir = path.join(__dirname, '..', 'src', 'hooks');
      
      if (!fs.existsSync(hooksDir)) {
        issues.push('Hooks directory missing');
        return { isValid: false, issues };
      }

      // Check for required hooks
      const requiredHooks = [
        'useContractOperations.js',
        'useDatabaseActions.js',
        'useNftMetadata.js',
        'useDashboard.js'
      ];

      requiredHooks.forEach(hook => {
        const hookPath = path.join(hooksDir, hook);
        if (!fs.existsSync(hookPath)) {
          issues.push(`Missing hook: ${hook}`);
        } else {
          // Basic validation of hook content
          const hookContent = fs.readFileSync(hookPath, 'utf8');
          
          if (!hookContent.includes('useCallback') && !hookContent.includes('useState')) {
            issues.push(`Hook ${hook} may not be a valid React hook`);
          }
        }
      });

      console.log(`🪝 Validated ${requiredHooks.length} React hooks`);
      
    } catch (error) {
      issues.push(`Error validating hooks: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Validate component structure
  validateComponents() {
    console.log('🔍 Validating React components...');
    
    const issues = [];
    
    try {
      const componentsDir = path.join(__dirname, '..', 'src', 'components');
      
      if (!fs.existsSync(componentsDir)) {
        issues.push('Components directory missing');
        return { isValid: false, issues };
      }

      // Check for critical components
      const criticalComponents = [
        'StakingModal.jsx',
        'Header.jsx',
        'Footer.jsx'
      ];

      criticalComponents.forEach(component => {
        const componentPath = path.join(componentsDir, component);
        if (!fs.existsSync(componentPath)) {
          issues.push(`Missing critical component: ${component}`);
        }
      });

      console.log(`🧩 Validated critical components`);
      
    } catch (error) {
      issues.push(`Error validating components: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Validate pages structure
  validatePages() {
    console.log('🔍 Validating page structure...');
    
    const issues = [];
    
    try {
      const appDir = path.join(__dirname, '..', 'src', 'app');
      
      if (!fs.existsSync(appDir)) {
        issues.push('App directory missing');
        return { isValid: false, issues };
      }

      // Check for required pages
      const requiredPages = [
        'page.js',
        'layout.js',
        'marketplace/page.jsx',
        'dashboard/page.jsx',
        'governmentdao/page.jsx'
      ];

      requiredPages.forEach(page => {
        const pagePath = path.join(appDir, page);
        if (!fs.existsSync(pagePath)) {
          issues.push(`Missing page: ${page}`);
        }
      });

      console.log(`📄 Validated page structure`);
      
    } catch (error) {
      issues.push(`Error validating pages: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Helper function to validate Ethereum addresses
  isValidAddress(address) {
    return typeof address === 'string' && 
           address.length === 42 && 
           address.startsWith('0x') &&
           /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Helper function to validate URLs
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Generate sample data if files are missing
  generateSampleData() {
    console.log('🔧 Generating sample data...');
    
    try {
      // Ensure data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Generate sample listings
      const sampleListings = [];
      for (let i = 1; i <= 12; i++) {
        sampleListings.push({
          id: i,
          tokenId: String(i),
          title: `Property #${i}`,
          description: 'Premium property with excellent investment potential',
          location: 'Lagos, Nigeria',
          price: `${Math.floor(Math.random() * 300000) + 100000} LKUSD target`,
          shares: `${Math.floor(Math.random() * 40) + 10} Shares`,
          image: `/nfts/nft${(i % 9) + 1}.jpg`,
          tag: ['RESIDENTIAL', 'COMMERCIAL', 'OFFICE SPACE', 'LUXURY VILLA'][i % 4],
          category: ['residential', 'commercial'][i % 2],
          staking: true,
          type: ['rwa', 'digital asset'][i % 2],
          stakingContract: '0x' + Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          isListed: true,
          owner: '0x' + Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          originalPrice: String(Math.floor(Math.random() * 300000) + 100000),
          tokenUrl: `https://nft-metadata.landkrypt.com/${i}.json`
        });
      }

      // Write sample listings
      const listingsFile = path.join(this.dataDir, 'all-listings.json');
      fs.writeFileSync(listingsFile, JSON.stringify(sampleListings, null, 2));

      // Generate sample summary
      const summary = {
        total: sampleListings.length,
        categories: {
          all: sampleListings.length,
          rwa: sampleListings.filter(l => l.type === 'rwa').length,
          'digital asset': sampleListings.filter(l => l.type === 'digital asset').length,
          residential: sampleListings.filter(l => l.category === 'residential').length,
          commercial: sampleListings.filter(l => l.category === 'commercial').length
        },
        totalValue: sampleListings.reduce((sum, listing) => sum + parseInt(listing.originalPrice), 0),
        lastUpdated: new Date().toISOString()
      };

      const summaryFile = path.join(this.dataDir, 'marketplace-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      console.log(`✅ Generated ${sampleListings.length} sample listings`);
      
    } catch (error) {
      console.error('❌ Error generating sample data:', error.message);
    }
  }

  // Run complete validation
  async runCompleteValidation() {
    console.log('🚀 Starting complete offline validation...\n');
    
    const results = {
      contracts: this.validateContracts(),
      marketplace: this.validateMarketplaceData(),
      apiRoutes: this.validateAPIRoutes(),
      hooks: this.validateHooks(),
      components: this.validateComponents(),
      pages: this.validatePages()
    };

    console.log('\n📋 Validation Summary:');
    console.log('====================');

    let totalIssues = 0;
    let allValid = true;

    Object.entries(results).forEach(([category, result]) => {
      const status = result.isValid ? '✅' : '❌';
      console.log(`${status} ${category}: ${result.isValid ? 'PASS' : 'FAIL'}`);
      
      if (!result.isValid) {
        allValid = false;
        totalIssues += result.issues.length;
        console.log(`   Issues (${result.issues.length}):`);
        result.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    });

    console.log('\n📊 Overall Status:');
    console.log(`Total Issues: ${totalIssues}`);
    console.log(`Validation Status: ${allValid ? '✅ PASS' : '❌ NEEDS ATTENTION'}`);

    // Offer to generate sample data if marketplace data is missing
    if (!results.marketplace.isValid && results.marketplace.issues.some(issue => issue.includes('missing'))) {
      console.log('\n🔧 Generating missing sample data...');
      this.generateSampleData();
      
      // Re-validate marketplace data
      console.log('\n🔄 Re-validating marketplace data...');
      const revalidation = this.validateMarketplaceData();
      console.log(`Marketplace revalidation: ${revalidation.isValid ? '✅ PASS' : '❌ FAIL'}`);
    }

    return {
      allValid,
      totalIssues,
      results
    };
  }
}

// CLI execution
async function main() {
  const validator = new OfflineValidator();
  
  try {
    const result = await validator.runCompleteValidation();
    
    if (result.allValid) {
      console.log('\n🎉 All validations passed! Project is ready for deployment.');
    } else {
      console.log('\n⚠️  Some issues found. Please review and fix before deployment.');
    }
    
    process.exit(result.allValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { OfflineValidator };
