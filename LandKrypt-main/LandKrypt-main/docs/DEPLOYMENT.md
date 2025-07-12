# LandKrypt Deployment Guide

Comprehensive guide for deploying LandKrypt to production environments.

## Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: Latest version
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection

### Required Accounts and Services

1. **Blockchain Services**
   - Alchemy account for RPC endpoints
   - Etherscan account for contract verification
   - MetaMask or hardware wallet for deployment

2. **Infrastructure Services**
   - Supabase account for database
   - Pinata account for IPFS storage
   - Vercel account for hosting (recommended)

3. **Monitoring Services** (Optional)
   - Sentry for error tracking
   - Google Analytics for user analytics

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/landkrypt.git
cd landkrypt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create environment files for different stages:

#### Development (.env.local)
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Production (.env.production)
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# Blockchain (Mainnet)
DEPLOYER_PRIVATE_KEY=your_mainnet_private_key
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Security
JWT_SECRET=your_32_character_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
DEPLOYMENT_WEBHOOK=your_slack_webhook_url

# Feature Flags
ENABLE_STAKING=true
ENABLE_MARKETPLACE=true
ENABLE_DAO=true
ENABLE_TIER_SYSTEM=true
```

### 4. Validate Environment

```bash
npm run env:validate
```

## Database Setup

### 1. Supabase Project Setup

1. Create a new Supabase project
2. Note down the project URL and API keys
3. Configure authentication settings
4. Set up Row Level Security (RLS) policies

### 2. Database Schema

Run the following SQL in Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs table
CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    metadata JSONB NOT NULL,
    is_listed BOOLEAN DEFAULT FALSE,
    current_price DECIMAL(20,2),
    estimated_value DECIMAL(20,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace listings table
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    buyer_address VARCHAR(42),
    price DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LKUSD',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sold_at TIMESTAMP WITH TIME ZONE
);

-- User tier progress table
CREATE TABLE user_tier_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0,
    current_tier INTEGER DEFAULT 1,
    tier_progress INTEGER DEFAULT 0,
    last_daily_xp_claim DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User actions table
CREATE TABLE user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    nft_id INTEGER,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_nfts_owner ON nfts(owner_address);
CREATE INDEX idx_nfts_token_id ON nfts(token_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_token_id ON marketplace_listings(token_id);
CREATE INDEX idx_user_actions_address ON user_actions(user_address);
CREATE INDEX idx_user_actions_type ON user_actions(action_type);
CREATE INDEX idx_tier_progress_address ON user_tier_progress(wallet_address);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your security requirements)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = wallet_address);

CREATE POLICY "NFTs are viewable by everyone" ON nfts
    FOR SELECT USING (true);

CREATE POLICY "Marketplace listings are viewable by everyone" ON marketplace_listings
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own tier progress" ON user_tier_progress
    FOR SELECT USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can view their own actions" ON user_actions
    FOR SELECT USING (auth.uid()::text = user_address);
```

### 3. Database Health Check

```bash
npm run db:health
```

## Smart Contract Deployment

### 1. Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts
npm run verify:contracts
```

### 2. Mainnet Deployment

⚠️ **Warning**: Mainnet deployment requires real ETH and is irreversible.

```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet

# Verify contracts on Etherscan
npm run verify:contracts
```

### 3. Contract Verification

Ensure all contracts are verified on Etherscan:

1. Check contract addresses in deployment output
2. Verify source code matches deployed bytecode
3. Test contract interactions through Etherscan

## Application Deployment

### Option 1: Vercel Deployment (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Configure Project

```bash
# Initialize Vercel project
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all production environment variables
```

#### 4. Deploy to Production

```bash
# Deploy to production
vercel --prod
```

### Option 2: Docker Deployment

#### 1. Build Docker Image

```bash
# Build production image
docker build -t landkrypt:latest .
```

#### 2. Run Container

```bash
# Run with environment file
docker run -d \
  --name landkrypt-prod \
  --env-file .env.production \
  -p 3000:3000 \
  landkrypt:latest
```

### Option 3: PM2 Deployment

#### 1. Install PM2

```bash
npm install -g pm2
```

#### 2. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'landkrypt-prod',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### 3. Deploy with PM2

```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

## Automated Deployment

### Using the Deployment Script

```bash
# Full production deployment
npm run deploy:production

# Health checks only
npm run deploy:health

# Environment validation only
npm run deploy:validate
```

### Deployment Script Features

- **Pre-deployment Validation**: Checks environment, dependencies, and system requirements
- **Database Migration**: Handles schema updates and data migrations
- **Smart Contract Deployment**: Automated contract deployment and verification
- **Application Build**: Optimized production build with asset optimization
- **Health Checks**: Comprehensive system health verification
- **Rollback Capability**: Automatic rollback on deployment failures
- **Monitoring Integration**: Real-time deployment monitoring and alerts

## Post-Deployment Configuration

### 1. DNS Configuration

Configure your domain to point to the deployment:

```
# For Vercel
your-domain.com CNAME your-project.vercel.app

# For custom server
your-domain.com A your-server-ip
```

### 2. SSL Certificate

Ensure HTTPS is properly configured:

- **Vercel**: Automatic SSL with Let's Encrypt
- **Custom Server**: Configure SSL certificates (Let's Encrypt recommended)

### 3. CDN Configuration

Configure CDN for static assets:

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://your-cdn-domain.com' 
    : '',
};
```

### 4. Monitoring Setup

#### Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

#### Analytics (Google Analytics)

Add Google Analytics tracking code to your environment variables and the application will automatically include it.

### 5. Backup Configuration

Set up automated backups:

1. **Database Backups**: Configure Supabase automatic backups
2. **Code Backups**: Ensure Git repository is properly backed up
3. **Environment Backups**: Securely store environment configurations

## Health Monitoring

### 1. Application Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "blockchain": "healthy",
    "ipfs": "healthy"
  }
}
```

### 2. Monitoring Endpoints

- **Health Check**: `/api/health`
- **Metrics**: `/api/metrics`
- **Status**: `/api/status`

### 3. Alerting Setup

Configure alerts for:

- Application downtime
- High error rates
- Performance degradation
- Security incidents
- Resource exhaustion

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

```bash
# Check environment file exists
ls -la .env*

# Validate environment variables
npm run env:validate

# Check Next.js environment loading
npm run build -- --debug
```

#### 2. Database Connection Issues

```bash
# Test database connection
npm run db:health

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

#### 3. Smart Contract Deployment Failures

```bash
# Check network connectivity
npm run blockchain:health

# Verify account balance
npm run wallet:balance

# Check gas prices
npm run gas:check
```

#### 4. Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

### Performance Issues

#### 1. Slow Page Load Times

- Enable compression
- Optimize images
- Configure CDN
- Enable caching

#### 2. High Memory Usage

- Monitor memory usage
- Optimize database queries
- Implement connection pooling
- Configure garbage collection

### Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Monitoring and alerting active
- [ ] Backup and recovery tested

## Maintenance

### Regular Tasks

1. **Weekly**
   - Monitor application performance
   - Review error logs
   - Check security alerts
   - Update dependencies (patch versions)

2. **Monthly**
   - Review and rotate secrets
   - Analyze usage metrics
   - Update documentation
   - Test backup and recovery procedures

3. **Quarterly**
   - Security audit
   - Performance optimization
   - Dependency major updates
   - Infrastructure review

### Scaling Considerations

As your application grows, consider:

1. **Horizontal Scaling**: Multiple application instances
2. **Database Optimization**: Read replicas, connection pooling
3. **CDN Implementation**: Global content distribution
4. **Caching Layers**: Redis for application caching
5. **Load Balancing**: Distribute traffic across instances

## Support

For deployment support:

- **Documentation**: [https://docs.landkrypt.com](https://docs.landkrypt.com)
- **Discord**: [https://discord.gg/landkrypt](https://discord.gg/landkrypt)
- **Email**: support@landkrypt.com
- **GitHub Issues**: [https://github.com/landkrypt/landkrypt/issues](https://github.com/landkrypt/landkrypt/issues)
