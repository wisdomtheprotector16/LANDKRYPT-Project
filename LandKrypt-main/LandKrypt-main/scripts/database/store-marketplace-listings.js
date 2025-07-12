// Generalized Marketplace Listings Database Storage Script
// Stores marketplace listings with duplicate checking and flexible configuration

const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration - supports multiple database types
const DB_CONFIG = {
  // PostgreSQL (primary option)
  type: process.env.DB_TYPE || 'json', // 'postgresql', 'json', 'sqlite'
  postgresql: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'landkrypt',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },
  // JSON file fallback
  json: {
    filePath: path.join(__dirname, 'data', 'marketplace-listings.json')
  },
  // SQLite option
  sqlite: {
    filePath: path.join(__dirname, 'data', 'marketplace.db')
  }
};

// Contract ABIs
const CONTRACT_ABIS = {
  STAKING_FACTORY: [
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "getStakingContractForNFT",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],
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
      "name": "isThereTokenId", 
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "tokenURI",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
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
    },
    {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "tokenIdToOwner",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
    },
    {
      "inputs": [],
      "name": "returnTokenId",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

/**
 * Database interface factory
 */
class DatabaseInterface {
  constructor(config) {
    this.config = config;
    this.type = config.type;
  }

  static async create(config) {
    const db = new DatabaseInterface(config);
    await db.initialize();
    return db;
  }

  async initialize() {
    switch (this.type) {
      case 'postgresql':
        await this.initializePostgreSQL();
        break;
      case 'sqlite':
        await this.initializeSQLite();
        break;
      case 'json':
      default:
        await this.initializeJSON();
        break;
    }
  }

  async initializePostgreSQL() {
    try {
      const { Client } = require('pg');
      this.client = new Client(this.config.postgresql);
      await this.client.connect();
      
      // Create tables if they don't exist
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS marketplace_listings (
          id SERIAL PRIMARY KEY,
          token_id INTEGER UNIQUE NOT NULL,
          title VARCHAR(255),
          description TEXT,
          location VARCHAR(255),
          price BIGINT,
          target_amount BIGINT,
          staking_contract VARCHAR(42),
          marketplace_contract VARCHAR(42),
          nft_contract VARCHAR(42),
          owner_address VARCHAR(42),
          original_owner VARCHAR(42),
          is_listed BOOLEAN DEFAULT FALSE,
          category VARCHAR(50),
          property_type VARCHAR(50),
          image_url TEXT,
          metadata_uri TEXT,
          total_staked BIGINT DEFAULT 0,
          shares_available INTEGER,
          blockchain_data JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_token_id ON marketplace_listings(token_id);
        CREATE INDEX IF NOT EXISTS idx_staking_contract ON marketplace_listings(staking_contract);
        CREATE INDEX IF NOT EXISTS idx_is_listed ON marketplace_listings(is_listed);
      `);
      
      console.log('✅ PostgreSQL database initialized');
    } catch (error) {
      console.warn('⚠️  PostgreSQL not available, falling back to JSON:', error.message);
      this.type = 'json';
      await this.initializeJSON();
    }
  }

  async initializeSQLite() {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');
      
      // Ensure directory exists
      const dir = path.dirname(this.config.sqlite.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = await open({
        filename: this.config.sqlite.filePath,
        driver: sqlite3.Database
      });

      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS marketplace_listings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token_id INTEGER UNIQUE NOT NULL,
          title TEXT,
          description TEXT,
          location TEXT,
          price INTEGER,
          target_amount INTEGER,
          staking_contract TEXT,
          marketplace_contract TEXT,
          nft_contract TEXT,
          owner_address TEXT,
          original_owner TEXT,
          is_listed INTEGER DEFAULT 0,
          category TEXT,
          property_type TEXT,
          image_url TEXT,
          metadata_uri TEXT,
          total_staked INTEGER DEFAULT 0,
          shares_available INTEGER,
          blockchain_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_token_id ON marketplace_listings(token_id);
        CREATE INDEX IF NOT EXISTS idx_staking_contract ON marketplace_listings(staking_contract);
      `);

      console.log('✅ SQLite database initialized');
    } catch (error) {
      console.warn('⚠️  SQLite not available, falling back to JSON:', error.message);
      this.type = 'json';
      await this.initializeJSON();
    }
  }

  async initializeJSON() {
    const dir = path.dirname(this.config.json.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.config.json.filePath)) {
      fs.writeFileSync(this.config.json.filePath, JSON.stringify([], null, 2));
    }

    console.log('✅ JSON file database initialized');
  }

  async checkListingExists(tokenId, stakingContract) {
    switch (this.type) {
      case 'postgresql':
        const pgResult = await this.client.query(
          'SELECT id FROM marketplace_listings WHERE token_id = $1 AND staking_contract = $2',
          [tokenId, stakingContract]
        );
        return pgResult.rows.length > 0;

      case 'sqlite':
        const sqliteResult = await this.db.get(
          'SELECT id FROM marketplace_listings WHERE token_id = ? AND staking_contract = ?',
          [tokenId, stakingContract]
        );
        return !!sqliteResult;

      case 'json':
      default:
        const data = JSON.parse(fs.readFileSync(this.config.json.filePath, 'utf8'));
        return data.some(listing => 
          listing.token_id === tokenId && listing.staking_contract === stakingContract
        );
    }
  }

  async insertListing(listing) {
    switch (this.type) {
      case 'postgresql':
        await this.client.query(`
          INSERT INTO marketplace_listings (
            token_id, title, description, location, price, target_amount, staking_contract,
            marketplace_contract, nft_contract, owner_address, original_owner, is_listed,
            category, property_type, image_url, metadata_uri, total_staked, shares_available,
            blockchain_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (token_id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            target_amount = EXCLUDED.target_amount,
            staking_contract = EXCLUDED.staking_contract,
            total_staked = EXCLUDED.total_staked,
            updated_at = NOW()
        `, [
          listing.token_id, listing.title, listing.description, listing.location,
          listing.price, listing.target_amount, listing.staking_contract,
          listing.marketplace_contract, listing.nft_contract, listing.owner_address,
          listing.original_owner, listing.is_listed, listing.category, listing.property_type,
          listing.image_url, listing.metadata_uri, listing.total_staked, listing.shares_available,
          JSON.stringify(listing.blockchain_data)
        ]);
        break;

      case 'sqlite':
        await this.db.run(`
          INSERT OR REPLACE INTO marketplace_listings (
            token_id, title, description, location, price, target_amount, staking_contract,
            marketplace_contract, nft_contract, owner_address, original_owner, is_listed,
            category, property_type, image_url, metadata_uri, total_staked, shares_available,
            blockchain_data, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          listing.token_id, listing.title, listing.description, listing.location,
          listing.price, listing.target_amount, listing.staking_contract,
          listing.marketplace_contract, listing.nft_contract, listing.owner_address,
          listing.original_owner, listing.is_listed ? 1 : 0, listing.category, listing.property_type,
          listing.image_url, listing.metadata_uri, listing.total_staked, listing.shares_available,
          JSON.stringify(listing.blockchain_data)
        ]);
        break;

      case 'json':
      default:
        const data = JSON.parse(fs.readFileSync(this.config.json.filePath, 'utf8'));
        const existingIndex = data.findIndex(l => l.token_id === listing.token_id);
        
        if (existingIndex >= 0) {
          data[existingIndex] = { ...data[existingIndex], ...listing, updated_at: new Date().toISOString() };
        } else {
          data.push({ ...listing, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }
        
        fs.writeFileSync(this.config.json.filePath, JSON.stringify(data, null, 2));
        break;
    }
  }

  async close() {
    switch (this.type) {
      case 'postgresql':
        if (this.client) await this.client.end();
        break;
      case 'sqlite':
        if (this.db) await this.db.close();
        break;
      case 'json':
      default:
        // No cleanup needed for JSON
        break;
    }
  }
}

/**
 * Main function to store marketplace listings
 */
async function storeMarketplaceListings(options = {}) {
  console.log('🗄️  Starting Marketplace Listings Database Storage...\n');

  const config = {
    // Contract addresses
    stakingFactoryAddress: options.stakingFactoryAddress || process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
    marketplaceAddress: options.marketplaceAddress || process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
    nftAddress: options.nftAddress || process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
    rpcUrl: options.rpcUrl || process.env.ALCHEMY_SEPOLIA_URL,
    
    // Token IDs to process (if not provided, will auto-discover)
    tokenIds: options.tokenIds || null,
    maxTokenIdScan: options.maxTokenIdScan || 1000,
    
    // Database configuration
    dbConfig: options.dbConfig || DB_CONFIG,
    
    // Processing options
    batchSize: options.batchSize || 10,
    includeUnlisted: options.includeUnlisted || false
  };

  console.log('📋 Configuration:');
  console.log(`   Database Type: ${config.dbConfig.type}`);
  console.log(`   RPC URL: ${config.rpcUrl}`);
  console.log(`   NFT Contract: ${config.nftAddress}`);
  console.log(`   Marketplace: ${config.marketplaceAddress}`);
  console.log(`   StakingFactory: ${config.stakingFactoryAddress}`);
  console.log(`   Token IDs: ${config.tokenIds ? config.tokenIds.join(', ') : 'Auto-discover'}`);
  console.log(`   Include Unlisted: ${config.includeUnlisted}\n`);

  try {
    // Initialize database
    const db = await DatabaseInterface.create(config.dbConfig);

    // Initialize blockchain provider and contracts
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const nftContract = new ethers.Contract(config.nftAddress, CONTRACT_ABIS.REAL_ESTATE_NFT, provider);
    const marketplace = new ethers.Contract(config.marketplaceAddress, CONTRACT_ABIS.MARKETPLACE, provider);
    const stakingFactory = new ethers.Contract(config.stakingFactoryAddress, CONTRACT_ABIS.STAKING_FACTORY, provider);

    // Determine which tokens to process
    let tokenIds = config.tokenIds;
    if (!tokenIds) {
      console.log('🔍 Auto-discovering NFTs...');
      tokenIds = await discoverNFTs(nftContract, config.maxTokenIdScan);
      console.log(`   Found ${tokenIds.length} NFTs`);
    }

    if (tokenIds.length === 0) {
      console.log('❌ No NFTs found to process');
      return;
    }

    // Process tokens in batches
    const results = {
      processed: 0,
      stored: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    console.log(`\n📦 Processing ${tokenIds.length} NFTs in batches of ${config.batchSize}...`);

    for (let i = 0; i < tokenIds.length; i += config.batchSize) {
      const batch = tokenIds.slice(i, i + config.batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i/config.batchSize) + 1}: NFTs ${batch[0]}-${batch[batch.length-1]}`);

      for (const tokenId of batch) {
        try {
          results.processed++;
          console.log(`\n   📦 Processing NFT #${tokenId}...`);

          // Get basic NFT data
          const exists = await nftContract.isThereTokenId(tokenId);
          if (!exists) {
            console.log(`      ❌ Token ${tokenId} does not exist`);
            results.skipped++;
            continue;
          }

          // Get staking contract
          const stakingContract = await stakingFactory.getStakingContractForNFT(tokenId);
          if (stakingContract === ethers.ZeroAddress) {
            if (!config.includeUnlisted) {
              console.log(`      ⏭️  No staking contract for token ${tokenId}, skipping`);
              results.skipped++;
              continue;
            }
          }

          // Check if already exists in database
          const exists_in_db = await db.checkListingExists(tokenId, stakingContract);
          if (exists_in_db) {
            console.log(`      ℹ️  Listing already exists, updating...`);
          }

          // Fetch all data
          const listingData = await fetchListingData(
            tokenId,
            nftContract,
            marketplace,
            stakingContract,
            provider,
            config
          );

          // Store in database
          await db.insertListing(listingData);

          if (exists_in_db) {
            results.updated++;
            console.log(`      ✅ Updated existing listing`);
          } else {
            results.stored++;
            console.log(`      ✅ Stored new listing`);
          }

        } catch (error) {
          results.errors++;
          console.log(`      ❌ Error processing NFT #${tokenId}: ${error.message}`);
        }
      }
    }

    await db.close();

    // Summary
    console.log('\n📊 STORAGE SUMMARY');
    console.log('='.repeat(50));
    console.log(`📈 Total Processed: ${results.processed}`);
    console.log(`✅ New Listings Stored: ${results.stored}`);
    console.log(`🔄 Existing Listings Updated: ${results.updated}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);

    console.log('\n🎉 Database storage completed successfully!');
    return results;

  } catch (error) {
    console.error('💥 Storage process failed:', error);
    throw error;
  }
}

/**
 * Discover available NFTs by scanning token IDs
 */
async function discoverNFTs(nftContract, maxTokenId) {
  const tokenIds = [];
  const batchSize = 50;

  for (let start = 1; start <= maxTokenId; start += batchSize) {
    const end = Math.min(start + batchSize - 1, maxTokenId);
    const promises = [];

    for (let tokenId = start; tokenId <= end; tokenId++) {
      promises.push(
        nftContract.isThereTokenId(tokenId)
          .then(exists => exists ? tokenId : null)
          .catch(() => null)
      );
    }

    const results = await Promise.all(promises);
    tokenIds.push(...results.filter(id => id !== null));

    if (end % 200 === 0) {
      console.log(`      Scanned up to token ID ${end}...`);
    }
  }

  return tokenIds;
}

/**
 * Fetch comprehensive listing data for a token
 */
async function fetchListingData(tokenId, nftContract, marketplace, stakingContract, provider, config) {
  const [
    description,
    owner,
    tokenURI,
    isListed
  ] = await Promise.allSettled([
    nftContract.getTokenDescription(tokenId),
    nftContract.ownerOf(tokenId),
    nftContract.tokenURI(tokenId),
    marketplace.listedBool(tokenId)
  ]);

  const listingData = {
    token_id: tokenId,
    title: description.status === 'fulfilled' ? description.value : `Property #${tokenId}`,
    description: description.status === 'fulfilled' ? description.value : `Real estate property ${tokenId}`,
    location: `Property Location ${tokenId}`, // Can be enhanced with real location data
    staking_contract: stakingContract,
    marketplace_contract: config.marketplaceAddress,
    nft_contract: config.nftAddress,
    owner_address: owner.status === 'fulfilled' ? owner.value : ethers.ZeroAddress,
    original_owner: owner.status === 'fulfilled' ? owner.value : ethers.ZeroAddress,
    is_listed: isListed.status === 'fulfilled' ? isListed.value : false,
    category: tokenId % 2 === 1 ? 'residential' : 'commercial',
    property_type: tokenId % 2 === 1 ? 'rwa' : 'digital asset',
    image_url: `/nfts/nft${tokenId}.jpg`,
    metadata_uri: tokenURI.status === 'fulfilled' ? tokenURI.value : null,
    price: 0,
    target_amount: 0,
    total_staked: 0,
    shares_available: Math.floor(Math.random() * 30) + 15
  };

  // Get marketplace listing data if listed
  if (listingData.is_listed) {
    try {
      const [listing, originalPrice, marketplaceOwner] = await Promise.allSettled([
        marketplace.listings(tokenId),
        marketplace.getOriginalPrice(tokenId),
        marketplace.tokenIdToOwner(tokenId)
      ]);

      if (listing.status === 'fulfilled') {
        listingData.price = Number(listing.value.price);
      }
      if (originalPrice.status === 'fulfilled') {
        listingData.target_amount = Number(originalPrice.value);
      }
      if (marketplaceOwner.status === 'fulfilled') {
        listingData.owner_address = marketplaceOwner.value;
      }
    } catch (error) {
      console.log(`      ⚠️  Error fetching marketplace data: ${error.message}`);
    }
  }

  // Get staking contract data if available
  if (stakingContract !== ethers.ZeroAddress) {
    try {
      const stakingContractInstance = new ethers.Contract(stakingContract, CONTRACT_ABIS.NFT_STAKING, provider);
      const [targetAmount, totalStaked] = await Promise.allSettled([
        stakingContractInstance.targetAmount(),
        stakingContractInstance.totalStaked()
      ]);

      if (targetAmount.status === 'fulfilled') {
        listingData.target_amount = Number(targetAmount.value);
      }
      if (totalStaked.status === 'fulfilled') {
        listingData.total_staked = Number(totalStaked.value);
      }
    } catch (error) {
      console.log(`      ⚠️  Error fetching staking data: ${error.message}`);
    }
  }

  // Add blockchain metadata
  listingData.blockchain_data = {
    network: 'sepolia',
    chain_id: 11155111,
    block_timestamp: Math.floor(Date.now() / 1000),
    has_staking_contract: stakingContract !== ethers.ZeroAddress,
    staking_contract_address: stakingContract,
    marketplace_listed: listingData.is_listed
  };

  return listingData;
}

/**
 * Command line argument parsing
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--token-ids':
        options.tokenIds = value.split(',').map(id => parseInt(id.trim()));
        break;
      case '--max-scan':
        options.maxTokenIdScan = parseInt(value);
        break;
      case '--db-type':
        options.dbConfig = { ...DB_CONFIG, type: value };
        break;
      case '--include-unlisted':
        options.includeUnlisted = value.toLowerCase() === 'true';
        break;
      case '--batch-size':
        options.batchSize = parseInt(value);
        break;
      case '--help':
        console.log(`
Usage: node store-marketplace-listings.js [options]

Options:
  --token-ids <ids>        Comma-separated list of token IDs to process (e.g., "1,2,3")
  --max-scan <number>      Maximum token ID to scan for auto-discovery (default: 1000)
  --db-type <type>         Database type: postgresql, sqlite, json (default: json)
  --include-unlisted       Include NFTs without staking contracts (default: false)
  --batch-size <number>    Processing batch size (default: 10)
  --help                   Show this help message

Examples:
  node store-marketplace-listings.js
  node store-marketplace-listings.js --token-ids "1,2,3,4,5,6"
  node store-marketplace-listings.js --db-type postgresql --include-unlisted true
  node store-marketplace-listings.js --max-scan 500 --batch-size 5
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Execute when run directly
if (require.main === module) {
  const options = parseCommandLineArgs();
  
  storeMarketplaceListings(options)
    .then(results => {
      console.log('\n🎊 Database storage completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Database storage failed:', error);
      process.exit(1);
    });
}

module.exports = { storeMarketplaceListings, DatabaseInterface };
