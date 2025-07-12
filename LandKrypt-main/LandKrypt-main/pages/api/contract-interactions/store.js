// API endpoint for storing contract interactions in database
// Handles all blockchain transaction data storage

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      table, 
      action, 
      data, 
      where 
    } = req.body;

    // Validate required fields
    if (!table || !action || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: table, action, data' 
      });
    }

    let result;

    switch (action) {
      case 'INSERT':
        result = await handleInsert(table, data);
        break;
      case 'UPDATE':
        result = await handleUpdate(table, data, where);
        break;
      case 'UPSERT':
        result = await handleUpsert(table, data);
        break;
      default:
        return res.status(400).json({ 
          error: `Unsupported action: ${action}` 
        });
    }

    if (result.error) {
      console.error('Database operation failed:', result.error);
      return res.status(500).json({ 
        error: 'Database operation failed',
        details: result.error.message 
      });
    }

    return res.status(200).json({
      success: true,
      action,
      table,
      data: result.data,
      message: `${action} operation completed successfully`
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function handleInsert(table, data) {
  console.log(`📝 Inserting into ${table}:`, data);

  switch (table) {
    case 'nft_ownership':
      return await supabase
        .from('nft_ownership')
        .insert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          contract_address: data.contract_address,
          previous_owner: data.previous_owner,
          tx_hash: data.tx_hash,
          block_number: parseInt(data.block_number),
          action_type: data.action_type,
          timestamp: data.timestamp,
          metadata: data.metadata || {}
        });

    case 'user_actions':
      return await supabase
        .from('user_actions')
        .insert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          action_type: data.action_type,
          tx_hash: data.tx_hash,
          block_number: parseInt(data.block_number),
          amount: data.amount,
          metadata: data.metadata || {},
          timestamp: data.timestamp
        });

    case 'nft_stakes':
      return await supabase
        .from('nft_stakes')
        .insert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          staking_contract: data.staking_contract,
          amount: data.amount,
          start_timestamp: data.start_timestamp || data.timestamp,
          end_timestamp: data.end_timestamp,
          is_active: data.is_active !== undefined ? data.is_active : true,
          tx_hash: data.tx_hash,
          rewards_earned: data.rewards_earned || '0',
          metadata: data.metadata || {}
        });

    case 'marketplace_listings':
      return await supabase
        .from('marketplace_listings')
        .insert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          contract_address: data.contract_address,
          price: data.price,
          tx_hash: data.tx_hash,
          block_number: parseInt(data.block_number),
          is_active: data.is_active !== undefined ? data.is_active : true,
          action_type: data.action_type,
          timestamp: data.timestamp,
          metadata: data.metadata || {}
        });

    case 'nft_votes':
      return await supabase
        .from('nft_votes')
        .insert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          proposal_id: data.proposal_id,
          vote_choice: data.vote_choice,
          voting_power: data.voting_power,
          tx_hash: data.tx_hash,
          timestamp: data.timestamp,
          metadata: data.metadata || {}
        });

    default:
      throw new Error(`Unsupported table for INSERT: ${table}`);
  }
}

async function handleUpdate(table, data, where) {
  console.log(`🔄 Updating ${table}:`, data, 'where:', where);

  if (!where) {
    throw new Error('WHERE clause is required for UPDATE operations');
  }

  switch (table) {
    case 'nft_ownership':
      let ownershipQuery = supabase
        .from('nft_ownership')
        .update({
          user_address: data.user_address,
          previous_owner: data.previous_owner,
          tx_hash: data.tx_hash,
          block_number: data.block_number ? parseInt(data.block_number) : undefined,
          action_type: data.action_type,
          timestamp: data.timestamp,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        });

      if (where.nft_id) ownershipQuery = ownershipQuery.eq('nft_id', parseInt(where.nft_id));
      if (where.user_address) ownershipQuery = ownershipQuery.eq('user_address', where.user_address);
      if (where.contract_address) ownershipQuery = ownershipQuery.eq('contract_address', where.contract_address);

      return await ownershipQuery;

    case 'nft_stakes':
      let stakesQuery = supabase
        .from('nft_stakes')
        .update({
          is_active: data.is_active,
          end_timestamp: data.end_timestamp,
          rewards_earned: data.rewards_earned,
          unstake_tx_hash: data.unstake_tx_hash,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        });

      if (where.user_address) stakesQuery = stakesQuery.eq('user_address', where.user_address);
      if (where.nft_id) stakesQuery = stakesQuery.eq('nft_id', parseInt(where.nft_id));
      if (where.is_active !== undefined) stakesQuery = stakesQuery.eq('is_active', where.is_active);

      return await stakesQuery;

    case 'marketplace_listings':
      let listingsQuery = supabase
        .from('marketplace_listings')
        .update({
          is_active: data.is_active,
          buyer_address: data.buyer_address,
          sold_price: data.sold_price,
          sold_tx_hash: data.sold_tx_hash,
          sold_timestamp: data.sold_timestamp,
          canceled_tx_hash: data.canceled_tx_hash,
          canceled_timestamp: data.canceled_timestamp,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        });

      if (where.user_address) listingsQuery = listingsQuery.eq('user_address', where.user_address);
      if (where.nft_id) listingsQuery = listingsQuery.eq('nft_id', parseInt(where.nft_id));
      if (where.is_active !== undefined) listingsQuery = listingsQuery.eq('is_active', where.is_active);

      return await listingsQuery;

    default:
      throw new Error(`Unsupported table for UPDATE: ${table}`);
  }
}

async function handleUpsert(table, data) {
  console.log(`🔄 Upserting into ${table}:`, data);

  switch (table) {
    case 'nft_ownership':
      return await supabase
        .from('nft_ownership')
        .upsert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          contract_address: data.contract_address,
          previous_owner: data.previous_owner,
          tx_hash: data.tx_hash,
          block_number: parseInt(data.block_number),
          action_type: data.action_type,
          timestamp: data.timestamp,
          metadata: data.metadata || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'nft_id,contract_address'
        });

    case 'user_actions':
      return await supabase
        .from('user_actions')
        .upsert({
          user_address: data.user_address,
          nft_id: parseInt(data.nft_id),
          action_type: data.action_type,
          tx_hash: data.tx_hash,
          block_number: parseInt(data.block_number),
          amount: data.amount,
          metadata: data.metadata || {},
          timestamp: data.timestamp
        }, {
          onConflict: 'tx_hash'
        });

    default:
      throw new Error(`Unsupported table for UPSERT: ${table}`);
  }
}

// Helper function to validate transaction hash
function isValidTxHash(txHash) {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

// Helper function to validate Ethereum address
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Middleware for request validation
function validateRequest(req) {
  const { data } = req.body;
  
  if (data.tx_hash && !isValidTxHash(data.tx_hash)) {
    throw new Error('Invalid transaction hash format');
  }
  
  if (data.user_address && !isValidAddress(data.user_address)) {
    throw new Error('Invalid user address format');
  }
  
  if (data.contract_address && !isValidAddress(data.contract_address)) {
    throw new Error('Invalid contract address format');
  }
  
  return true;
}
