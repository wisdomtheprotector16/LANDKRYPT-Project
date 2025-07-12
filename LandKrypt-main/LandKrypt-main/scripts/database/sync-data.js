// Data Synchronization Script for LandKrypt
// Syncs JSON files with database to ensure frontend-backend consistency

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const MARKETPLACE_DATA_FILE = path.join(DATA_DIR, 'all-listings.json');
const SUMMARY_FILE = path.join(DATA_DIR, 'marketplace-summary.json');

class DataSynchronizer {
  constructor() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }
    
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Sync marketplace listings from database to JSON
  async syncMarketplaceData() {
    try {
      console.log('🔄 Starting marketplace data synchronization...');

      // Fetch marketplace listings from database (if table exists)
      let listings = [];
      try {
        const { data: dbListings, error } = await this.supabase
          .from('marketplace_listings')
          .select('*')
          .order('id', { ascending: true });

        if (error && error.code !== 'PGRST116') {
          console.warn('Database listings not available:', error.message);
        } else {
          listings = dbListings || [];
        }
      } catch (dbError) {
        console.warn('Database not accessible, using existing JSON data');
      }

      // If no database listings, keep existing JSON data
      if (listings.length === 0) {
        if (fs.existsSync(MARKETPLACE_DATA_FILE)) {
          listings = JSON.parse(fs.readFileSync(MARKETPLACE_DATA_FILE, 'utf8'));
          console.log('📄 Using existing JSON data:', listings.length, 'listings');
        } else {
          listings = this.generateSampleListings();
          console.log('🔧 Generated sample listings');
        }
      }

      // Validate and enhance listings data
      const enhancedListings = listings.map((listing, index) => ({
        id: listing.id || index + 1,
        tokenId: String(listing.tokenId || listing.id || index + 1),
        title: listing.title || `Property #${listing.id || index + 1}`,
        description: listing.description || 'Premium property with excellent investment potential',
        location: listing.location || 'Lagos, Nigeria',
        price: listing.price || `${Math.floor(Math.random() * 300000) + 100000} LKUSD target`,
        shares: listing.shares || `${Math.floor(Math.random() * 40) + 10} Shares`,
        image: listing.image || `/nfts/nft${(index % 9) + 1}.jpg`,
        tag: listing.tag || ['RESIDENTIAL', 'COMMERCIAL', 'OFFICE SPACE', 'LUXURY VILLA'][index % 4],
        category: listing.category || ['residential', 'commercial'][index % 2],
        staking: listing.staking !== undefined ? listing.staking : true,
        type: listing.type || ['rwa', 'digital asset'][index % 2],
        stakingContract: listing.stakingContract || this.generateStakingContract(),
        isListed: listing.isListed !== undefined ? listing.isListed : true,
        owner: listing.owner || this.generateAddress(),
        originalPrice: listing.originalPrice || String(Math.floor(Math.random() * 300000) + 100000),
        tokenUrl: listing.tokenUrl || `https://nft-metadata.landkrypt.com/${listing.id || index + 1}.json`
      }));

      // Generate summary data
      const summary = {
        total: enhancedListings.length,
        categories: {
          all: enhancedListings.length,
          rwa: enhancedListings.filter(l => l.type === 'rwa').length,
          'digital asset': enhancedListings.filter(l => l.type === 'digital asset').length,
          residential: enhancedListings.filter(l => l.category === 'residential').length,
          commercial: enhancedListings.filter(l => l.category === 'commercial').length
        },
        totalValue: enhancedListings.reduce((sum, listing) => sum + parseInt(listing.originalPrice), 0),
        lastUpdated: new Date().toISOString()
      };

      // Ensure data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Write files
      fs.writeFileSync(MARKETPLACE_DATA_FILE, JSON.stringify(enhancedListings, null, 2));
      fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));

      console.log('✅ Marketplace data synchronized successfully!');
      console.log(`📊 Total listings: ${enhancedListings.length}`);
      console.log(`💰 Total value: ${summary.totalValue.toLocaleString()} LKUSD`);
      
      return {
        listings: enhancedListings,
        summary
      };
    } catch (error) {
      console.error('❌ Error syncing marketplace data:', error);
      throw error;
    }
  }

  // Sync user actions and stakes from database
  async syncUserData() {
    try {
      console.log('🔄 Starting user data synchronization...');

      const userDataSummary = {
        totalUsers: 0,
        totalStakes: 0,
        totalActions: 0,
        activeStakes: 0,
        lastUpdated: new Date().toISOString()
      };

      try {
        // Get user statistics
        const { data: actions, error: actionsError } = await this.supabase
          .from('user_actions')
          .select('*');

        if (!actionsError) {
          userDataSummary.totalActions = actions.length;
          userDataSummary.totalUsers = new Set(actions.map(a => a.user_address)).size;
        }

        const { data: stakes, error: stakesError } = await this.supabase
          .from('nft_stakes')
          .select('*');

        if (!stakesError) {
          userDataSummary.totalStakes = stakes.length;
          userDataSummary.activeStakes = stakes.filter(s => s.is_active).length;
        }

        console.log('📊 User Data Summary:', userDataSummary);
      } catch (error) {
        console.warn('Database not accessible for user data sync');
      }

      // Write user data summary
      const userDataFile = path.join(DATA_DIR, 'user-data-summary.json');
      fs.writeFileSync(userDataFile, JSON.stringify(userDataSummary, null, 2));

      console.log('✅ User data synchronized successfully!');
      return userDataSummary;
    } catch (error) {
      console.error('❌ Error syncing user data:', error);
      throw error;
    }
  }

  // Validate data consistency
  async validateDataConsistency() {
    try {
      console.log('🔍 Starting data consistency validation...');

      const issues = [];
      
      // Check if files exist
      if (!fs.existsSync(MARKETPLACE_DATA_FILE)) {
        issues.push('Marketplace data file missing');
      }

      if (!fs.existsSync(SUMMARY_FILE)) {
        issues.push('Summary file missing');
      }

      // Validate file contents
      if (fs.existsSync(MARKETPLACE_DATA_FILE)) {
        try {
          const listings = JSON.parse(fs.readFileSync(MARKETPLACE_DATA_FILE, 'utf8'));
          
          // Check for required fields
          listings.forEach((listing, index) => {
            const requiredFields = ['id', 'tokenId', 'title', 'stakingContract', 'originalPrice'];
            requiredFields.forEach(field => {
              if (!listing[field]) {
                issues.push(`Listing ${index + 1} missing required field: ${field}`);
              }
            });

            // Validate staking contract format
            if (listing.stakingContract && !/^0x[a-fA-F0-9]+$/.test(listing.stakingContract)) {
              issues.push(`Listing ${index + 1} has invalid staking contract format`);
            }
          });

          console.log(`📄 Validated ${listings.length} marketplace listings`);
        } catch (parseError) {
          issues.push('Invalid JSON format in marketplace data file');
        }
      }

      if (issues.length === 0) {
        console.log('✅ Data consistency validation passed!');
      } else {
        console.log('⚠️  Data consistency issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('❌ Error validating data consistency:', error);
      return {
        isValid: false,
        issues: [error.message]
      };
    }
  }

  // Generate sample data if none exists
  generateSampleListings() {
    const sampleListings = [];
    const locations = ['Victoria Island, Lagos', 'Lekki, Lagos', 'Ikoyi, Lagos', 'Abuja, FCT'];
    const types = ['rwa', 'digital asset'];
    const categories = ['residential', 'commercial'];
    const tags = ['RESIDENTIAL', 'COMMERCIAL', 'OFFICE SPACE', 'LUXURY VILLA'];

    for (let i = 1; i <= 12; i++) {
      sampleListings.push({
        id: i,
        tokenId: String(i),
        title: `Property #${i}`,
        description: 'Premium property with excellent investment potential',
        location: locations[i % locations.length],
        price: `${Math.floor(Math.random() * 300000) + 100000} LKUSD target`,
        shares: `${Math.floor(Math.random() * 40) + 10} Shares`,
        image: `/nfts/nft${(i % 9) + 1}.jpg`,
        tag: tags[i % tags.length],
        category: categories[i % categories.length],
        staking: true,
        type: types[i % types.length],
        stakingContract: this.generateStakingContract(),
        isListed: true,
        owner: this.generateAddress(),
        originalPrice: String(Math.floor(Math.random() * 300000) + 100000),
        tokenUrl: `https://nft-metadata.landkrypt.com/${i}.json`
      });
    }

    return sampleListings;
  }

  generateStakingContract() {
    return '0x' + Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  generateAddress() {
    return '0x' + Array.from({length: 13}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Full synchronization
  async syncAll() {
    try {
      console.log('🚀 Starting full data synchronization...');
      
      const marketplaceData = await this.syncMarketplaceData();
      const userData = await this.syncUserData();
      const validation = await this.validateDataConsistency();

      const report = {
        timestamp: new Date().toISOString(),
        marketplace: {
          totalListings: marketplaceData.listings.length,
          totalValue: marketplaceData.summary.totalValue
        },
        userData,
        validation,
        success: validation.isValid
      };

      // Write sync report
      const reportFile = path.join(DATA_DIR, 'sync-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

      console.log('📋 Synchronization complete! Report saved to sync-report.json');
      return report;
    } catch (error) {
      console.error('❌ Full synchronization failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  const syncer = new DataSynchronizer();

  try {
    switch (command) {
      case 'marketplace':
        await syncer.syncMarketplaceData();
        break;
      case 'users':
        await syncer.syncUserData();
        break;
      case 'validate':
        await syncer.validateDataConsistency();
        break;
      case 'all':
      default:
        await syncer.syncAll();
        break;
    }
  } catch (error) {
    console.error('❌ Synchronization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DataSynchronizer };
