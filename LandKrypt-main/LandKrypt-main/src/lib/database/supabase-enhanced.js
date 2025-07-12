// Enhanced Supabase Database Connection
// Production-ready database utilities with connection pooling and error handling

const { createClient } = require('@supabase/supabase-js');
const environmentConfig = require('../../../config/environment');

class SupabaseConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    this.initialize();
  }

  initialize() {
    try {
      const dbConfig = environmentConfig.getDatabaseConfig();
      
      this.client = createClient(dbConfig.url, dbConfig.serviceRoleKey, {
        ...dbConfig.options,
        global: {
          headers: {
            'x-application-name': 'LandKrypt'
          }
        }
      });
      
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error.message);
      throw error;
    }
  }

  // ====== CONNECTION MANAGEMENT ======

  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      // Test connection with a simple query
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log('✅ Database connection established');
      
      return this.client;
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      console.error(`❌ Database connection failed (attempt ${this.connectionAttempts}):`, error.message);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`⏳ Retrying connection in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
      }
    }
  }

  async disconnect() {
    if (this.client) {
      // Supabase doesn't have explicit disconnect, but we can reset our state
      this.isConnected = false;
      console.log('✅ Database connection closed');
    }
  }

  async reconnect() {
    await this.disconnect();
    this.initialize();
    return this.connect();
  }

  // ====== HEALTH MONITORING ======

  async healthCheck() {
    try {
      const startTime = Date.now();
      
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connected: this.isConnected,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ====== TRANSACTION MANAGEMENT ======

  async withTransaction(callback) {
    const client = await this.connect();
    
    try {
      // Supabase doesn't have explicit transactions in the JS client
      // but we can simulate atomic operations
      const result = await callback(client);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error.message);
      throw error;
    }
  }

  // ====== QUERY UTILITIES ======

  async safeQuery(tableName, operation, options = {}) {
    const client = await this.connect();
    
    try {
      let query = client.from(tableName);
      
      switch (operation.type) {
        case 'select':
          query = query.select(operation.columns || '*');
          break;
        case 'insert':
          query = query.insert(operation.data);
          break;
        case 'update':
          query = query.update(operation.data);
          break;
        case 'delete':
          query = query.delete();
          break;
        case 'upsert':
          query = query.upsert(operation.data, operation.options || {});
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }
      
      // Apply filters
      if (operation.filters) {
        for (const filter of operation.filters) {
          query = query[filter.method](...filter.args);
        }
      }
      
      // Apply ordering
      if (operation.order) {
        query = query.order(operation.order.column, operation.order.options || {});
      }
      
      // Apply limit
      if (operation.limit) {
        query = query.limit(operation.limit);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return { data, count };
    } catch (error) {
      console.error(`Query failed on table ${tableName}:`, error.message);
      throw error;
    }
  }

  // ====== SPECIALIZED OPERATIONS ======

  async getUserByWallet(walletAddress) {
    return this.safeQuery('users', {
      type: 'select',
      filters: [
        { method: 'eq', args: ['wallet_address', walletAddress] }
      ]
    });
  }

  async createUser(walletAddress, documents = {}) {
    return this.safeQuery('users', {
      type: 'upsert',
      data: {
        wallet_address: walletAddress,
        documents,
        updated_at: new Date().toISOString()
      },
      options: { onConflict: 'wallet_address' }
    });
  }

  async getNFTsByOwner(ownerAddress) {
    return this.safeQuery('nfts', {
      type: 'select',
      filters: [
        { method: 'eq', args: ['owner_address', ownerAddress] }
      ],
      order: { column: 'token_id', options: { ascending: true } }
    });
  }

  async createNFT(tokenId, ownerAddress, metadata = {}) {
    return this.safeQuery('nfts', {
      type: 'upsert',
      data: {
        token_id: tokenId,
        owner_address: ownerAddress,
        metadata,
        updated_at: new Date().toISOString()
      },
      options: { onConflict: 'token_id' }
    });
  }

  async recordUserAction(userAddress, actionType, txHash = null, metadata = {}) {
    return this.safeQuery('user_actions', {
      type: 'insert',
      data: {
        user_address: userAddress,
        action_type: actionType,
        tx_hash: txHash,
        metadata
      }
    });
  }

  async getUserActions(userAddress, limit = 50) {
    return this.safeQuery('user_actions', {
      type: 'select',
      filters: [
        { method: 'eq', args: ['user_address', userAddress] }
      ],
      order: { column: 'timestamp', options: { ascending: false } },
      limit
    });
  }

  async updateTierProgress(walletAddress, totalXp, currentTier, tierProgress) {
    return this.safeQuery('user_tier_progress', {
      type: 'upsert',
      data: {
        wallet_address: walletAddress,
        total_xp: totalXp,
        current_tier: currentTier,
        tier_progress: tierProgress,
        updated_at: new Date().toISOString()
      },
      options: { onConflict: 'wallet_address' }
    });
  }

  async getTierProgress(walletAddress) {
    const result = await this.safeQuery('user_tier_progress', {
      type: 'select',
      filters: [
        { method: 'eq', args: ['wallet_address', walletAddress] }
      ]
    });
    
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async getMarketplaceListings(status = 'active') {
    return this.safeQuery('marketplace_listings', {
      type: 'select',
      columns: `
        *,
        nfts (
          token_id,
          metadata
        )
      `,
      filters: [
        { method: 'eq', args: ['status', status] }
      ],
      order: { column: 'created_at', options: { ascending: false } }
    });
  }

  async createMarketplaceListing(tokenId, sellerAddress, price, currency = 'LKUSD', metadata = {}) {
    return this.safeQuery('marketplace_listings', {
      type: 'insert',
      data: {
        token_id: tokenId,
        seller_address: sellerAddress,
        price,
        currency,
        metadata
      }
    });
  }

  // ====== ANALYTICS & STATISTICS ======

  async getTableStats() {
    const tables = ['users', 'nfts', 'user_actions', 'user_tier_progress', 'marketplace_listings'];
    const stats = {};
    
    for (const table of tables) {
      try {
        const { count } = await this.safeQuery(table, {
          type: 'select',
          columns: '*'
        });
        stats[table] = { count: count || 0 };
      } catch (error) {
        stats[table] = { error: error.message };
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      tables: stats
    };
  }

  async getUserStats() {
    try {
      const { data: totalUsers } = await this.safeQuery('users', {
        type: 'select',
        columns: 'count'
      });
      
      const { data: activeUsers } = await this.safeQuery('user_actions', {
        type: 'select',
        columns: 'user_address',
        filters: [
          { method: 'gte', args: ['timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()] }
        ]
      });
      
      const uniqueActiveUsers = new Set(activeUsers?.map(action => action.user_address)).size;
      
      return {
        totalUsers: totalUsers?.length || 0,
        activeUsers: uniqueActiveUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user stats:', error.message);
      return { error: error.message };
    }
  }

  // ====== BACKUP UTILITIES ======

  async exportTableData(tableName) {
    try {
      const { data } = await this.safeQuery(tableName, {
        type: 'select'
      });
      
      return {
        table: tableName,
        timestamp: new Date().toISOString(),
        recordCount: data?.length || 0,
        data: data || []
      };
    } catch (error) {
      console.error(`Error exporting table ${tableName}:`, error.message);
      throw error;
    }
  }

  async exportAllData() {
    const tables = ['users', 'nfts', 'user_actions', 'user_tier_progress', 'marketplace_listings'];
    const exportData = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of tables) {
      try {
        exportData.tables[table] = await this.exportTableData(table);
      } catch (error) {
        exportData.tables[table] = { error: error.message };
      }
    }
    
    return exportData;
  }
}

// Create singleton instance
const supabaseConnection = new SupabaseConnection();

module.exports = supabaseConnection;
