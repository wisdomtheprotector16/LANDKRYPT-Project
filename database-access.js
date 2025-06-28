// LANDKRYPT Database Access Utility
// This script provides easy access to your project's databases

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class LandKryptDB {
  constructor() {
    this.supabase = supabase;
    this.jsonDataPath = path.join(__dirname, 'LandKrypt-main', 'LandKrypt-main', 'data');
  }

  // ====== SUPABASE OPERATIONS ======

  async connectToSupabase() {
    try {
      const { data, error } = await this.supabase.from('_realtime_subscription').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      console.log('✅ Connected to Supabase successfully!');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
  }

  // Setup database tables (run this first)
  async setupTables() {
    try {
      console.log('🔧 Setting up database tables...');
      
      // Create users table
      const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) UNIQUE,
          documents JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create nfts table  
      const nftsTable = `
        CREATE TABLE IF NOT EXISTS nfts (
          id SERIAL PRIMARY KEY,
          token_id INT UNIQUE,
          owner_address VARCHAR(42),
          has_proposal BOOLEAN DEFAULT FALSE,
          market_listed BOOLEAN DEFAULT FALSE,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create user_actions table
      const userActionsTable = `
        CREATE TABLE IF NOT EXISTS user_actions (
          id SERIAL PRIMARY KEY,
          user_address VARCHAR(42),
          action_type VARCHAR(20),
          tx_hash VARCHAR(66) UNIQUE,
          timestamp TIMESTAMP DEFAULT NOW()
        );
      `;

      // Create marketplace_listings table (extended)
      const marketplaceTable = `
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
      `;

      await this.supabase.rpc('exec_sql', { sql: usersTable });
      await this.supabase.rpc('exec_sql', { sql: nftsTable });
      await this.supabase.rpc('exec_sql', { sql: userActionsTable });
      await this.supabase.rpc('exec_sql', { sql: marketplaceTable });

      console.log('✅ Database tables created successfully!');
    } catch (error) {
      console.error('❌ Failed to setup tables:', error);
    }
  }

  // Get all marketplace listings
  async getMarketplaceListings() {
    try {
      const { data, error } = await this.supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      return null;
    }
  }

  // Get user actions
  async getUserActions(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('user_actions')
        .select('*')
        .eq('user_address', walletAddress)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user actions:', error);
      return null;
    }
  }

  // Add user action
  async addUserAction(userAddress, actionType, txHash) {
    try {
      const { data, error } = await this.supabase
        .from('user_actions')
        .insert([{
          user_address: userAddress,
          action_type: actionType,
          tx_hash: txHash
        }])
        .select();

      if (error) throw error;
      console.log('✅ User action recorded:', data);
      return data;
    } catch (error) {
      console.error('Error adding user action:', error);
      return null;
    }
  }

  // Import JSON data to Supabase
  async importJSONData() {
    try {
      const jsonFile = path.join(this.jsonDataPath, 'marketplace-listings.json');
      if (!fs.existsSync(jsonFile)) {
        console.log('📝 JSON file not found, skipping import');
        return;
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      console.log(`📊 Importing ${jsonData.length} listings to Supabase...`);

      const { data, error } = await this.supabase
        .from('marketplace_listings')
        .upsert(jsonData, { onConflict: 'token_id' });

      if (error) throw error;
      console.log('✅ JSON data imported successfully!');
      return data;
    } catch (error) {
      console.error('❌ Failed to import JSON data:', error);
    }
  }

  // ====== JSON FILE OPERATIONS ======

  readJSONData(filename) {
    try {
      const filePath = path.join(this.jsonDataPath, filename);
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filename}`);
        return null;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ Read ${data.length} records from ${filename}`);
      return data;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return null;
    }
  }

  // ====== UTILITY METHODS ======

  async getDatabaseStats() {
    try {
      console.log('\n📊 DATABASE STATISTICS');
      console.log('=====================================');

      // Supabase stats
      const marketplaceCount = await this.supabase
        .from('marketplace_listings')
        .select('id', { count: 'exact' });

      const userActionsCount = await this.supabase
        .from('user_actions')
        .select('id', { count: 'exact' });

      console.log(`📈 Marketplace Listings (Supabase): ${marketplaceCount.count || 0}`);
      console.log(`📈 User Actions (Supabase): ${userActionsCount.count || 0}`);

      // JSON file stats
      const jsonFiles = ['marketplace-listings.json', 'nft-listings.json', 'all-listings.json'];
      jsonFiles.forEach(file => {
        const data = this.readJSONData(file);
        if (data) {
          console.log(`📁 ${file}: ${data.length} records`);
        }
      });

      console.log('=====================================\n');
    } catch (error) {
      console.error('Error getting database stats:', error);
    }
  }
}

// ====== CLI INTERFACE ======

async function main() {
  const db = new LandKryptDB();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'connect':
      await db.connectToSupabase();
      break;
      
    case 'setup':
      await db.setupTables();
      break;
      
    case 'import':
      await db.importJSONData();
      break;
      
    case 'stats':
      await db.getDatabaseStats();
      break;
      
    case 'listings':
      const listings = await db.getMarketplaceListings();
      console.log('Marketplace Listings:', listings);
      break;
      
    case 'actions':
      const address = args[1];
      if (!address) {
        console.log('❌ Please provide wallet address: node database-access.js actions 0x...');
        return;
      }
      const actions = await db.getUserActions(address);
      console.log('User Actions:', actions);
      break;
      
    case 'json':
      const filename = args[1] || 'marketplace-listings.json';
      const data = db.readJSONData(filename);
      console.log('JSON Data:', data);
      break;
      
    default:
      console.log(`
🔗 LANDKRYPT Database Access Commands:

node database-access.js connect     - Test Supabase connection
node database-access.js setup       - Create database tables
node database-access.js import      - Import JSON data to Supabase
node database-access.js stats       - Show database statistics
node database-access.js listings    - Get all marketplace listings
node database-access.js actions <wallet> - Get user actions
node database-access.js json <file> - Read JSON file data

Examples:
node database-access.js connect
node database-access.js actions 0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC
node database-access.js json marketplace-listings.json
      `);
  }
}

// Export for use in other files
module.exports = LandKryptDB;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
