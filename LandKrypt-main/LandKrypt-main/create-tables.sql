-- LandKrypt Database Tables Creation Script
-- Run this script in your PostgreSQL/Supabase SQL editor

-- Create user_actions table
CREATE TABLE IF NOT EXISTS user_actions (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  nft_id INTEGER NOT NULL,
  action_type VARCHAR(20) NOT NULL,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  block_number BIGINT,
  amount DECIMAL(36,18),
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_stakes table
CREATE TABLE IF NOT EXISTS nft_stakes (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  nft_id INTEGER NOT NULL,
  staking_contract VARCHAR(42) NOT NULL,
  amount DECIMAL(36,18) NOT NULL,
  start_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_timestamp TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  tx_hash VARCHAR(66) NOT NULL,
  rewards_earned DECIMAL(36,18) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_votes table
CREATE TABLE IF NOT EXISTS nft_votes (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  nft_id INTEGER NOT NULL,
  proposal_id VARCHAR(100) NOT NULL,
  vote_choice BOOLEAN NOT NULL,
  voting_power DECIMAL(36,18) NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_address, nft_id, proposal_id)
);

-- Create nft_ownership table
CREATE TABLE IF NOT EXISTS nft_ownership (
  id BIGSERIAL PRIMARY KEY,
  nft_id INTEGER NOT NULL UNIQUE,
  staking_contract VARCHAR(42),
  is_owned_by_staking BOOLEAN DEFAULT FALSE,
  purchase_tx_hash VARCHAR(66),
  purchase_timestamp TIMESTAMP WITH TIME ZONE,
  has_proposal BOOLEAN DEFAULT FALSE,
  proposal_contract VARCHAR(42),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id BIGSERIAL PRIMARY KEY,
  nft_id INTEGER NOT NULL,
  proposal_contract VARCHAR(42),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  creator_address VARCHAR(42) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  voting_deadline TIMESTAMP WITH TIME ZONE,
  ownership_percentage DECIMAL(5,2),
  timeframe TEXT,
  total_votes DECIMAL(36,18) DEFAULT 0,
  yes_votes DECIMAL(36,18) DEFAULT 0,
  no_votes DECIMAL(36,18) DEFAULT 0,
  tx_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional tables from the schema

-- Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  business_license VARCHAR(255),
  years_experience INTEGER,
  specialization TEXT[],
  portfolio_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  verification_documents JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anthos_submissions table (needs to be created before property_verifications due to foreign key)
CREATE TABLE IF NOT EXISTS anthos_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  step_1_files JSONB,
  step_2_data JSONB,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'in_progress',
  submission_hash VARCHAR(66),
  ipfs_metadata_uri TEXT,
  verification_id BIGINT, -- Will be updated after property_verifications is created
  metadata JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_verifications table
CREATE TABLE IF NOT EXISTS property_verifications (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT REFERENCES anthos_submissions(id),
  property_title VARCHAR(500) NOT NULL,
  property_location VARCHAR(500) NOT NULL,
  property_size VARCHAR(100),
  estimated_value DECIMAL(18,2),
  property_description TEXT,
  owner_address VARCHAR(42) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_notes TEXT,
  verified_by VARCHAR(42),
  token_id INTEGER,
  nft_minted BOOLEAN DEFAULT FALSE,
  listed_on_marketplace BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  minted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to anthos_submissions after property_verifications is created
ALTER TABLE anthos_submissions 
ADD CONSTRAINT fk_verification_id 
FOREIGN KEY (verification_id) REFERENCES property_verifications(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_actions_user_address ON user_actions(user_address);
CREATE INDEX IF NOT EXISTS idx_user_actions_nft_id ON user_actions(nft_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_user_address ON nft_stakes(user_address);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_nft_id ON nft_stakes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_stakes_is_active ON nft_stakes(is_active);
CREATE INDEX IF NOT EXISTS idx_nft_votes_user_address ON nft_votes(user_address);
CREATE INDEX IF NOT EXISTS idx_nft_votes_nft_id ON nft_votes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_nft_id ON nft_ownership(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_staking_contract ON nft_ownership(staking_contract);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_is_owned_by_staking ON nft_ownership(is_owned_by_staking);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_has_proposal ON nft_ownership(has_proposal);
CREATE INDEX IF NOT EXISTS idx_proposals_nft_id ON proposals(nft_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_creator ON proposals(creator_address);

-- Create user_tier_progress table (Tier System)
CREATE TABLE IF NOT EXISTS user_tier_progress (
  id BIGSERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_tier INTEGER DEFAULT 1,
  tier_progress INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  last_daily_xp_claim TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_tier_range CHECK (current_tier >= 1 AND current_tier <= 5),
  CONSTRAINT check_xp_positive CHECK (total_xp >= 0),
  CONSTRAINT check_tier_progress_positive CHECK (tier_progress >= 0)
);

-- Create indexes for tier system
CREATE INDEX IF NOT EXISTS idx_user_tier_progress_wallet ON user_tier_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_tier_progress_tier ON user_tier_progress(current_tier);
CREATE INDEX IF NOT EXISTS idx_user_tier_progress_xp ON user_tier_progress(total_xp);

-- Land Document Verification Tables
CREATE TABLE IF NOT EXISTS land_document_verifications (
  id BIGSERIAL PRIMARY KEY,
  document_hash VARCHAR(66) UNIQUE NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  location TEXT NOT NULL,
  size VARCHAR(100) NOT NULL,
  land_type VARCHAR(50) NOT NULL,
  verification_status BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(42) NOT NULL,
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Land NFTs Table
CREATE TABLE IF NOT EXISTS land_nfts (
  id BIGSERIAL PRIMARY KEY,
  token_id INTEGER UNIQUE NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  document_hash VARCHAR(66) NOT NULL,
  location TEXT NOT NULL,
  size VARCHAR(100) NOT NULL,
  land_type VARCHAR(50) NOT NULL,
  image_url TEXT,
  metadata_uri TEXT,
  tx_hash VARCHAR(66) NOT NULL,
  minted_by VARCHAR(42) NOT NULL,
  mint_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_listed BOOLEAN DEFAULT FALSE,
  listing_price DECIMAL(36,18),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Usage Tracking Table
CREATE TABLE IF NOT EXISTS nft_image_usage (
  id BIGSERIAL PRIMARY KEY,
  image_filename VARCHAR(255) UNIQUE NOT NULL,
  token_id INTEGER,
  used_by VARCHAR(42),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ipfs_hash VARCHAR(100),
  image_url TEXT
);

-- Create indexes for land verification system
CREATE INDEX IF NOT EXISTS idx_land_verifications_owner ON land_document_verifications(owner_address);
CREATE INDEX IF NOT EXISTS idx_land_verifications_status ON land_document_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_land_verifications_verified_by ON land_document_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_land_nfts_owner ON land_nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_land_nfts_token ON land_nfts(token_id);
CREATE INDEX IF NOT EXISTS idx_land_nfts_listed ON land_nfts(is_listed);
CREATE INDEX IF NOT EXISTS idx_image_usage_filename ON nft_image_usage(image_filename);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'LandKrypt database tables created successfully!';
    RAISE NOTICE 'Tables created: user_actions, nft_stakes, nft_votes, nft_ownership, proposals, developers, property_verifications, anthos_submissions, user_tier_progress, land_document_verifications, land_nfts, nft_image_usage';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Tier system ready with XP tracking!';
    RAISE NOTICE 'Land verification system ready!';
END $$;
