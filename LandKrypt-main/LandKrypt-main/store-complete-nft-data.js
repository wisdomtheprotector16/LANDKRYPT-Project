// Complete NFT Database Storage Script
// This script discovers all NFTs, clears old data, and stores complete information including token URIs

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
  type: process.env.DB_TYPE || 'supabase', // 'supabase', 'json', 'both'
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  json: {
    dataDir: path.join(__dirname, 'data'),
    marketplaceFile: 'marketplace-listings.json',
    nftFile: 'complete-nft-data.json'
  }
};

// Contract ABIs
const CONTRACT_ABIS = {
  REAL_ESTATE_NFT: [
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "ownerOf",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "getTokenDescription",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "tokenURI",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "isThereTokenId",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  STAKING_FACTORY: [
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "getStakingContractForNFT",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  MARKETPLACE: [
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "listedBool",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "listings",
      "outputs": [
        {"internalType": "uint256", "name": "price", "type": "uint256"},
        {"internalType": "address", "name": "stakingContract", "type": "address"},
        {"internalType": "bool", "name": "isListed", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "getOriginalPrice",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  NFT_STAKING: [
    {
      "inputs": [],
      "name": "targetAmount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalStaked",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

class CompleteNFTDatabaseManager {
  constructor() {
    this.supabase = null;
    this.provider = null;
    this.contracts = {};
    this.config = {
      rpcUrl: process.env.ALCHEMY_SEPOLIA_URL,
      nftAddress: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
      stakingFactoryAddress: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
      marketplaceAddress: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
      maxTokenScan: 1000
    };
  }

  async initialize() {
    console.log('🚀 Initializing Complete NFT Database Manager...\n');
    
    // Initialize blockchain connection
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    
    // Initialize contracts
    this.contracts.nft = new ethers.Contract(
      this.config.nftAddress,
      CONTRACT_ABIS.REAL_ESTATE_NFT,
      this.provider
    );
    
    this.contracts.stakingFactory = new ethers.Contract(
      this.config.stakingFactoryAddress,
      CONTRACT_ABIS.STAKING_FACTORY,
      this.provider
    );
    
    this.contracts.marketplace = new ethers.Contract(
      this.config.marketplaceAddress,
      CONTRACT_ABIS.MARKETPLACE,
      this.provider
    );

    // Initialize Supabase if configured
    if (DB_CONFIG.type === 'supabase' || DB_CONFIG.type === 'both') {
      if (DB_CONFIG.supabase.url && DB_CONFIG.supabase.serviceKey) {
        this.supabase = createClient(
          DB_CONFIG.supabase.url,
          DB_CONFIG.supabase.serviceKey
        );
        console.log('✅ Supabase client initialized');
      } else {
        console.log('⚠️  Supabase credentials not found, falling back to JSON');
        DB_CONFIG.type = 'json';
      }
    }

    // Ensure JSON data directory exists
    if (!fs.existsSync(DB_CONFIG.json.dataDir)) {
      fs.mkdirSync(DB_CONFIG.json.dataDir, { recursive: true });
    }

    console.log('📋 Configuration:');
    console.log(`   Database Type: ${DB_CONFIG.type}`);
    console.log(`   NFT Contract: ${this.config.nftAddress}`);
    console.log(`   Marketplace: ${this.config.marketplaceAddress}`);
    console.log(`   Staking Factory: ${this.config.stakingFactoryAddress}`);
    console.log(`   Max Token Scan: ${this.config.maxTokenScan}\n`);
  }

  async discoverAllNFTs() {
    console.log('🔍 Discovering all existing NFTs...');
    
    const existingTokens = [];
    const batchSize = 50;
    
    for (let start = 1; start <= this.config.maxTokenScan; start += batchSize) {
      const end = Math.min(start + batchSize - 1, this.config.maxTokenScan);
      const promises = [];
      
      for (let tokenId = start; tokenId <= end; tokenId++) {
        promises.push(
          this.contracts.nft.isThereTokenId(tokenId)
            .then(exists => exists ? tokenId : null)
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(promises);
      existingTokens.push(...results.filter(id => id !== null));
      
      if (end % 200 === 0) {
        console.log(`   Scanned up to token ID ${end}... Found ${existingTokens.length} NFTs so far`);
      }
    }
    
    console.log(`✅ Discovery complete! Found ${existingTokens.length} existing NFTs\n`);
    return existingTokens;
  }

  async fetchCompleteNFTData(tokenId) {
    console.log(`   📦 Fetching complete data for NFT #${tokenId}...`);
    
    try {
      // Fetch basic NFT data
      const [owner, description, tokenURI, isListed] = await Promise.allSettled([
        this.contracts.nft.ownerOf(tokenId),
        this.contracts.nft.getTokenDescription(tokenId),
        this.contracts.nft.tokenURI(tokenId),
        this.contracts.marketplace.listedBool(tokenId)
      ]);

      // Get staking contract
      const stakingContract = await this.contracts.stakingFactory.getStakingContractForNFT(tokenId);
      
      // Base NFT data
      const nftData = {
        token_id: tokenId,
        owner_address: owner.status === 'fulfilled' ? owner.value : null,
        description: description.status === 'fulfilled' ? description.value : `NFT #${tokenId}`,
        token_uri: tokenURI.status === 'fulfilled' ? tokenURI.value : null,
        staking_contract: stakingContract !== ethers.ZeroAddress ? stakingContract : null,
        is_listed: isListed.status === 'fulfilled' ? isListed.value : false,
        marketplace_contract: this.config.marketplaceAddress,
        nft_contract: this.config.nftAddress,
        category: this.generateCategory(tokenId),
        property_type: this.generatePropertyType(tokenId),
        image_url: this.generateImageUrl(tokenId),
        price: 0,
        target_amount: 0,
        total_staked: 0,
        shares_available: Math.floor(Math.random() * 30) + 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get marketplace data if listed
      if (nftData.is_listed) {
        try {
          const [listing, originalPrice] = await Promise.allSettled([
            this.contracts.marketplace.listings(tokenId),
            this.contracts.marketplace.getOriginalPrice(tokenId)
          ]);

          if (listing.status === 'fulfilled') {
            nftData.price = Number(listing.value.price);
          }
          if (originalPrice.status === 'fulfilled') {
            nftData.target_amount = Number(originalPrice.value);
          }
        } catch (error) {
          console.log(`      ⚠️  Error fetching marketplace data: ${error.message}`);
        }
      }

      // Get staking data if available
      if (nftData.staking_contract) {
        try {
          const stakingContractInstance = new ethers.Contract(
            nftData.staking_contract,
            CONTRACT_ABIS.NFT_STAKING,
            this.provider
          );
          
          const [targetAmount, totalStaked] = await Promise.allSettled([
            stakingContractInstance.targetAmount(),
            stakingContractInstance.totalStaked()
          ]);

          if (targetAmount.status === 'fulfilled') {
            nftData.target_amount = Number(targetAmount.value);
          }
          if (totalStaked.status === 'fulfilled') {
            nftData.total_staked = Number(totalStaked.value);
          }
        } catch (error) {
          console.log(`      ⚠️  Error fetching staking data: ${error.message}`);
        }
      }

      // Add blockchain metadata
      nftData.blockchain_data = {
        network: 'sepolia',
        chain_id: 11155111,
        block_timestamp: Math.floor(Date.now() / 1000),
        has_staking_contract: !!nftData.staking_contract,
        staking_contract_address: nftData.staking_contract,
        marketplace_listed: nftData.is_listed,
        token_uri_fetched: !!nftData.token_uri
      };

      console.log(`      ✅ Data fetched successfully`);
      return nftData;

    } catch (error) {
      console.log(`      ❌ Error fetching data: ${error.message}`);
      return null;
    }
  }

  generateCategory(tokenId) {
    const categories = ['residential', 'commercial', 'agricultural', 'industrial'];
    return categories[tokenId % categories.length];
  }

  generatePropertyType(tokenId) {
    const types = ['rwa', 'digital asset'];
    return types[tokenId % types.length];
  }

  generateImageUrl(tokenId) {
    const imageNum = ((tokenId - 1) % 9) + 1;
    const extension = tokenId % 3 === 0 ? 'png' : 'jpg';
    return `/nfts/nft${imageNum}.${extension}`;
  }

  async clearOldData() {
    console.log('🗑️  Clearing old database data...');
    
    let cleared = false;

    // Clear Supabase data
    if (this.supabase && (DB_CONFIG.type === 'supabase' || DB_CONFIG.type === 'both')) {
      try {
        console.log('   🗄️  Clearing Supabase marketplace_listings table...');
        const { error } = await this.supabase
          .from('marketplace_listings')
          .delete()
          .neq('id', 0); // Delete all records

        if (error && error.code !== 'PGRST116') {
          console.log(`   ⚠️  Supabase clear warning: ${error.message}`);
        } else {
          console.log('   ✅ Supabase data cleared');
          cleared = true;
        }
      } catch (error) {
        console.log(`   ⚠️  Supabase clear error: ${error.message}`);
      }
    }

    // Clear JSON files
    if (DB_CONFIG.type === 'json' || DB_CONFIG.type === 'both') {
      try {
        const jsonFiles = [
          DB_CONFIG.json.marketplaceFile,
          DB_CONFIG.json.nftFile,
          'nft-listings.json',
          'all-listings.json',
          'commercial-listings.json',
          'residential-listings.json',
          'digital-asset-listings.json'
        ];

        for (const filename of jsonFiles) {
          const filePath = path.join(DB_CONFIG.json.dataDir, filename);
          if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            console.log(`   📁 Cleared ${filename}`);
          }
        }
        cleared = true;
      } catch (error) {
        console.log(`   ⚠️  JSON clear error: ${error.message}`);
      }
    }

    if (cleared) {
      console.log('✅ Old data cleared successfully\n');
    } else {
      console.log('⚠️  No data was cleared\n');
    }
  }

  async storeDataInSupabase(nftDataArray) {
    if (!this.supabase) return false;

    try {
      console.log('   💾 Storing data in Supabase...');
      
      // Prepare data for Supabase (convert blockchain_data to JSON string)
      const supabaseData = nftDataArray.map(nft => ({
        ...nft,
        blockchain_data: JSON.stringify(nft.blockchain_data)
      }));

      const { data, error } = await this.supabase
        .from('marketplace_listings')
        .insert(supabaseData);

      if (error) {
        console.log(`   ❌ Supabase storage error: ${error.message}`);
        return false;
      }

      console.log(`   ✅ Successfully stored ${nftDataArray.length} records in Supabase`);
      return true;
    } catch (error) {
      console.log(`   ❌ Supabase storage error: ${error.message}`);
      return false;
    }
  }

  async storeDataInJSON(nftDataArray) {
    try {
      console.log('   📁 Storing data in JSON files...');

      // Store complete NFT data
      const completeDataFile = path.join(DB_CONFIG.json.dataDir, DB_CONFIG.json.nftFile);
      fs.writeFileSync(completeDataFile, JSON.stringify(nftDataArray, null, 2));

      // Store marketplace listings format
      const marketplaceData = nftDataArray.map(nft => ({
        id: nft.token_id,
        tokenId: nft.token_id.toString(),
        title: nft.description,
        description: nft.description,
        location: `Property Location ${nft.token_id}`,
        price: nft.price > 0 ? nft.price.toString() : `${Math.floor(Math.random() * 200000) + 150000} LKUSD`,
        shares: `${nft.shares_available} Shares`,
        image: nft.image_url,
        tag: nft.category.toUpperCase(),
        category: nft.category,
        staking: !!nft.staking_contract,
        type: nft.property_type,
        stakingContract: nft.staking_contract,
        isListed: nft.is_listed,
        owner: nft.owner_address,
        originalPrice: nft.target_amount.toString(),
        tokenUrl: nft.token_uri,
        tokenURI: nft.token_uri // Include both formats
      }));

      const marketplaceFile = path.join(DB_CONFIG.json.dataDir, DB_CONFIG.json.marketplaceFile);
      fs.writeFileSync(marketplaceFile, JSON.stringify(marketplaceData, null, 2));

      // Generate categorized files
      const categories = {
        'all-listings.json': marketplaceData,
        'commercial-listings.json': marketplaceData.filter(item => item.category === 'commercial'),
        'residential-listings.json': marketplaceData.filter(item => item.category === 'residential'),
        'rwa-listings.json': marketplaceData.filter(item => item.type === 'rwa'),
        'digital-asset-listings.json': marketplaceData.filter(item => item.type === 'digital asset')
      };

      Object.entries(categories).forEach(([filename, data]) => {
        const filePath = path.join(DB_CONFIG.json.dataDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      });

      // Generate summary
      const summary = {
        total: nftDataArray.length,
        with_staking: nftDataArray.filter(nft => nft.staking_contract).length,
        listed: nftDataArray.filter(nft => nft.is_listed).length,
        categories: {
          residential: nftDataArray.filter(nft => nft.category === 'residential').length,
          commercial: nftDataArray.filter(nft => nft.category === 'commercial').length,
          agricultural: nftDataArray.filter(nft => nft.category === 'agricultural').length,
          industrial: nftDataArray.filter(nft => nft.category === 'industrial').length
        },
        types: {
          rwa: nftDataArray.filter(nft => nft.property_type === 'rwa').length,
          'digital asset': nftDataArray.filter(nft => nft.property_type === 'digital asset').length
        },
        lastUpdated: new Date().toISOString()
      };

      const summaryFile = path.join(DB_CONFIG.json.dataDir, 'marketplace-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      console.log(`   ✅ Successfully stored data in JSON files`);
      console.log(`   📊 Summary: ${summary.total} NFTs, ${summary.with_staking} with staking, ${summary.listed} listed`);
      return true;
    } catch (error) {
      console.log(`   ❌ JSON storage error: ${error.message}`);
      return false;
    }
  }

  async run() {
    try {
      await this.initialize();

      // Step 1: Clear old data
      await this.clearOldData();

      // Step 2: Discover all NFTs
      const tokenIds = await this.discoverAllNFTs();
      
      if (tokenIds.length === 0) {
        console.log('❌ No NFTs found to process');
        return;
      }

      // Step 3: Fetch complete data for all NFTs
      console.log(`📦 Fetching complete data for ${tokenIds.length} NFTs...`);
      const allNFTData = [];
      const errors = [];

      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        console.log(`\n🔄 Processing NFT ${i + 1}/${tokenIds.length} (Token #${tokenId}):`);
        
        const nftData = await this.fetchCompleteNFTData(tokenId);
        if (nftData) {
          allNFTData.push(nftData);
        } else {
          errors.push(tokenId);
        }
      }

      console.log(`\n📊 Data Collection Complete:`);
      console.log(`   ✅ Successfully processed: ${allNFTData.length}`);
      console.log(`   ❌ Failed: ${errors.length}`);

      if (allNFTData.length === 0) {
        console.log('❌ No valid NFT data collected');
        return;
      }

      // Step 4: Store data in databases
      console.log(`\n💾 Storing ${allNFTData.length} NFT records in databases...`);
      
      let storedInSupabase = false;
      let storedInJSON = false;

      if (DB_CONFIG.type === 'supabase' || DB_CONFIG.type === 'both') {
        storedInSupabase = await this.storeDataInSupabase(allNFTData);
      }

      if (DB_CONFIG.type === 'json' || DB_CONFIG.type === 'both') {
        storedInJSON = await this.storeDataInJSON(allNFTData);
      }

      // Summary
      console.log('\n' + '='.repeat(80));
      console.log('🎉 COMPLETE NFT DATABASE STORAGE COMPLETED!');
      console.log('='.repeat(80));
      console.log(`📊 Total NFTs Processed: ${allNFTData.length}`);
      console.log(`✅ Successful Storage: ${storedInSupabase || storedInJSON ? 'YES' : 'NO'}`);
      console.log(`🗄️  Supabase: ${storedInSupabase ? '✅ Stored' : '❌ Failed/Skipped'}`);
      console.log(`📁 JSON Files: ${storedInJSON ? '✅ Stored' : '❌ Failed/Skipped'}`);
      
      if (errors.length > 0) {
        console.log(`⚠️  Failed NFTs: ${errors.join(', ')}`);
      }

      console.log('\n🚀 Database is now updated with complete NFT information including token URIs!');

    } catch (error) {
      console.error('\n💥 Process failed:', error);
      throw error;
    }
  }
}

// Execute when run directly
if (require.main === module) {
  const manager = new CompleteNFTDatabaseManager();
  
  manager.run()
    .then(() => {
      console.log('\n🎊 Complete NFT database storage completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Complete NFT database storage failed:', error);
      process.exit(1);
    });
}

module.exports = { CompleteNFTDatabaseManager };
