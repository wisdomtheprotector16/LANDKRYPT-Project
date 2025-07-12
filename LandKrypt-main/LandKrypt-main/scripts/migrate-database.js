// Database Migration Script for Enhanced Contracts
// Migrates existing database to support upgraded contract features

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseMigrator {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'landkrypt',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
  }

  async connect() {
    try {
      await this.pool.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async runMigration() {
    console.log('🔄 Starting database migration for enhanced contracts...\n');

    try {
      await this.connect();

      // Run migration steps
      await this.backupExistingData();
      await this.runUpgradeSQL();
      await this.migrateExistingData();
      await this.createIndexes();
      await this.verifyMigration();

      console.log('\n✅ Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      await this.rollback();
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  async backupExistingData() {
    console.log('📦 Creating backup of existing data...');

    const backupQueries = [
      `CREATE TABLE IF NOT EXISTS backup_nft_ownership AS SELECT * FROM nft_ownership;`,
      `CREATE TABLE IF NOT EXISTS backup_nft_stakes AS SELECT * FROM nft_stakes;`,
      `CREATE TABLE IF NOT EXISTS backup_proposals AS SELECT * FROM proposals;`,
      `CREATE TABLE IF NOT EXISTS backup_user_tier_progress AS SELECT * FROM user_tier_progress;`,
    ];

    for (const query of backupQueries) {
      try {
        await this.pool.query(query);
      } catch (error) {
        console.log(`   ⚠️  Backup query skipped (table may not exist): ${error.message}`);
      }
    }

    console.log('✅ Backup completed');
  }

  async runUpgradeSQL() {
    console.log('🔧 Running database upgrade SQL...');

    const sqlPath = path.join(__dirname, '../database-upgrades.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await this.pool.query(statement);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`   ❌ Error executing statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log('✅ Database schema upgraded');
  }

  async migrateExistingData() {
    console.log('🔄 Migrating existing data to new schema...');

    // Migrate NFT ownership data
    await this.migrateNFTData();
    
    // Migrate staking data
    await this.migrateStakingData();
    
    // Migrate governance data
    await this.migrateGovernanceData();
    
    // Migrate tier data
    await this.migrateTierData();

    console.log('✅ Data migration completed');
  }

  async migrateNFTData() {
    console.log('   📝 Migrating NFT data...');

    // Update existing NFT records with new fields
    const updateNFTQuery = `
      UPDATE nft_ownership 
      SET 
        property_data = COALESCE(property_data, '{}'),
        royalty_info = COALESCE(royalty_info, '{}'),
        rarity_score = COALESCE(rarity_score, 1),
        property_type = COALESCE(property_type, 1),
        location_id = COALESCE(location_id, 1)
      WHERE property_data IS NULL OR royalty_info IS NULL;
    `;

    await this.pool.query(updateNFTQuery);

    // Create sample batch operations for existing NFTs
    const createBatchOpsQuery = `
      INSERT INTO batch_operations (operation_type, batch_id, user_address, nft_contract, token_ids, tx_hash, gas_used, status, created_at)
      SELECT 
        'single_mint' as operation_type,
        'legacy-' || id as batch_id,
        owner_address as user_address,
        contract_address as nft_contract,
        ARRAY[token_id] as token_ids,
        COALESCE(transaction_hash, '0x0000000000000000000000000000000000000000000000000000000000000000') as tx_hash,
        150000 as gas_used,
        'completed' as status,
        created_at
      FROM nft_ownership 
      WHERE NOT EXISTS (
        SELECT 1 FROM batch_operations WHERE batch_id = 'legacy-' || nft_ownership.id
      );
    `;

    await this.pool.query(createBatchOpsQuery);
    console.log('   ✅ NFT data migrated');
  }

  async migrateStakingData() {
    console.log('   🔒 Migrating staking data...');

    // Update existing stakes with new fields
    const updateStakesQuery = `
      UPDATE nft_stakes 
      SET 
        pool_id = COALESCE(pool_id, 0),
        staking_type = COALESCE(staking_type, 'token'),
        lock_period = COALESCE(lock_period, 0),
        tier_multiplier = COALESCE(tier_multiplier, 1.0),
        booster_active = COALESCE(booster_active, false),
        booster_multiplier = COALESCE(booster_multiplier, 1.0)
      WHERE pool_id IS NULL;
    `;

    await this.pool.query(updateStakesQuery);

    // Create default staking pool
    const createDefaultPoolQuery = `
      INSERT INTO staking_pools (pool_id, pool_name, staking_token, reward_token, allocation_points, min_stake_amount, lock_period, apy_rate, is_active)
      VALUES (0, 'Default Token Pool', $1, $1, 100, $2, 0, 12.0, true)
      ON CONFLICT (pool_id) DO NOTHING;
    `;

    const mockTokenAddress = process.env.NEXT_PUBLIC_MOCK_ERC20 || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    await this.pool.query(createDefaultPoolQuery, [mockTokenAddress, '1000000000000000000']); // 1 token minimum

    console.log('   ✅ Staking data migrated');
  }

  async migrateGovernanceData() {
    console.log('   🗳️  Migrating governance data...');

    // Update existing proposals with new fields
    const updateProposalsQuery = `
      UPDATE proposals 
      SET 
        proposal_type = COALESCE(proposal_type, 'standard'),
        voting_power_snapshot = COALESCE(voting_power_snapshot, '{}'),
        quadratic_votes = COALESCE(quadratic_votes, 0)
      WHERE proposal_type IS NULL;
    `;

    await this.pool.query(updateProposalsQuery);

    // Migrate existing votes to new governance_votes table
    const migrateVotesQuery = `
      INSERT INTO governance_votes (
        proposal_id, voter_address, vote_choice, voting_power, quadratic_weight, 
        token_balance, nft_count, tx_hash, block_number, timestamp
      )
      SELECT 
        proposal_id,
        voter_address,
        CASE 
          WHEN vote = 'for' THEN 1
          WHEN vote = 'against' THEN 0
          ELSE 2
        END as vote_choice,
        COALESCE(voting_power::numeric, 0) as voting_power,
        SQRT(COALESCE(voting_power::numeric, 0)) as quadratic_weight,
        COALESCE(voting_power::numeric, 0) as token_balance,
        0 as nft_count,
        COALESCE(transaction_hash, '0x0000000000000000000000000000000000000000000000000000000000000000') as tx_hash,
        0 as block_number,
        created_at as timestamp
      FROM nft_votes 
      WHERE NOT EXISTS (
        SELECT 1 FROM governance_votes 
        WHERE governance_votes.proposal_id = nft_votes.proposal_id 
        AND governance_votes.voter_address = nft_votes.voter_address
      );
    `;

    try {
      await this.pool.query(migrateVotesQuery);
    } catch (error) {
      console.log('   ⚠️  Vote migration skipped (nft_votes table may not exist)');
    }

    console.log('   ✅ Governance data migrated');
  }

  async migrateTierData() {
    console.log('   ⭐ Migrating tier system data...');

    // Update existing tier progress with new fields
    const updateTierQuery = `
      UPDATE user_tier_progress 
      SET 
        nfts_owned = COALESCE(nfts_owned, 0),
        total_staked = COALESCE(total_staked, 0),
        marketplace_transactions = COALESCE(marketplace_transactions, 0),
        governance_participation = COALESCE(governance_participation, 0),
        consecutive_days = COALESCE(consecutive_days, 0),
        referral_count = COALESCE(referral_count, 0),
        milestone_badges = COALESCE(milestone_badges, '[]'),
        last_activity = COALESCE(last_activity, NOW())
      WHERE nfts_owned IS NULL;
    `;

    await this.pool.query(updateTierQuery);

    // Calculate actual values from existing data
    const updateCalculatedValuesQuery = `
      UPDATE user_tier_progress 
      SET 
        nfts_owned = (
          SELECT COUNT(*) FROM nft_ownership 
          WHERE owner_address = user_tier_progress.wallet_address
        ),
        total_staked = (
          SELECT COALESCE(SUM(amount_staked), 0) FROM nft_stakes 
          WHERE user_address = user_tier_progress.wallet_address AND is_active = true
        ),
        governance_participation = (
          SELECT COUNT(*) FROM governance_votes 
          WHERE voter_address = user_tier_progress.wallet_address
        );
    `;

    await this.pool.query(updateCalculatedValuesQuery);

    console.log('   ✅ Tier data migrated');
  }

  async createIndexes() {
    console.log('🔍 Creating performance indexes...');

    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_operations_user_type ON batch_operations(user_address, operation_type);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_active ON marketplace_listings(status) WHERE status = \'active\';',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_governance_votes_proposal_voter ON governance_votes(proposal_id, voter_address);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tier_progress_tier ON user_tier_progress(current_tier);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_xp_activities_user_date ON xp_activities(user_address, created_at);',
    ];

    for (const indexQuery of indexes) {
      try {
        await this.pool.query(indexQuery);
      } catch (error) {
        console.log(`   ⚠️  Index creation skipped: ${error.message}`);
      }
    }

    console.log('✅ Indexes created');
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');

    const verificationQueries = [
      {
        name: 'Enhanced NFT tables',
        query: 'SELECT COUNT(*) FROM batch_operations;',
      },
      {
        name: 'Enhanced marketplace tables',
        query: 'SELECT COUNT(*) FROM marketplace_listings;',
      },
      {
        name: 'Enhanced staking tables',
        query: 'SELECT COUNT(*) FROM staking_pools;',
      },
      {
        name: 'Enhanced governance tables',
        query: 'SELECT COUNT(*) FROM governance_votes;',
      },
      {
        name: 'Enhanced tier system',
        query: 'SELECT COUNT(*) FROM xp_activities;',
      },
    ];

    for (const verification of verificationQueries) {
      try {
        const result = await this.pool.query(verification.query);
        console.log(`   ✅ ${verification.name}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${verification.name}: Failed - ${error.message}`);
      }
    }

    console.log('✅ Migration verification completed');
  }

  async rollback() {
    console.log('🔄 Rolling back migration...');

    try {
      // Restore from backup tables
      const rollbackQueries = [
        'DROP TABLE IF EXISTS nft_ownership CASCADE;',
        'ALTER TABLE backup_nft_ownership RENAME TO nft_ownership;',
        'DROP TABLE IF EXISTS nft_stakes CASCADE;',
        'ALTER TABLE backup_nft_stakes RENAME TO nft_stakes;',
        'DROP TABLE IF EXISTS proposals CASCADE;',
        'ALTER TABLE backup_proposals RENAME TO proposals;',
        'DROP TABLE IF EXISTS user_tier_progress CASCADE;',
        'ALTER TABLE backup_user_tier_progress RENAME TO user_tier_progress;',
      ];

      for (const query of rollbackQueries) {
        try {
          await this.pool.query(query);
        } catch (error) {
          console.log(`   ⚠️  Rollback query skipped: ${error.message}`);
        }
      }

      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }

  async cleanupBackups() {
    console.log('🧹 Cleaning up backup tables...');

    const cleanupQueries = [
      'DROP TABLE IF EXISTS backup_nft_ownership;',
      'DROP TABLE IF EXISTS backup_nft_stakes;',
      'DROP TABLE IF EXISTS backup_proposals;',
      'DROP TABLE IF EXISTS backup_user_tier_progress;',
    ];

    for (const query of cleanupQueries) {
      try {
        await this.pool.query(query);
      } catch (error) {
        console.log(`   ⚠️  Cleanup query skipped: ${error.message}`);
      }
    }

    console.log('✅ Backup cleanup completed');
  }

  async generateMigrationReport() {
    console.log('\n📊 Generating Migration Report...\n');

    const reportQueries = [
      {
        title: 'Database Tables',
        query: `
          SELECT table_name, 
                 (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
          FROM information_schema.tables t 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `,
      },
      {
        title: 'Enhanced Features Status',
        query: `
          SELECT 
            'Batch Operations' as feature,
            COUNT(*) as records,
            'Enhanced NFT minting tracking' as description
          FROM batch_operations
          UNION ALL
          SELECT 
            'Marketplace Listings' as feature,
            COUNT(*) as records,
            'Advanced marketplace with auctions' as description
          FROM marketplace_listings
          UNION ALL
          SELECT 
            'Staking Pools' as feature,
            COUNT(*) as records,
            'Multi-asset staking system' as description
          FROM staking_pools
          UNION ALL
          SELECT 
            'Governance Votes' as feature,
            COUNT(*) as records,
            'Quadratic voting system' as description
          FROM governance_votes;
        `,
      },
    ];

    for (const report of reportQueries) {
      console.log(`📋 ${report.title}:`);
      try {
        const result = await this.pool.query(report.query);
        console.table(result.rows);
      } catch (error) {
        console.log(`   ❌ Report generation failed: ${error.message}`);
      }
      console.log('');
    }
  }
}

// Export for use in other scripts
module.exports = { DatabaseMigrator };

// Run migration if called directly
if (require.main === module) {
  async function main() {
    const migrator = new DatabaseMigrator();
    
    try {
      await migrator.runMigration();
      await migrator.generateMigrationReport();
      
      // Optionally clean up backups
      const cleanup = process.argv.includes('--cleanup');
      if (cleanup) {
        await migrator.cleanupBackups();
      }
      
      console.log('\n🎉 Database migration completed successfully!');
      console.log('💡 Run with --cleanup flag to remove backup tables');
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    }
  }

  main();
}
