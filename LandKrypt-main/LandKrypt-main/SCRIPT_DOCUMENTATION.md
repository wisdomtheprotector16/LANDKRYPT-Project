# LandKrypt Script Documentation

This document provides comprehensive documentation for all scripts in the LandKrypt project, covering their purpose, inputs/outputs, dependencies, and usage patterns.

## Table of Contents

1. [Smart Contract Deployment Scripts](#smart-contract-deployment-scripts)
2. [NFT Minting and Metadata Scripts](#nft-minting-and-metadata-scripts)
3. [Staking System Scripts](#staking-system-scripts)
4. [Database Integration Scripts](#database-integration-scripts)
5. [Marketplace Data Management](#marketplace-data-management)
6. [Frontend Hooks and Utilities](#frontend-hooks-and-utilities)
7. [Environment Setup](#environment-setup)
8. [Recommended Workflow](#recommended-workflow)

## Smart Contract Deployment Scripts

### `deploy-contracts.js`
**Purpose**: Deploys all smart contracts (NFT contract, token contracts, staking contracts, marketplace) to the blockchain network.

**Inputs**:
- Environment variables for network configuration (RPC URLs, private keys)
- Contract compilation artifacts

**Outputs**:
- Deployed contract addresses
- Contract ABIs for frontend integration
- Transaction hashes for verification

**Usage**:
```bash
# Deploy to localhost/hardhat
npx hardhat run deploy-contracts.js --network localhost

# Deploy to testnet (e.g., Sepolia)
npx hardhat run deploy-contracts.js --network sepolia

# Deploy to mainnet
npx hardhat run deploy-contracts.js --network mainnet
```

**Environment Requirements**:
- `PRIVATE_KEY`: Deployer wallet private key
- `RPC_URL`: Blockchain network RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification (optional)

---

## NFT Minting and Metadata Scripts

### `generate-nft-metadata.js`
**Purpose**: Generates metadata files for NFTs including property details, images, and attributes.

**Inputs**:
- Property data (location, images, descriptions)
- IPFS configuration for image storage

**Outputs**:
- JSON metadata files compatible with OpenSea standard
- IPFS hashes for images and metadata

**Key Features**:
- Batch processing of multiple properties
- Automatic image upload to IPFS
- Metadata validation
- OpenSea-compatible attribute formatting

**Usage**:
```bash
node generate-nft-metadata.js
```

### `mint-nfts.js`
**Purpose**: Mints NFTs using the deployed NFT contract and generated metadata.

**Inputs**:
- NFT contract address
- Metadata IPFS hashes
- Recipient addresses

**Outputs**:
- Token IDs for minted NFTs
- Transaction hashes
- Gas usage reports

**Usage**:
```bash
node mint-nfts.js --contract 0x123... --count 10 --to 0xabc...
```

---

## Staking System Scripts

### `setup-staking.js`
**Purpose**: Configures the staking system with proper token allocations and reward parameters.

**Inputs**:
- Staking contract address
- Token contract address
- Reward rate parameters
- Initial token allocations

**Outputs**:
- Configured staking pools
- Initial reward token distributions
- Staking parameter confirmations

**Configuration Options**:
- Reward rate (tokens per block/second)
- Staking duration requirements
- Early withdrawal penalties
- Maximum stake amounts

**Usage**:
```bash
node setup-staking.js --stakingContract 0x123... --tokenContract 0xabc...
```

### `stake-management.js`
**Purpose**: Administrative functions for staking pool management.

**Functions**:
- Add/remove staking pools
- Adjust reward rates
- Emergency pause/unpause
- Distribute additional rewards

**Usage**:
```bash
# Add new staking pool
node stake-management.js addPool --nftContract 0x123... --rewardRate 100

# Pause staking
node stake-management.js pause --pool 1

# Distribute bonus rewards
node stake-management.js distributeRewards --amount 1000 --pool 1
```

---

## Database Integration Scripts

### `database-access.js`
**Purpose**: Provides unified interface for database operations supporting both Supabase and local JSON storage.

**Key Features**:
- Dual storage backend support (Supabase + JSON)
- CRUD operations for NFT data
- Batch import/export functionality
- Data synchronization between storage types

**Functions**:
- `storeNFTData(nftData)`: Store NFT information
- `retrieveNFTData(tokenId)`: Get NFT by token ID
- `updateStakingInfo(tokenId, stakingData)`: Update staking status
- `getMarketplaceListings()`: Fetch all marketplace data

**Environment Variables**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
DATABASE_TYPE=supabase  # or 'json'
```

**Usage**:
```javascript
const { storeNFTData, retrieveNFTData } = require('./database-access');

// Store NFT data
await storeNFTData({
  tokenId: 1,
  title: "Prime Location NFT",
  location: "New York, NY",
  price: "1000000",
  stakingContract: "0x123..."
});

// Retrieve NFT data
const nftData = await retrieveNFTData(1);
```

### `store-complete-nft-data.js`
**Purpose**: Compiles and stores comprehensive NFT data from multiple sources into unified database records.

**Data Sources**:
- Smart contract events
- IPFS metadata
- Marketplace listings
- Staking information

**Outputs**:
- Complete NFT records in database
- marketplace-listings.json file
- Data validation reports

**Features**:
- Cross-reference token IDs with metadata
- Validate data integrity
- Handle missing or corrupted data
- Generate backup files

**Usage**:
```bash
node store-complete-nft-data.js --network mainnet --validate
```

---

## Marketplace Data Management

### `store-marketplace-listings.js`
**Purpose**: Manages marketplace listing data and synchronizes with frontend requirements.

**Input Sources**:
- NFT contract events (Transfer, Mint)
- Marketplace contract events (List, Sale)
- Metadata from IPFS
- Staking contract integration

**Outputs**:
- `marketplace-listings.json`: Frontend data file
- Database records for listings
- Search index updates

**Data Structure**:
```json
{
  "id": "1",
  "title": "Prime Real Estate NFT",
  "location": "Manhattan, NY",
  "price": "2500000",
  "shares": "1,234",
  "tag": "HOT",
  "type": "rwa",
  "image": "ipfs://QmXXXXX...",
  "tokenURI": "ipfs://QmYYYYY...",
  "stakingContract": "0x742d35Cc6634C0532925a3b8D5C90bdb9B11223a",
  "contractAddress": "0x123...",
  "tokenId": 1
}
```

**Usage**:
```bash
# Update marketplace listings
node store-marketplace-listings.js

# Force refresh from blockchain
node store-marketplace-listings.js --refresh

# Export to specific format
node store-marketplace-listings.js --format json --output ./data/
```

---

## Frontend Hooks and Utilities

### `useContractOperations.js`
**Purpose**: React hook providing blockchain interaction functions for the frontend.

**Functions Available**:
- `mintNFT(metadata, recipient)`: Mint new NFTs
- `listProperty(tokenId, price)`: List NFT on marketplace
- `buyProperty(tokenId, amount)`: Purchase listed NFT
- `stakeTokens(tokenId, amount)`: Stake tokens on NFT
- `withdrawStake(tokenId)`: Withdraw staked tokens
- `claimRewards(tokenId)`: Claim staking rewards
- `createProposal(description, votingPeriod)`: Create DAO proposal
- `vote(proposalId, support)`: Vote on DAO proposal
- `approveToken(spender, amount)`: Approve token spending

**State Management**:
- Transaction loading states
- Error handling and user feedback
- Success notifications
- Gas estimation

**Usage Example**:
```javascript
import { useContractOperations } from '@/hooks/useContractOperations';

function StakingComponent({ tokenId }) {
  const { stakeTokens, isLoading, error } = useContractOperations();
  
  const handleStake = async () => {
    const result = await stakeTokens({
      tokenId: tokenId,
      amount: "100"
    });
    
    if (result.success) {
      console.log('Staking successful!', result.hash);
    }
  };
  
  return (
    <button onClick={handleStake} disabled={isLoading}>
      {isLoading ? 'Staking...' : 'Stake Tokens'}
    </button>
  );
}
```

### `useContractInteraction.js`
**Purpose**: Lower-level hook for direct smart contract read/write operations.

**Key Features**:
- Wagmi integration for wallet connection
- Contract ABI management
- Event listening and filtering
- Multi-network support

**Functions**:
- `useContractReadData(contractName, functionName, params)`: Read contract data
- `useContractWriteCustom(contractName, functionName)`: Write to contract
- `useEventListener(contractName, eventName, callback)`: Listen to events

---

## Environment Setup

### Required Environment Variables

```env
# Blockchain Configuration
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://your-rpc-endpoint
ETHERSCAN_API_KEY=your_etherscan_api_key

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_TYPE=supabase  # or 'json'

# IPFS Configuration
IPFS_API_KEY=your_ipfs_api_key
IPFS_SECRET=your_ipfs_secret
IPFS_GATEWAY=https://gateway.pinata.cloud

# Contract Addresses (set after deployment)
NFT_CONTRACT_ADDRESS=0x123...
TOKEN_CONTRACT_ADDRESS=0xabc...
STAKING_CONTRACT_ADDRESS=0xdef...
MARKETPLACE_CONTRACT_ADDRESS=0x456...

# Frontend Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=1  # Ethereum mainnet
```

### Package Dependencies

**Smart Contract Development**:
```bash
npm install --save-dev hardhat @openzeppelin/contracts ethers
```

**Frontend**:
```bash
npm install wagmi viem @tanstack/react-query
```

**Database & Storage**:
```bash
npm install @supabase/supabase-js pinata-sdk
```

---

## Recommended Workflow

### 1. Initial Project Setup
```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd LandKrypt
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Compile contracts
npx hardhat compile
```

### 2. Smart Contract Deployment
```bash
# 1. Deploy to local network first
npx hardhat node  # In separate terminal
npx hardhat run deploy-contracts.js --network localhost

# 2. Setup staking system
node setup-staking.js --network localhost

# 3. Deploy to testnet
npx hardhat run deploy-contracts.js --network sepolia
node setup-staking.js --network sepolia
```

### 3. NFT Content Preparation
```bash
# 1. Generate metadata and upload to IPFS
node generate-nft-metadata.js

# 2. Mint initial NFTs
node mint-nfts.js --count 10

# 3. Store complete NFT data
node store-complete-nft-data.js
```

### 4. Marketplace Setup
```bash
# 1. Generate marketplace listings
node store-marketplace-listings.js

# 2. Setup database
node database-access.js --init

# 3. Verify data integrity
node store-complete-nft-data.js --validate
```

### 5. Frontend Development
```bash
# 1. Start development server
npm run dev

# 2. Test wallet connection and staking
# Navigate to localhost:3000/marketplace

# 3. Verify contract interactions work correctly
```

### 6. Production Deployment
```bash
# 1. Deploy contracts to mainnet
npx hardhat run deploy-contracts.js --network mainnet

# 2. Update environment variables
# Update .env.production with mainnet addresses

# 3. Build and deploy frontend
npm run build
npm start
```

---

## Troubleshooting

### Common Issues

**Contract Deployment Fails**:
- Check private key and RPC URL
- Ensure sufficient ETH for gas fees
- Verify network configuration

**NFT Metadata Issues**:
- Verify IPFS gateway accessibility
- Check metadata JSON structure
- Ensure image files are properly uploaded

**Database Connection Problems**:
- Verify Supabase credentials
- Check database schema matches expected structure
- Test with JSON fallback mode

**Frontend Contract Interaction Issues**:
- Verify contract addresses in environment
- Check ABI files are up to date
- Ensure wallet is connected to correct network

### Performance Optimization

**Large NFT Collections**:
- Use batch processing for metadata generation
- Implement pagination in frontend
- Consider IPFS pinning service for reliability

**Database Performance**:
- Index frequently queried fields
- Use database connection pooling
- Implement caching for static data

**Frontend Optimization**:
- Lazy load images from IPFS
- Cache contract read calls
- Implement transaction queuing for better UX

---

## Security Considerations

**Smart Contracts**:
- Audit contracts before mainnet deployment
- Use OpenZeppelin security patterns
- Implement access controls and circuit breakers

**Database Security**:
- Use Row Level Security (RLS) in Supabase
- Sanitize all user inputs
- Implement proper authentication

**Frontend Security**:
- Validate all user inputs
- Use secure wallet connection practices
- Implement proper error handling to avoid information leakage

**Environment Security**:
- Never commit private keys to version control
- Use environment-specific configurations
- Rotate API keys regularly

---

This documentation should be updated as the project evolves and new scripts are added. Each script should include inline comments explaining complex logic and proper error handling.
