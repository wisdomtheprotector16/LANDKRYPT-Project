-- LandKrypt Database Upgrades for Enhanced Contracts
-- Run this script to add support for upgraded contract features

-- =====================================================
-- 1. ENHANCED NFT FEATURES
-- =====================================================

-- Add columns for gas-optimized NFT features
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS property_data JSONB;
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS royalty_info JSONB;
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS batch_mint_id VARCHAR(66);
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS rarity_score INTEGER DEFAULT 1;
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS property_type INTEGER DEFAULT 1;
ALTER TABLE nft_ownership ADD COLUMN IF NOT EXISTS location_id INTEGER DEFAULT 1;

-- Create batch operations tracking table
CREATE TABLE IF NOT EXISTS batch_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL, -- 'batch_mint', 'batch_transfer', 'batch_approve'
  batch_id VARCHAR(66) UNIQUE NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  nft_contract VARCHAR(42) NOT NULL,
  token_ids INTEGER[] NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  gas_used BIGINT,
  gas_saved_percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. ENHANCED MARKETPLACE FEATURES
-- =====================================================

-- Create marketplace listings table for enhanced features
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id BIGSERIAL PRIMARY KEY,
  listing_id INTEGER UNIQUE NOT NULL,
  nft_contract VARCHAR(42) NOT NULL,
  token_id INTEGER NOT NULL,
  seller_address VARCHAR(42) NOT NULL,
  listing_type VARCHAR(20) NOT NULL, -- 'fixed_price', 'dutch_auction', 'english_auction'
  price DECIMAL(36,18) NOT NULL,
  currency_address VARCHAR(42) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'cancelled', 'expired'
  buyer_address VARCHAR(42),
  final_price DECIMAL(36,18),
  platform_fee DECIMAL(36,18),
  royalty_fee DECIMAL(36,18),
  tier_discount DECIMAL(5,2) DEFAULT 0,
  tx_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auction-specific data table
CREATE TABLE IF NOT EXISTS auction_data (
  id BIGSERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(listing_id),
  auction_type VARCHAR(20) NOT NULL, -- 'dutch', 'english'
  start_price DECIMAL(36,18) NOT NULL,
  end_price DECIMAL(36,18), -- For Dutch auctions
  reserve_price DECIMAL(36,18), -- For English auctions
  current_bid DECIMAL(36,18),
  highest_bidder VARCHAR(42),
  bid_count INTEGER DEFAULT 0,
  price_reduction_rate DECIMAL(18,8), -- For Dutch auctions
  extension_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offers table
CREATE TABLE IF NOT EXISTS marketplace_offers (
  id BIGSERIAL PRIMARY KEY,
  nft_contract VARCHAR(42) NOT NULL,
  token_id INTEGER NOT NULL,
  offerer_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  currency_address VARCHAR(42) NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'accepted', 'cancelled', 'expired'
  accepted_by VARCHAR(42),
  tx_hash VARCHAR(66),
  escrow_tx_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nft_contract, token_id, offerer_address, created_at)
);

-- =====================================================
-- 3. ADVANCED STAKING FEATURES
-- =====================================================

-- Enhance existing nft_stakes table
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS pool_id INTEGER DEFAULT 0;
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS staking_type VARCHAR(20) DEFAULT 'token'; -- 'token', 'nft', 'lp'
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS lock_period INTEGER DEFAULT 0; -- in seconds
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS lock_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS tier_multiplier DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS booster_active BOOLEAN DEFAULT FALSE;
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS booster_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE nft_stakes ADD COLUMN IF NOT EXISTS booster_multiplier DECIMAL(5,2) DEFAULT 1.0;

-- Create staking pools table
CREATE TABLE IF NOT EXISTS staking_pools (
  id BIGSERIAL PRIMARY KEY,
  pool_id INTEGER UNIQUE NOT NULL,
  pool_name VARCHAR(100) NOT NULL,
  staking_token VARCHAR(42) NOT NULL,
  reward_token VARCHAR(42) NOT NULL,
  allocation_points INTEGER NOT NULL,
  total_staked DECIMAL(36,18) DEFAULT 0,
  min_stake_amount DECIMAL(36,18) NOT NULL,
  lock_period INTEGER DEFAULT 0, -- in seconds
  apy_rate DECIMAL(8,4), -- Annual percentage yield
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NFT staking pools table
CREATE TABLE IF NOT EXISTS nft_staking_pools (
  id BIGSERIAL PRIMARY KEY,
  pool_id INTEGER UNIQUE NOT NULL,
  nft_contract VARCHAR(42) NOT NULL,
  base_reward_rate DECIMAL(36,18) NOT NULL,
  total_nfts_staked INTEGER DEFAULT 0,
  rarity_multipliers JSONB, -- JSON object with rarity -> multiplier mapping
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boosters table
CREATE TABLE IF NOT EXISTS staking_boosters (
  id BIGSERIAL PRIMARY KEY,
  booster_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  multiplier DECIMAL(5,2) NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  cost DECIMAL(36,18) NOT NULL,
  cost_token VARCHAR(42) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user booster activations table
CREATE TABLE IF NOT EXISTS user_boosters (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  pool_id INTEGER NOT NULL,
  booster_id INTEGER REFERENCES staking_boosters(booster_id),
  activation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 4. QUADRATIC GOVERNANCE FEATURES
-- =====================================================

-- Enhance existing proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_type VARCHAR(20) DEFAULT 'standard';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS voting_power_snapshot JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS quadratic_votes DECIMAL(36,18) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS execution_eta TIMESTAMP WITH TIME ZONE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS execution_tx_hash VARCHAR(66);

-- Create governance votes table (enhanced from nft_votes)
CREATE TABLE IF NOT EXISTS governance_votes (
  id BIGSERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id),
  voter_address VARCHAR(42) NOT NULL,
  vote_choice INTEGER NOT NULL, -- 0: Against, 1: For, 2: Abstain
  voting_power DECIMAL(36,18) NOT NULL,
  quadratic_weight DECIMAL(36,18) NOT NULL,
  token_balance DECIMAL(36,18) DEFAULT 0,
  nft_count INTEGER DEFAULT 0,
  staked_amount DECIMAL(36,18) DEFAULT 0,
  delegated_power DECIMAL(36,18) DEFAULT 0,
  tier_multiplier DECIMAL(5,2) DEFAULT 1.0,
  tx_hash VARCHAR(66) NOT NULL,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(proposal_id, voter_address)
);

-- Create vote delegation table
CREATE TABLE IF NOT EXISTS vote_delegations (
  id BIGSERIAL PRIMARY KEY,
  delegator_address VARCHAR(42) NOT NULL,
  delegate_address VARCHAR(42) NOT NULL,
  delegation_power DECIMAL(36,18) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  tx_hash VARCHAR(66) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(delegator_address, delegate_address)
);

-- =====================================================
-- 5. ENHANCED TIER SYSTEM
-- =====================================================

-- Enhance user_tier_progress table
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS nfts_owned INTEGER DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS total_staked DECIMAL(36,18) DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS marketplace_transactions INTEGER DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS governance_participation INTEGER DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS consecutive_days INTEGER DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS milestone_badges JSONB DEFAULT '[]';
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS tier_benefits JSONB;
ALTER TABLE user_tier_progress ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create XP activities tracking table
CREATE TABLE IF NOT EXISTS xp_activities (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  xp_earned INTEGER NOT NULL,
  tier_multiplier DECIMAL(5,2) DEFAULT 1.0,
  description TEXT,
  tx_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tier milestones table
CREATE TABLE IF NOT EXISTS tier_milestones (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  milestone_key VARCHAR(50) NOT NULL,
  milestone_name VARCHAR(100) NOT NULL,
  xp_reward INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_hash VARCHAR(66),
  UNIQUE(user_address, milestone_key)
);

-- =====================================================
-- 6. ACCESS CONTROL & SECURITY
-- =====================================================

-- Create role assignments table
CREATE TABLE IF NOT EXISTS role_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  granted_by VARCHAR(42) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  tx_hash VARCHAR(66) NOT NULL,
  UNIQUE(user_address, role_name, contract_address)
);

-- Create emergency events table
CREATE TABLE IF NOT EXISTS emergency_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'pause', 'unpause', 'emergency_mode'
  contract_address VARCHAR(42) NOT NULL,
  triggered_by VARCHAR(42) NOT NULL,
  reason TEXT,
  tx_hash VARCHAR(66) NOT NULL,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(42),
  resolution_tx_hash VARCHAR(66)
);

-- =====================================================
-- 7. ANALYTICS & REPORTING
-- =====================================================

-- Create gas usage analytics table
CREATE TABLE IF NOT EXISTS gas_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  gas_used BIGINT NOT NULL,
  gas_price BIGINT NOT NULL,
  gas_cost_eth DECIMAL(36,18) NOT NULL,
  gas_saved BIGINT DEFAULT 0,
  savings_percentage DECIMAL(5,2) DEFAULT 0,
  tx_hash VARCHAR(66) NOT NULL,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(36,18) NOT NULL,
  metric_unit VARCHAR(20),
  contract_address VARCHAR(42),
  user_address VARCHAR(42),
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Batch operations indexes
CREATE INDEX IF NOT EXISTS idx_batch_operations_user ON batch_operations(user_address);
CREATE INDEX IF NOT EXISTS idx_batch_operations_type ON batch_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_nft ON marketplace_listings(nft_contract, token_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_nft ON marketplace_offers(nft_contract, token_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_offerer ON marketplace_offers(offerer_address);

-- Staking indexes
CREATE INDEX IF NOT EXISTS idx_staking_pools_active ON staking_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_staking_pools_active ON nft_staking_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_user_boosters_user ON user_boosters(user_address);
CREATE INDEX IF NOT EXISTS idx_user_boosters_active ON user_boosters(is_active);

-- Governance indexes
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_voter ON governance_votes(voter_address);
CREATE INDEX IF NOT EXISTS idx_vote_delegations_delegator ON vote_delegations(delegator_address);
CREATE INDEX IF NOT EXISTS idx_vote_delegations_delegate ON vote_delegations(delegate_address);

-- Tier system indexes
CREATE INDEX IF NOT EXISTS idx_xp_activities_user ON xp_activities(user_address);
CREATE INDEX IF NOT EXISTS idx_xp_activities_type ON xp_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_tier_milestones_user ON tier_milestones(user_address);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON role_assignments(user_address);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON role_assignments(role_name);
CREATE INDEX IF NOT EXISTS idx_emergency_events_contract ON emergency_events(contract_address);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_gas_analytics_user ON gas_analytics(user_address);
CREATE INDEX IF NOT EXISTS idx_gas_analytics_operation ON gas_analytics(operation_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

-- =====================================================
-- 9. VIEWS FOR EASY QUERYING
-- =====================================================

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard_view AS
SELECT 
  utp.wallet_address,
  utp.total_xp,
  utp.current_tier,
  utp.nfts_owned,
  utp.total_staked,
  utp.marketplace_transactions,
  utp.governance_participation,
  COUNT(DISTINCT ns.id) as active_stakes,
  COUNT(DISTINCT ml.id) as active_listings,
  COUNT(DISTINCT mo.id) as active_offers,
  COALESCE(SUM(ns.rewards_earned), 0) as total_rewards_earned
FROM user_tier_progress utp
LEFT JOIN nft_stakes ns ON utp.wallet_address = ns.user_address AND ns.is_active = true
LEFT JOIN marketplace_listings ml ON utp.wallet_address = ml.seller_address AND ml.status = 'active'
LEFT JOIN marketplace_offers mo ON utp.wallet_address = mo.offerer_address AND mo.status = 'active'
GROUP BY utp.wallet_address, utp.total_xp, utp.current_tier, utp.nfts_owned, 
         utp.total_staked, utp.marketplace_transactions, utp.governance_participation;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'LandKrypt database upgrades completed successfully!';
    RAISE NOTICE 'Enhanced features added:';
    RAISE NOTICE '- Gas-optimized NFT tracking';
    RAISE NOTICE '- Advanced marketplace with auctions and offers';
    RAISE NOTICE '- Multi-asset staking with boosters';
    RAISE NOTICE '- Quadratic governance system';
    RAISE NOTICE '- Enhanced tier system with detailed tracking';
    RAISE NOTICE '- Comprehensive analytics and security features';
    RAISE NOTICE 'All indexes and views created for optimal performance!';
END $$;
