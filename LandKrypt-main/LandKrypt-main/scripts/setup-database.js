#!/usr/bin/env node

// Database Setup Script
// Initializes Supabase tables for tracking user stakes and votes

import DatabaseService from '../src/lib/supabase.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔗 LandKrypt Database Setup');
console.log('==========================\n');

async function setupDatabase() {
  try {
    console.log('🏗️  Initializing database service...');
    const db = new DatabaseService(true); // Use admin client
    
    console.log('📝 Creating database tables...');
    await db.initializeTables();
    
    console.log('✅ Database tables created successfully!\n');
    
    console.log('📊 Created Tables:');
    console.log('├── user_actions - General user actions tracking');
    console.log('├── nft_stakes - Detailed staking records');
    console.log('└── nft_votes - Voting history');
    
    console.log('\n🔍 Table Features:');
    console.log('├── Primary keys and indexes for performance');
    console.log('├── Foreign key relationships');
    console.log('├── JSONB metadata fields for flexibility');
    console.log('└── Timestamp tracking for all records');
    
    console.log('\n✨ Ready to track:');
    console.log('├── ✅ Stake transactions per NFT');
    console.log('├── ✅ Vote actions per NFT');
    console.log('├── ✅ User-specific action history');
    console.log('└── ✅ NFT analytics and statistics');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Connect wallet and perform stake/vote actions');
    console.log('3. Check database records in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.message.includes('exec_sql')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check that you have the exec_sql function enabled in Supabase');
      console.log('2. Verify your SUPABASE_SERVICE_ROLE_KEY has sufficient permissions');
      console.log('3. Try running the SQL directly in Supabase SQL Editor');
    }
    
    process.exit(1);
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log('🔐 Testing database connection...');
    const db = new DatabaseService(true);
    
    // Try a simple query to test connection
    const { data, error } = await db.client
      .from('pg_tables')
      .select('tablename')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Database connection successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Check your environment variables:');
    console.log('├── NEXT_PUBLIC_SUPABASE_URL');
    console.log('└── SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }
}

// Main execution
async function main() {
  console.log('⚡ Skipping connection test, proceeding with setup...');
  await setupDatabase();
}

main().catch(console.error);
