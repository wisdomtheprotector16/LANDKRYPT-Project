-- Schema for LandKrypt Database

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE,
    documents JSONB -- Stores user-uploaded documents metadata
);

CREATE TABLE nfts (
    id SERIAL PRIMARY KEY,
    token_id INT,
    owner_address VARCHAR(42),
    has_proposal BOOLEAN DEFAULT FALSE,
    market_listed BOOLEAN DEFAULT FALSE,
    metadata JSONB -- Include attributes like name, description, and images
);

CREATE TABLE user_actions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42),
    action_type VARCHAR(20), -- 'stake', 'vote', 'swap', etc.
    tx_hash VARCHAR(66) UNIQUE,
    timestamp TIMESTAMP DEFAULT NOW()
);

