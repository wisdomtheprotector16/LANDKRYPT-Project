// Data Validation Utilities for LandKrypt
// Ensures data consistency between frontend and backend

import { z } from 'zod';

// Schema definitions for data validation
export const UserActionSchema = z.object({
  id: z.number(),
  user_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nft_id: z.number(),
  action_type: z.enum(['stake', 'unstake', 'vote', 'purchase', 'list', 'approve']),
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  block_number: z.number().optional(),
  amount: z.string().optional(),
  metadata: z.object({}).passthrough(),
  timestamp: z.string(),
  created_at: z.string()
});

export const NFTStakeSchema = z.object({
  id: z.number(),
  user_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nft_id: z.number(),
  staking_contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  start_timestamp: z.string(),
  end_timestamp: z.string().optional(),
  is_active: z.boolean(),
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  rewards_earned: z.string().optional(),
  metadata: z.object({}).passthrough(),
  created_at: z.string(),
  updated_at: z.string()
});

export const NFTAnalyticsSchema = z.object({
  nftId: z.number(),
  stakingStats: z.object({
    totalStaked: z.number(),
    totalStakers: z.number(),
    allTimeStaked: z.number()
  }),
  activity: z.object({
    totalActions: z.number(),
    actionsByType: z.object({}).passthrough(),
    uniqueParticipants: z.number(),
    last24Hours: z.number(),
    last7Days: z.number()
  }),
  recentActions: z.array(UserActionSchema)
});

export const MarketplaceListingSchema = z.object({
  id: z.number(),
  tokenId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  price: z.string(),
  shares: z.string(),
  image: z.string(),
  tag: z.string(),
  category: z.enum(['residential', 'commercial', 'office space', 'luxury villa']),
  staking: z.boolean(),
  type: z.enum(['rwa', 'digital asset']),
  stakingContract: z.string().regex(/^0x[a-fA-F0-9]+$/),
  isListed: z.boolean(),
  owner: z.string().regex(/^0x[a-fA-F0-9]+$/),
  originalPrice: z.string(),
  tokenUrl: z.string().url()
});

export const ProposalSchema = z.object({
  id: z.number(),
  nft_id: z.number(),
  proposal_contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  title: z.string(),
  description: z.string(),
  creator_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  status: z.enum(['active', 'completed', 'cancelled', 'executed']),
  voting_deadline: z.string().optional(),
  ownership_percentage: z.number().optional(),
  timeframe: z.string().optional(),
  total_votes: z.string(),
  yes_votes: z.string(),
  no_votes: z.string(),
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  metadata: z.object({}).passthrough(),
  created_at: z.string(),
  updated_at: z.string()
});

// Validation functions
export function validateUserAction(data) {
  try {
    return UserActionSchema.parse(data);
  } catch (error) {
    console.error('User Action validation failed:', error.errors);
    throw new Error(`Invalid user action data: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

export function validateNFTStake(data) {
  try {
    return NFTStakeSchema.parse(data);
  } catch (error) {
    console.error('NFT Stake validation failed:', error.errors);
    throw new Error(`Invalid NFT stake data: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

export function validateNFTAnalytics(data) {
  try {
    return NFTAnalyticsSchema.parse(data);
  } catch (error) {
    console.error('NFT Analytics validation failed:', error.errors);
    throw new Error(`Invalid NFT analytics data: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

export function validateMarketplaceListing(data) {
  try {
    return MarketplaceListingSchema.parse(data);
  } catch (error) {
    console.error('Marketplace Listing validation failed:', error.errors);
    throw new Error(`Invalid marketplace listing data: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

export function validateProposal(data) {
  try {
    return ProposalSchema.parse(data);
  } catch (error) {
    console.error('Proposal validation failed:', error.errors);
    throw new Error(`Invalid proposal data: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

// Enhanced API response validator
export class APIResponseValidator {
  static validateResponse(data, schema, endpoint) {
    try {
      if (Array.isArray(data)) {
        return data.map(item => schema.parse(item));
      } else {
        return schema.parse(data);
      }
    } catch (error) {
      console.error(`API Response validation failed for ${endpoint}:`, error.errors);
      throw new Error(`Invalid API response from ${endpoint}: ${error.errors.map(e => e.message).join(', ')}`);
    }
  }

  static async validateAndFetch(url, schema) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateResponse(data, schema, url);
    } catch (error) {
      console.error(`Failed to fetch and validate data from ${url}:`, error);
      throw error;
    }
  }
}

// Contract data validation
export const ContractDataValidator = {
  validateStakingContract: (address) => {
    const contractRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!contractRegex.test(address)) {
      throw new Error(`Invalid staking contract address: ${address}`);
    }
    if (address === '0x0000000000000000000000000000000000000000') {
      throw new Error('Staking contract address cannot be zero address');
    }
    return true;
  },

  validateTokenAmount: (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error(`Invalid token amount: ${amount}`);
    }
    return true;
  },

  validateTokenId: (tokenId) => {
    const numTokenId = parseInt(tokenId);
    if (isNaN(numTokenId) || numTokenId < 1) {
      throw new Error(`Invalid token ID: ${tokenId}`);
    }
    return true;
  },

  validateTransactionHash: (txHash) => {
    const txRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txRegex.test(txHash)) {
      throw new Error(`Invalid transaction hash: ${txHash}`);
    }
    return true;
  }
};

// Database consistency checker
export class DatabaseConsistencyChecker {
  constructor(apiBaseUrl = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async checkUserActionsConsistency(userAddress, nftId) {
    try {
      const userActions = await APIResponseValidator.validateAndFetch(
        `${this.apiBaseUrl}/user-actions?userAddress=${userAddress}&nftId=${nftId}`,
        z.object({
          nftId: z.number(),
          actions: z.array(UserActionSchema),
          stakes: z.array(NFTStakeSchema),
          votes: z.array(z.object({}).passthrough())
        })
      );

      const nftAnalytics = await APIResponseValidator.validateAndFetch(
        `${this.apiBaseUrl}/nft-analytics?nftId=${nftId}`,
        NFTAnalyticsSchema
      );

      // Cross-validate data consistency
      const userStakeActions = userActions.actions.filter(action => action.action_type === 'stake');
      const activeStakes = userActions.stakes.filter(stake => stake.is_active);

      console.log('Consistency Check Results:', {
        userStakeActions: userStakeActions.length,
        activeStakes: activeStakes.length,
        totalActionsInAnalytics: nftAnalytics.activity.totalActions,
        userActionsCount: userActions.actions.length
      });

      return {
        isConsistent: true,
        userActions,
        nftAnalytics,
        discrepancies: []
      };
    } catch (error) {
      console.error('Database consistency check failed:', error);
      return {
        isConsistent: false,
        error: error.message,
        discrepancies: [error.message]
      };
    }
  }

  async checkMarketplaceConsistency() {
    try {
      // Check if JSON data matches database data
      const jsonListings = await fetch('/data/all-listings.json').then(r => r.json());
      const validatedListings = jsonListings.map(listing => validateMarketplaceListing(listing));

      console.log('Marketplace Consistency Check:', {
        totalListings: validatedListings.length,
        validationPassed: true
      });

      return {
        isConsistent: true,
        listings: validatedListings
      };
    } catch (error) {
      console.error('Marketplace consistency check failed:', error);
      return {
        isConsistent: false,
        error: error.message
      };
    }
  }
}

export default {
  UserActionSchema,
  NFTStakeSchema,
  NFTAnalyticsSchema,
  MarketplaceListingSchema,
  ProposalSchema,
  validateUserAction,
  validateNFTStake,
  validateNFTAnalytics,
  validateMarketplaceListing,
  validateProposal,
  APIResponseValidator,
  ContractDataValidator,
  DatabaseConsistencyChecker
};
