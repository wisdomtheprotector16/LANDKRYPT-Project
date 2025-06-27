# LandKrypt Deployment Guide

A comprehensive guide for deploying and running the LandKrypt decentralized real estate investment platform.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18.17.0 or later)
2. **npm** or **pnpm** package manager
3. **Git** for version control
4. **Alchemy** account for RPC access
5. **Pinata** account for IPFS storage
6. **MetaMask** or similar wallet with Sepolia ETH

### Environment Setup

1. **Clone and Setup**
```bash
git clone <your-repo-url>
cd LandKrypt-main/LandKrypt-main
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.local .env.local.backup
```

Edit `.env.local` with your actual values:

```env
# Required for deployment
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key_here
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Required for NFT minting
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# Optional but recommended
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_from_reown
```

### Quick Deploy (Development)

```bash
# Deploy contracts to Sepolia testnet
npm run deploy:contracts

# Generate marketplace data
npm run generate:marketplace

# Start development server
npm run dev
```

## 📋 Detailed Deployment Steps

### Step 1: Get Required API Keys

#### Alchemy API Key
1. Go to [Alchemy.com](https://alchemy.com/)
2. Create an account and new app
3. Select "Ethereum" → "Sepolia" for testnet
4. Copy your API key

#### Pinata API Keys
1. Go to [Pinata.cloud](https://pinata.cloud/)
2. Create account and generate API keys
3. Copy both API key and Secret API key

#### WalletConnect Project ID (Optional)
1. Go to [Cloud.reown.com](https://cloud.reown.com/)
2. Create new project
3. Copy Project ID

### Step 2: Prepare Deployment Wallet

1. **Create/Import Wallet**
   - Use MetaMask or any Ethereum wallet
   - Export private key (keep secure!)

2. **Get Sepolia ETH**
   - Use [Sepolia Faucet](https://sepoliafaucet.com/)
   - Need ~0.1-0.2 ETH for full deployment

3. **Add Private Key to Environment**
   ```env
   DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...
   ```

### Step 3: Deploy Smart Contracts

```bash
# Full contract deployment
npm run deploy:contracts
```

This script will:
- Deploy all LandKrypt smart contracts
- Configure permissions and relationships
- Update `.env.local` with contract addresses
- Save deployment manifest to `deployments/` folder

**Expected Output:**
```
🚀 Beginning LandKrypt deployment with 0x123...

🛠  Deploying Core Infrastructure...
✅ LKUSD deployed to: 0xABC123...
✅ LKST deployed to: 0xDEF456...
✅ RealEstateNFT deployed to: 0x789ABC...
✅ Oracle deployed to: 0xGHI789...
✅ Exchange deployed to: 0xJKL012...

🔧 Deploying Operational Contracts...
✅ NFTMarketplace deployed to: 0xMNO345...
✅ DevelopmentContract deployed to: 0xPQR678...
✅ StakingFactory deployed to: 0xSTU901...

🏛  Deploying Governance System...
✅ NFTDAO deployed to: 0xVWX234...

🔗 Integrating System Components...
🔐 Configuring Access Controls...
📝 Updating environment configuration...

🚀 Deployment Complete! 🚀
```

### Step 4: Mint Sample NFTs (Optional)

```bash
# Mint single NFT
npm run mint:nft ./public/nfts/nft1.jpg 1 "Luxury Villa in Lagos" 0xYourWalletAddress

# The script will:
# 1. Upload image to IPFS
# 2. Create and upload metadata
# 3. Mint NFT on blockchain
# 4. Save minting record
```

### Step 5: Generate Marketplace Data

```bash
# Generate marketplace listings from deployed contracts
npm run generate:marketplace
```

This creates:
- `src/data/nft-listings.json` - Main listings file
- `src/data/rwa-listings.json` - RWA properties only
- `src/data/digital-asset-listings.json` - Digital assets only
- `src/data/marketplace-summary.json` - Statistics

### Step 6: Start Application

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
LandKrypt-main/LandKrypt-main/
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   ├── contracts/              # Contract ABIs
│   ├── hooks/                  # Custom React hooks
│   ├── stores/                 # Zustand state stores
│   └── data/                   # Generated marketplace data
├── scripts/
│   ├── deploy.js              # Contract deployment
│   ├── generateMarketplaceData.js
│   └── mintNFT.js             # NFT minting utility
├── deployments/               # Deployment records
├── records/                   # Minting records
├── hardhat.config.js          # Hardhat configuration
└── .env.local                 # Environment variables
```

## 🔧 Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run start                  # Start production server

# Blockchain
npm run deploy:contracts       # Deploy all contracts
npm run mint:nft              # Mint single NFT
npm run generate:marketplace   # Generate marketplace data

# Setup
npm run setup:dev             # Setup development environment
```

## 🌐 Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push code to GitHub/GitLab/Bitbucket
   - Connect to Vercel account

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure no private keys in public variables

3. **Deploy**
   ```bash
   npm run build
   ```

### Custom Server Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Set Production Environment**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Start Server**
   ```bash
   npm start
   ```

## 🔒 Security Considerations

### Environment Variables
- **Never commit** `.env.local` to version control
- Use different wallets for mainnet vs testnet
- Rotate API keys regularly

### Smart Contracts
- Contracts deployed with development settings
- For mainnet: Enable multi-sig, timelock governance
- Audit contracts before mainnet deployment

### Frontend Security
- API rate limiting implemented
- Input validation on all forms
- HTTPS required in production

## 🧪 Testing

### Local Testing
```bash
# Start local hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Run frontend against local network
npm run dev
```

### Testnet Testing
- Use Sepolia testnet for testing
- Get test ETH from faucets
- Test all user flows before mainnet

## 📊 Monitoring & Analytics

### Contract Events
- All major actions emit events
- Monitor via Alchemy/Infura webhooks
- Track user actions in `user-actions` API

### Application Metrics
- NextJS analytics available
- Custom tracking via API routes
- Monitor IPFS gateway performance

## 🆘 Troubleshooting

### Common Issues

1. **"insufficient funds" Error**
   - Ensure wallet has enough Sepolia ETH
   - Check gas price settings

2. **"Contract not deployed" Error**
   - Run `npm run deploy:contracts` first
   - Check contract addresses in `.env.local`

3. **IPFS Upload Failures**
   - Verify Pinata API keys
   - Check file size limits (100MB max)

4. **RPC Connection Issues**
   - Verify Alchemy API key
   - Check rate limits

### Debug Mode
```env
NEXT_PUBLIC_ENABLE_DEBUG=true
LOG_LEVEL=debug
```

### Getting Help
1. Check deployment logs in `deployments/` folder
2. Review contract verification on Etherscan
3. Test individual components using scripts
4. Review browser console for frontend errors

## 🚀 Going to Mainnet

### Pre-Mainnet Checklist
- [ ] Full testing on Sepolia
- [ ] Security audit of contracts
- [ ] Multi-sig wallet setup
- [ ] Governance transition plan
- [ ] Emergency procedures
- [ ] Documentation complete

### Mainnet Deployment
1. Update environment to mainnet settings
2. Use production-grade infrastructure
3. Enable monitoring and alerting
4. Plan gradual feature rollout
5. Prepare incident response

---

## 📞 Support

For deployment issues or questions:
- Review this guide thoroughly
- Check error logs and browser console
- Verify all environment variables
- Test on Sepolia before mainnet

**Remember: Never share private keys or API secrets!**
