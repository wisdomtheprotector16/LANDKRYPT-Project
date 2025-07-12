# LandKrypt - Real Estate NFT Platform

A comprehensive Web3 platform for tokenizing and trading real estate assets as NFTs, built with Next.js, Solidity, and modern blockchain technologies.

## 🌟 Features

### Core Functionality

- **Real Estate NFT Minting**: Convert real estate properties into unique NFTs with automated metadata generation
- **Marketplace Trading**: Buy, sell, and trade property NFTs with integrated escrow and tier-based fee discounts
- **Staking System**: Earn rewards by staking LKST tokens and NFTs with tier-based multipliers
- **DAO Governance**: Community-driven decision making with weighted voting power
- **Tier System**: Progressive user advancement with exclusive benefits, XP rewards, and daily bonuses

### Advanced Features

- **Multi-Token Economy**: LKUSD stablecoin and LKST utility token with automated pricing
- **Oracle Integration**: Real-time property valuation and market data feeds
- **Development Contracts**: Fractional ownership and development funding mechanisms
- **Cross-Chain Compatibility**: Built for Ethereum with multi-chain support
- **Mobile-Responsive Design**: Optimized for all devices down to 320px width
- **Real-time Data Sync**: Live updates using Supabase subscriptions
- **Automated NFT Generation**: Template-based NFT creation with batch processing

## 🏗️ Architecture

### Smart Contracts

- **RealEstateNFT**: ERC-721 contract for property tokenization
- **LandKryptUSD (LKUSD)**: Stablecoin for transactions
- **LandKryptStaking (LKST)**: Utility token for staking and governance
- **NFTMarketplace**: Decentralized marketplace with escrow
- **Oracle**: Price feeds and property data integration
- **DAO**: Governance and community voting

### Frontend Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with responsive design
- **Wagmi**: React hooks for Ethereum
- **Ethers.js**: Ethereum library for blockchain interactions
- **Supabase**: Real-time database and subscriptions

### Backend Services

- **Node.js APIs**: Server-side logic and integrations
- **Supabase**: PostgreSQL database with real-time features
- **IPFS/Pinata**: Decentralized file storage
- **Tier Service**: XP tracking and reward distribution
- **Security Middleware**: Rate limiting, validation, and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/landkrypt.git
   cd landkrypt
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Validate Environment**

   ```bash
   npm run env:validate
   ```

5. **Deploy Smart Contracts**

   ```bash
   npm run deploy:contracts
   ```

6. **Generate Sample Data**

   ```bash
   npm run marketplace:generate
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 📋 Environment Configuration

### Required Variables

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Blockchain
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
```

### Optional Variables

```env
# Wallet Integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# Security
JWT_SECRET=your_jwt_secret_32_characters_long
ENCRYPTION_KEY=your_encryption_key_32_characters

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Feature Flags
ENABLE_STAKING=true
ENABLE_MARKETPLACE=true
ENABLE_DAO=true
ENABLE_TIER_SYSTEM=true
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Smart Contracts
npm run deploy:contracts    # Deploy all contracts
npm run deploy:sepolia     # Deploy to Sepolia testnet
npm run deploy:mainnet     # Deploy to Ethereum mainnet
npm run verify:contracts   # Verify contracts on Etherscan

# NFT Management
npm run nft:generate        # Generate NFTs using templates
npm run nft:generate:single # Generate single NFT
npm run nft:generate:batch  # Generate batch of NFTs
npm run nft:generate:collection # Generate entire collection
npm run nft:templates       # List available templates
npm run nft:locations       # List available locations
npm run nft:rarities        # List available rarities

# Testing
npm run test              # Run all tests
npm run test:contracts    # Test smart contracts
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report
npm run test:security    # Security tests

# Production Deployment
npm run deploy:production  # Full production deployment
npm run deploy:health     # Health checks only
npm run deploy:validate   # Environment validation

# Monitoring & Maintenance
npm run health:check      # Basic health check
npm run health:full       # Comprehensive health check
npm run logs:view         # View combined logs
npm run logs:error        # View error logs
npm run logs:clean        # Clean old logs
npm run security:audit    # Security audit
```
