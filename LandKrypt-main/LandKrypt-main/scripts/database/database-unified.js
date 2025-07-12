// Unified LandKrypt Database Access & Management
// Consolidates all database operations into a single, production-ready module

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Environment validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Validate environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Initialize Supabase client with error handling
const supabase = createClient(
  requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class LandKryptDatabase {
  constructor() {
    this.supabase = supabase;
    this.dataPath = path.join(__dirname, '../../data');
    this.jsonDataPath = path.join(this.dataPath, 'json');
    this.backupPath = path.join(this.dataPath, 'backups');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [this.dataPath, this.jsonDataPath, this.backupPath];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ====== CONNECTION & HEALTH CHECKS ======

  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async getHealthStatus() {
    try {
      const startTime = Date.now();
      await this.testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ====== SCHEMA MANAGEMENT ======

  async setupTables() {
    console.log('🔧 Setting up database tables...');
    
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(42) UNIQUE NOT NULL,
            documents JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
        `
      },
      {
        name: 'nfts',
        sql: `
          CREATE TABLE IF NOT EXISTS nfts (
            id SERIAL PRIMARY KEY,
            token_id INTEGER UNIQUE NOT NULL,
            owner_address VARCHAR(42) NOT NULL,
            has_proposal BOOLEAN DEFAULT FALSE,
            market_listed BOOLEAN DEFAULT FALSE,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON nfts(token_id);
          CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_address);
        `
      },
      {
        name: 'user_actions',
        sql: `
          CREATE TABLE IF NOT EXISTS user_actions (
            id SERIAL PRIMARY KEY,
            user_address VARCHAR(42) NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            tx_hash VARCHAR(66) UNIQUE,
            metadata JSONB DEFAULT '{}',
            timestamp TIMESTAMP DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_actions_user ON user_actions(user_address);
          CREATE INDEX IF NOT EXISTS idx_actions_type ON user_actions(action_type);
          CREATE INDEX IF NOT EXISTS idx_actions_tx ON user_actions(tx_hash);
        `
      },
      {
        name: 'user_tier_progress',
        sql: `
          CREATE TABLE IF NOT EXISTS user_tier_progress (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(42) UNIQUE NOT NULL,
            total_xp INTEGER DEFAULT 0,
            tier_progress INTEGER DEFAULT 0,
            current_tier INTEGER DEFAULT 1,
            last_login TIMESTAMP DEFAULT NOW(),
            last_daily_xp_claim TIMESTAMP DEFAULT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_tier_wallet ON user_tier_progress(wallet_address);
          CREATE INDEX IF NOT EXISTS idx_tier_current ON user_tier_progress(current_tier);
        `
      },
      {
        name: 'marketplace_listings',
        sql: `
          CREATE TABLE IF NOT EXISTS marketplace_listings (
            id SERIAL PRIMARY KEY,
            token_id INTEGER NOT NULL,
            seller_address VARCHAR(42) NOT NULL,
            price DECIMAL(20,8) NOT NULL,
            currency VARCHAR(10) DEFAULT 'LKUSD',
            status VARCHAR(20) DEFAULT 'active',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_listings_token ON marketplace_listings(token_id);
          CREATE INDEX IF NOT EXISTS idx_listings_seller ON marketplace_listings(seller_address);
          CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
        `
      }
    ];

    for (const table of tables) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: table.sql });
        if (error) {
          console.error(`❌ Failed to create table ${table.name}:`, error);
        } else {
          console.log(`✅ Table ${table.name} ready`);
        }
      } catch (error) {
        console.error(`❌ Error setting up table ${table.name}:`, error.message);
      }
    }
    
    console.log('✅ Database schema setup complete');
  }

  // ====== DATA OPERATIONS ======

  async insertUser(walletAddress, documents = {}) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .upsert({
          wallet_address: walletAddress,
          documents,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error inserting user:', error);
      throw error;
    }
  }

  async insertNFT(tokenId, ownerAddress, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .upsert({
          token_id: tokenId,
          owner_address: ownerAddress,
          metadata,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'token_id'
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error inserting NFT:', error);
      throw error;
    }
  }

  async recordUserAction(userAddress, actionType, txHash = null, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('user_actions')
        .insert({
          user_address: userAddress,
          action_type: actionType,
          tx_hash: txHash,
          metadata
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error recording user action:', error);
      throw error;
    }
  }

  async updateTierProgress(walletAddress, xpGained, newTier = null) {
    try {
      const updateData = {
        wallet_address: walletAddress,
        total_xp: this.supabase.raw('total_xp + ?', [xpGained]),
        updated_at: new Date().toISOString()
      };

      if (newTier !== null) {
        updateData.current_tier = newTier;
        updateData.tier_progress = 0; // Reset progress when tier changes
      }

      const { data, error } = await this.supabase
        .from('user_tier_progress')
        .upsert(updateData, {
          onConflict: 'wallet_address'
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating tier progress:', error);
      throw error;
    }
  }

  // ====== QUERY OPERATIONS ======

  async getUserByWallet(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getNFTsByOwner(ownerAddress) {
    try {
      const { data, error } = await this.supabase
        .from('nfts')
        .select('*')
        .eq('owner_address', ownerAddress)
        .order('token_id', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  async getMarketplaceListings(status = 'active') {
    try {
      const { data, error } = await this.supabase
        .from('marketplace_listings')
        .select(`
          *,
          nfts (
            token_id,
            metadata
          )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      return [];
    }
  }

  async getUserActions(userAddress, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('user_actions')
        .select('*')
        .eq('user_address', userAddress)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user actions:', error);
      return [];
    }
  }

  async getTierProgress(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('user_tier_progress')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tier progress:', error);
      return null;
    }
  }

  // ====== STATISTICS & ANALYTICS ======

  async getDatabaseStats() {
    try {
      const stats = {};
      
      const tables = ['users', 'nfts', 'user_actions', 'user_tier_progress', 'marketplace_listings'];
      
      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          stats[table] = { error: error.message };
        } else {
          stats[table] = { count };
        }
      }
      
      return {
        timestamp: new Date().toISOString(),
        tables: stats
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { error: error.message };
    }
  }

  // ====== JSON DATA MANAGEMENT ======

  readJSONData(filename) {
    try {
      const filepath = path.join(this.jsonDataPath, filename);
      if (!fs.existsSync(filepath)) {
        console.warn(`JSON file not found: ${filename}`);
        return null;
      }
      
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading JSON file ${filename}:`, error);
      return null;
    }
  }

  writeJSONData(filename, data) {
    try {
      const filepath = path.join(this.jsonDataPath, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`✅ JSON data written to: ${filename}`);
      return true;
    } catch (error) {
      console.error(`Error writing JSON file ${filename}:`, error);
      return false;
    }
  }

  // ====== BACKUP & RESTORE ======

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupPath, `backup-${timestamp}`);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const tables = ['users', 'nfts', 'user_actions', 'user_tier_progress', 'marketplace_listings'];
      
      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select('*');
        
        if (error) {
          console.error(`Error backing up table ${table}:`, error);
          continue;
        }
        
        const filename = `${table}.json`;
        const filepath = path.join(backupDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`✅ Backed up table: ${table}`);
      }
      
      console.log(`✅ Backup completed: ${backupDir}`);
      return backupDir;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const db = new LandKryptDatabase();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'test':
        await db.testConnection();
        break;
        
      case 'setup':
        await db.setupTables();
        break;
        
      case 'health':
        const health = await db.getHealthStatus();
        console.log('Database Health:', health);
        break;
        
      case 'stats':
        const stats = await db.getDatabaseStats();
        console.log('Database Statistics:', JSON.stringify(stats, null, 2));
        break;
        
      case 'backup':
        await db.createBackup();
        break;
        
      case 'user':
        if (args[0]) {
          const user = await db.getUserByWallet(args[0]);
          console.log('User Data:', user);
        } else {
          console.log('Usage: node database-unified.js user <wallet_address>');
        }
        break;
        
      default:
        console.log(`
LandKrypt Database Management Tool

Usage: node database-unified.js <command> [args]

Commands:
  test              Test database connection
  setup             Setup database tables
  health            Check database health
  stats             Show database statistics
  backup            Create database backup
  user <address>    Get user by wallet address

Examples:
  node database-unified.js test
  node database-unified.js setup
  node database-unified.js user 0x123...
        `);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = LandKryptDatabase;

// Run CLI if called directly
if (require.main === module) {
  main();
}
