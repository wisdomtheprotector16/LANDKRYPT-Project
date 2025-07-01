// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}
if (!supabaseServiceKey) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will not work');
}

// Client for server-side operations (admin)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USER_ACTIONS: 'user_actions',
  NFT_STAKES: 'nft_stakes',
  NFT_VOTES: 'nft_votes',
  NFT_OWNERSHIP: 'nft_ownership',
  PROPOSALS: 'proposals',
  USERS: 'users',
  NFTS: 'nfts',
  MARKETPLACE_LISTINGS: 'marketplace_listings',
  DEVELOPERS: 'developers',
  PROPERTY_VERIFICATIONS: 'property_verifications',
  ANTHOS_SUBMISSIONS: 'anthos_submissions',
  USER_TIER_PROGRESS: 'user_tier_progress'
};

// Action types
export const ACTION_TYPES = {
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  VOTE: 'vote',
  PURCHASE: 'purchase',
  LIST: 'list',
  APPROVE: 'approve',
  NFT_PURCHASE: 'nft_purchase',
  PROPOSAL_CREATE: 'proposal_create'
};

// Database utility functions
export class DatabaseService {
  constructor(isAdmin = false) {
    this.client = isAdmin ? supabaseAdmin : supabase;
  }

  // Initialize tier system table if needed
  async initializeTierSystem() {
    try {
      // Just check if the table exists and can be queried
      const { error } = await this.client
        .from(TABLES.USER_TIER_PROGRESS)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('Tier system table not accessible, will be created manually');
      }
      
      return true;
    } catch (error) {
      console.warn('Tier system initialization warning:', error.message);
      return false;
    }
  }

  // Record user action (stake, vote, etc.)
  async recordUserAction({
    userAddress,
    nftId,
    actionType,
    txHash,
    blockNumber = null,
    amount = null,
    metadata = {}
  }) {
    const { data, error } = await this.client
      .from(TABLES.USER_ACTIONS)
      .insert([{
        user_address: userAddress,
        nft_id: nftId,
        action_type: actionType,
        tx_hash: txHash,
        block_number: blockNumber,
        amount: amount,
        metadata: metadata
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Record NFT stake
  async recordStake({
    userAddress,
    nftId,
    stakingContract,
    amount,
    txHash,
    metadata = {}
  }) {
    // First record the user action
    await this.recordUserAction({
      userAddress,
      nftId,
      actionType: ACTION_TYPES.STAKE,
      txHash,
      amount,
      metadata
    });

    // Then record the specific stake details
    const { data, error } = await this.client
      .from(TABLES.NFT_STAKES)
      .insert([{
        user_address: userAddress,
        nft_id: nftId,
        staking_contract: stakingContract,
        amount: amount,
        tx_hash: txHash,
        metadata: metadata
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Record NFT vote
  async recordVote({
    userAddress,
    nftId,
    proposalId,
    voteChoice,
    votingPower,
    txHash,
    metadata = {}
  }) {
    // First record the user action
    await this.recordUserAction({
      userAddress,
      nftId,
      actionType: ACTION_TYPES.VOTE,
      txHash,
      amount: votingPower,
      metadata: { proposalId, voteChoice, ...metadata }
    });

    // Then record the specific vote details
    const { data, error } = await this.client
      .from(TABLES.NFT_VOTES)
      .upsert([{
        user_address: userAddress,
        nft_id: nftId,
        proposal_id: proposalId,
        vote_choice: voteChoice,
        voting_power: votingPower,
        tx_hash: txHash,
        metadata: metadata
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Get user's actions for a specific NFT
  async getUserNftActions(userAddress, nftId) {
    const { data, error } = await this.client
      .from(TABLES.USER_ACTIONS)
      .select('*')
      .eq('user_address', userAddress)
      .eq('nft_id', nftId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get user's active stakes
  async getUserActiveStakes(userAddress) {
    const { data, error } = await this.client
      .from(TABLES.NFT_STAKES)
      .select('*')
      .eq('user_address', userAddress)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get user's stakes for a specific NFT
  async getUserNftStakes(userAddress, nftId) {
    const { data, error } = await this.client
      .from(TABLES.NFT_STAKES)
      .select('*')
      .eq('user_address', userAddress)
      .eq('nft_id', nftId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get user's votes for a specific NFT
  async getUserNftVotes(userAddress, nftId) {
    const { data, error } = await this.client
      .from(TABLES.NFT_VOTES)
      .select('*')
      .eq('user_address', userAddress)
      .eq('nft_id', nftId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get all actions for a specific NFT (for analytics)
  async getNftActions(nftId, limit = 100) {
    const { data, error } = await this.client
      .from(TABLES.USER_ACTIONS)
      .select('*')
      .eq('nft_id', nftId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Get NFT staking statistics
  async getNftStakingStats(nftId) {
    const { data: stakes, error: stakesError } = await this.client
      .from(TABLES.NFT_STAKES)
      .select('amount, is_active')
      .eq('nft_id', nftId);

    if (stakesError) throw stakesError;

    const totalStaked = stakes
      .filter(stake => stake.is_active)
      .reduce((sum, stake) => sum + parseFloat(stake.amount), 0);

    const totalStakers = stakes
      .filter(stake => stake.is_active)
      .length;

    return {
      totalStaked,
      totalStakers,
      allTimeStaked: stakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0)
    };
  }

  // End stake (when user unstakes)
  async endStake(userAddress, nftId, txHash) {
    // Record unstake action
    await this.recordUserAction({
      userAddress,
      nftId,
      actionType: ACTION_TYPES.UNSTAKE,
      txHash
    });

    // Update stake record
    const { data, error } = await this.client
      .from(TABLES.NFT_STAKES)
      .update({
        is_active: false,
        end_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_address', userAddress)
      .eq('nft_id', nftId)
      .eq('is_active', true)
      .select();

    if (error) throw error;
    return data;
  }

  // Record NFT purchase by staking contract
  async recordNftPurchase({
    nftId,
    stakingContract,
    txHash,
    metadata = {}
  }) {
    // Record the purchase action
    await this.recordUserAction({
      userAddress: stakingContract, // Staking contract as "user"
      nftId,
      actionType: ACTION_TYPES.NFT_PURCHASE,
      txHash,
      metadata
    });

    // Update or create NFT ownership record
    const { data, error } = await this.client
      .from(TABLES.NFT_OWNERSHIP)
      .upsert([{
        nft_id: nftId,
        staking_contract: stakingContract,
        is_owned_by_staking: true,
        purchase_tx_hash: txHash,
        purchase_timestamp: new Date().toISOString(),
        metadata: metadata,
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Create a new proposal for an NFT
  async createProposal({
    nftId,
    title,
    description,
    creatorAddress,
    ownershipPercentage,
    timeframe,
    votingDeadline,
    proposalContract = null,
    txHash,
    nftImageUri = null,
    nftTitle = null,
    nftLocation = null,
    stakingContract = null,
    metadata = {}
  }) {
    // Enhanced metadata with NFT details
    const enhancedMetadata = {
      title,
      ownershipPercentage,
      nftImageUri,
      nftTitle,
      nftLocation,
      stakingContract,
      createdVia: 'dao-interface',
      formData: {
        title,
        description,
        ownershipPercentage,
        timeframe,
        votingDeadline
      },
      ...metadata
    };

    // Record the proposal creation action
    await this.recordUserAction({
      userAddress: creatorAddress,
      nftId,
      actionType: ACTION_TYPES.PROPOSAL_CREATE,
      txHash,
      metadata: enhancedMetadata
    });

    // Create the proposal record with enhanced data
    const { data, error } = await this.client
      .from(TABLES.PROPOSALS)
      .insert([{
        nft_id: nftId,
        proposal_contract: proposalContract,
        title: title,
        description: description,
        creator_address: creatorAddress,
        ownership_percentage: ownershipPercentage,
        timeframe: timeframe,
        voting_deadline: votingDeadline,
        tx_hash: txHash,
        metadata: enhancedMetadata
      }])
      .select();

    if (error) throw error;

    // Update NFT ownership to mark as having a proposal
    await this.client
      .from(TABLES.NFT_OWNERSHIP)
      .update({
        has_proposal: true,
        proposal_contract: proposalContract,
        updated_at: new Date().toISOString()
      })
      .eq('nft_id', nftId);

    return data[0];
  }

  // Get NFTs owned by staking contracts without proposals
  async getNftsReadyForProposals() {
    const { data, error } = await this.client
      .from(TABLES.NFT_OWNERSHIP)
      .select('*')
      .eq('is_owned_by_staking', true)
      .eq('has_proposal', false)
      .order('purchase_timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get all proposals for an NFT
  async getNftProposals(nftId) {
    const { data, error } = await this.client
      .from(TABLES.PROPOSALS)
      .select('*')
      .eq('nft_id', nftId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get all active proposals
  async getActiveProposals() {
    const { data, error } = await this.client
      .from(TABLES.PROPOSALS)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get all proposals (with optional status filter)
  async getAllProposals(status = null) {
    let query = this.client
      .from(TABLES.PROPOSALS)
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Update proposal status
  async updateProposalStatus(proposalId, status, metadata = {}) {
    const { data, error } = await this.client
      .from(TABLES.PROPOSALS)
      .update({
        status: status,
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Update proposal vote counts
  async updateProposalVotes(proposalId, yesVotes, noVotes, totalVotes) {
    const { data, error } = await this.client
      .from(TABLES.PROPOSALS)
      .update({
        yes_votes: yesVotes,
        no_votes: noVotes,
        total_votes: totalVotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Get NFT ownership details
  async getNftOwnership(nftId) {
    const { data, error } = await this.client
      .from(TABLES.NFT_OWNERSHIP)
      .select('*')
      .eq('nft_id', nftId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  }

  // Delete all proposals for an NFT when development contract is minted
  async deleteNftProposals(nftId, developmentContract, txHash) {
    // First get all proposals for this NFT for logging
    const { data: proposalsToDelete, error: fetchError } = await this.client
      .from(TABLES.PROPOSALS)
      .select('*')
      .eq('nft_id', nftId);

    if (fetchError) throw fetchError;

    // Record the development contract minting action
    await this.recordUserAction({
      userAddress: developmentContract,
      nftId,
      actionType: 'development_contract_mint',
      txHash,
      metadata: {
        developmentContract,
        deletedProposals: proposalsToDelete,
        proposalCount: proposalsToDelete.length,
        reason: 'Development contract minted - proposals no longer needed',
        timestamp: new Date().toISOString()
      }
    });

    // Delete all proposals for this NFT
    const { error: deleteError } = await this.client
      .from(TABLES.PROPOSALS)
      .delete()
      .eq('nft_id', nftId);

    if (deleteError) throw deleteError;

    // Update NFT ownership to reflect development contract
    const { data, error: updateError } = await this.client
      .from(TABLES.NFT_OWNERSHIP)
      .update({
        has_proposal: false,
        proposal_contract: null,
        metadata: {
          developmentContract,
          developmentContractMinted: true,
          mintTimestamp: new Date().toISOString(),
          proposalsDeleted: proposalsToDelete.length
        },
        updated_at: new Date().toISOString()
      })
      .eq('nft_id', nftId)
      .select();

    if (updateError) throw updateError;

    return {
      deletedProposals: proposalsToDelete,
      deletedCount: proposalsToDelete.length,
      updatedOwnership: data[0]
    };
  }

  // Record development contract minting
  async recordDevelopmentContractMint({
    nftId,
    developmentContract,
    txHash,
    metadata = {}
  }) {
    // Delete proposals and update ownership
    const result = await this.deleteNftProposals(nftId, developmentContract, txHash);

    return {
      message: 'Development contract minted successfully',
      nftId,
      developmentContract,
      deletedProposalsCount: result.deletedCount,
      txHash,
      ...result
    };
  }
}

export default DatabaseService;
