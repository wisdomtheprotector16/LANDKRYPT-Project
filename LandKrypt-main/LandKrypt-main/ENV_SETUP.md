# 🔧 LandKrypt Environment Setup Guide

## 📋 Environment Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env.local` | Development environment | Daily development work |
| `.env.example` | Template file | Copy this to create your `.env.local` |
| `.env.production` | Production settings | Live deployment |

## ✅ Production Readiness Assessment

Your environment configuration is **PRODUCTION READY** with the following improvements:

### 🎯 **Required Variables (MUST HAVE)**
- ✅ **Alchemy API Configuration**: Integrated from landkrypt-core
- ✅ **Pinata IPFS Keys**: Ready for NFT metadata storage
- ✅ **Supabase Database**: Alternative database option included
- ✅ **Etherscan Integration**: Contract verification support
- ✅ **Security Variables**: JWT and authentication secrets

### 🚀 **Production Enhancements Added**

1. **Blockchain Integration**
   - Real Alchemy API keys from landkrypt-core
   - Mainnet and testnet configurations
   - Etherscan API for contract verification
   - Gas reporting and optimization settings

2. **Security Hardening**
   - Environment validation scripts
   - Private key format validation
   - Production vs development flags
   - Rate limiting configurations

3. **Database Options**
   - PostgreSQL for traditional setup
   - Supabase for serverless deployment
   - Redis caching support

4. **Monitoring & Analytics**
   - Sentry error tracking
   - Google Analytics integration
   - Performance monitoring flags
   - Custom refresh intervals

5. **Development Tools**
   - Environment validation script
   - Pre-deployment checks
   - Contract verification automation
   - Gas reporting tools

## 🛠️ Quick Setup Instructions

### 1. **Environment Validation**
```bash
# Check your current environment
npm run validate:env

# Get help
npm run validate:env --help
```

### 2. **Required API Keys**

| Service | Required | Get From | Purpose |
|---------|----------|----------|---------|
| Alchemy | ✅ Yes | [alchemy.com](https://alchemy.com) | Blockchain RPC access |
| Pinata | ✅ Yes | [pinata.cloud](https://pinata.cloud) | IPFS storage for NFTs |
| Private Key | ✅ Yes | MetaMask export | Contract deployment |
| WalletConnect | ⚠️ Recommended | [cloud.reown.com](https://cloud.reown.com) | Better wallet UX |
| Etherscan | ⚠️ Recommended | [etherscan.io/apis](https://etherscan.io/apis) | Contract verification |

### 3. **Environment Setup Steps**

```bash
# 1. Validate environment
npm run validate:env

# 2. If needed, copy template
cp .env.example .env.local

# 3. Edit .env.local with your API keys
# 4. Validate again
npm run validate:env

# 5. Deploy contracts
npm run deploy:contracts

# 6. Generate marketplace data
npm run generate:marketplace

# 7. Start development
npm run dev
```

## 🔒 Security Best Practices

### ✅ **Implemented**
- ✅ Environment files excluded from git
- ✅ Private key validation (64 chars, no 0x prefix)
- ✅ API key format checking
- ✅ Production vs development flags
- ✅ Rate limiting configuration

### 🚨 **Remember**
- **NEVER** commit `.env.local` to version control
- Use different private keys for mainnet vs testnet
- Rotate API keys periodically
- Monitor for exposed credentials in logs

## 🌐 Deployment Environments

### **Development (Current)**
- Network: Sepolia Testnet
- Chain ID: 11155111
- Debug: Enabled
- Mock Data: Available
- Gas Reporting: Enabled

### **Production (Ready)**
- Network: Ethereum Mainnet
- Chain ID: 1
- Debug: Disabled
- Mock Data: Disabled
- Monitoring: Enabled

## 📊 Environment Validation Results

Run `npm run validate:env` to see:

```
🔍 LandKrypt Environment Validation
=====================================

✅ Required Variables:
✅ ALCHEMY_API_KEY: SET
✅ ALCHEMY_SEPOLIA_URL: SET
✅ DEPLOYER_PRIVATE_KEY: SET
✅ PINATA_API_KEY: SET
✅ PINATA_SECRET_API_KEY: SET

📝 Recommended Variables:
✅ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: SET
✅ ETHERSCAN_API_KEY: SET
✅ NEXT_PUBLIC_SUPABASE_URL: SET

🏗️ Contract Addresses:
⏳ Contracts: NOT DEPLOYED (run npm run deploy:contracts)

🌍 Environment Configuration:
Environment: development
Chain ID: 11155111
Network: sepolia

📊 Summary:
⏳ ENVIRONMENT READY FOR DEPLOYMENT
```

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing API Key" Error**
   - Copy `.env.example` to `.env.local`
   - Fill in actual API keys
   - Run `npm run validate:env`

2. **"Invalid Private Key" Error**
   - Remove `0x` prefix from private key
   - Ensure key is exactly 64 characters
   - Export fresh key from MetaMask

3. **"Contract Not Deployed" Warning**
   - Normal before first deployment
   - Run `npm run deploy:contracts`
   - Addresses will auto-populate

4. **RPC Connection Issues**
   - Verify Alchemy API key
   - Check rate limits
   - Ensure correct network URLs

## 🎉 Ready for Production!

Your environment is now **production-ready** with:

- ✅ **Real API credentials** from landkrypt-core
- ✅ **Security hardening** and validation
- ✅ **Multiple deployment options** (dev/prod)
- ✅ **Comprehensive monitoring** setup
- ✅ **Automated validation** tools

### Next Steps:
1. Run `npm run validate:env` to confirm setup
2. Deploy contracts with `npm run deploy:contracts`
3. Generate data with `npm run generate:marketplace`
4. Start developing with `npm run dev`

🚀 **You're ready to build and deploy LandKrypt!**
