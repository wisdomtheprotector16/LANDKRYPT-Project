# LandKrypt Architecture Documentation

Comprehensive architecture overview of the LandKrypt real estate NFT platform.

## System Overview

LandKrypt is a decentralized platform for tokenizing real estate assets as NFTs, built on a modern Web3 architecture that combines blockchain technology with traditional web services for optimal performance and user experience.

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Ethereum)    │
│                 │    │                 │    │                 │
│ • React UI      │    │ • API Server    │    │ • Smart         │
│ • Wallet        │    │ • Database      │    │   Contracts     │
│ • Real-time     │    │ • IPFS          │    │ • Tokens        │
│   Updates       │    │ • Tier System   │    │ • Governance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React hooks and context
- **Blockchain Integration**: Wagmi + Ethers.js
- **Real-time Updates**: Supabase subscriptions

### Component Architecture

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── ResponsiveCard.jsx
│   │   ├── Button.jsx
│   │   └── Modal.jsx
│   ├── layout/             # Layout components
│   │   ├── ResponsiveLayout.jsx
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── ResponsiveDashboard.jsx
│   │   ├── StatsCard.jsx
│   │   └── ActivityFeed.jsx
│   ├── tier/               # Tier system components
│   │   ├── TierDisplay.jsx
│   │   ├── TierProgress.jsx
│   │   └── TierBenefits.jsx
│   └── marketplace/        # Marketplace components
│       ├── NFTCard.jsx
│       ├── ListingForm.jsx
│       └── PurchaseModal.jsx
├── hooks/                  # Custom React hooks
│   ├── data/              # Data fetching hooks
│   │   ├── useNFTSync.js
│   │   └── useMarketplace.js
│   └── blockchain/        # Blockchain interaction hooks
│       ├── useTierSystem.js
│       ├── useContracts.js
│       └── useWallet.js
├── lib/                   # Utility libraries
│   ├── blockchain/        # Blockchain utilities
│   ├── database/          # Database utilities
│   └── utils/             # General utilities
└── styles/                # Styling
    ├── globals.css
    └── responsive.css
```

### Responsive Design Strategy

- **Mobile-First Approach**: Designed for 320px minimum width
- **Breakpoint System**: xs(320px), sm(640px), md(768px), lg(1024px), xl(1280px)
- **Adaptive Components**: Components adjust layout and functionality based on screen size
- **Touch-Friendly**: Minimum 44px touch targets for mobile devices

## Backend Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **File Storage**: IPFS via Pinata
- **Authentication**: JWT with wallet signatures
- **Caching**: Redis (optional)

### Service Architecture

```
Backend Services
├── API Layer
│   ├── Authentication Service
│   ├── NFT Management Service
│   ├── Marketplace Service
│   ├── Tier System Service
│   └── Analytics Service
├── Data Layer
│   ├── Database Service (Supabase)
│   ├── IPFS Service (Pinata)
│   └── Cache Service (Redis)
├── Blockchain Layer
│   ├── Contract Interaction Service
│   ├── Transaction Monitoring
│   └── Event Processing
└── Infrastructure
    ├── Security Middleware
    ├── Rate Limiting
    ├── Error Handling
    └── Logging System
```

### Database Schema

```sql
-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id INTEGER UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    metadata JSONB NOT NULL,
    is_listed BOOLEAN DEFAULT FALSE,
    current_price DECIMAL(20,2),
    estimated_value DECIMAL(20,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id INTEGER NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    buyer_address VARCHAR(42),
    price DECIMAL(20,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LKUSD',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    sold_at TIMESTAMP
);

CREATE TABLE user_tier_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    total_xp INTEGER DEFAULT 0,
    current_tier INTEGER DEFAULT 1,
    tier_progress INTEGER DEFAULT 0,
    last_daily_xp_claim DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    nft_id INTEGER,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## Blockchain Architecture

### Smart Contract System

```
Smart Contracts
├── Core Contracts
│   ├── RealEstateNFT.sol      # ERC-721 NFT contract
│   ├── NFTMarketplace.sol     # Marketplace with escrow
│   └── PropertyOracle.sol     # Price and data feeds
├── Token Contracts
│   ├── LandKryptUSD.sol       # LKUSD stablecoin (ERC-20)
│   ├── LandKryptStaking.sol   # LKST utility token (ERC-20)
│   └── StakingRewards.sol     # Staking rewards distribution
├── Governance Contracts
│   ├── LandKryptDAO.sol       # DAO governance
│   ├── ProposalManager.sol    # Proposal management
│   └── VotingPower.sol        # Voting power calculation
└── Utility Contracts
    ├── AccessControl.sol      # Role-based access control
    ├── Pausable.sol          # Emergency pause functionality
    └── Upgradeable.sol       # Proxy upgrade pattern
```

### Contract Interaction Flow

```
User Action Flow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Blockchain │    │   Database  │
│             │    │             │    │             │    │             │
│ 1. User     │───►│ 2. Validate │───►│ 3. Execute  │───►│ 4. Record   │
│    Action   │    │    & Sign   │    │ Transaction │    │   Result    │
│             │    │             │    │             │    │             │
│ 5. Update   │◄───│ 6. Process  │◄───│ 7. Confirm  │◄───│ 8. Sync     │
│    UI       │    │   Response  │    │   & Emit    │    │   State     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## NFT Generation System

### Template-Based Architecture

```
NFT Generation Pipeline
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Templates     │    │   Generator     │    │   Storage       │
│                 │    │                 │    │                 │
│ • Property      │───►│ • Metadata      │───►│ • IPFS Upload   │
│   Types         │    │   Generation    │    │ • Database      │
│ • Locations     │    │ • Image         │    │   Storage       │
│ • Rarities      │    │   Processing    │    │ • Blockchain    │
│ • Attributes    │    │ • Validation    │    │   Minting       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Template Configuration

```javascript
// Example template structure
const templates = {
  'residential.villa': {
    name: 'Villa',
    description: 'Luxurious residential villa',
    basePrice: 2000000,
    attributes: {
      'Property Type': 'Villa',
      'Category': 'Residential',
      'Bedrooms': { min: 3, max: 6 },
      'Bathrooms': { min: 2, max: 4 },
      'Square Feet': { min: 2000, max: 5000 }
    },
    rarityMultipliers: {
      common: 1.0,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0
    }
  }
};
```

## Tier System Architecture

### XP and Progression System

```
Tier Progression Flow
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Activities    │    │   XP Engine     │    │   Benefits      │
│                 │    │                 │    │                 │
│ • Daily Login   │───►│ • Calculate XP  │───►│ • Staking       │
│ • NFT Actions   │    │ • Apply         │    │   Multipliers   │
│ • Marketplace   │    │   Multipliers   │    │ • Fee Discounts │
│ • Governance    │    │ • Check Tier    │    │ • Exclusive     │
│ • Referrals     │    │   Progression   │    │   Access        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tier Configuration

```javascript
const tierSystem = {
  tiers: {
    1: { name: 'Explorer', xp: 0, stakingMultiplier: 1.0 },
    2: { name: 'Settler', xp: 500, stakingMultiplier: 1.1 },
    3: { name: 'Investor', xp: 2000, stakingMultiplier: 1.25 },
    4: { name: 'Developer', xp: 5000, stakingMultiplier: 1.5 },
    5: { name: 'Mogul', xp: 15000, stakingMultiplier: 2.0 },
    6: { name: 'Legend', xp: 50000, stakingMultiplier: 3.0 }
  },
  activities: {
    dailyLogin: { baseXP: 10, maxPerDay: 1 },
    nftMint: { baseXP: 100, maxPerDay: 5 },
    nftPurchase: { baseXP: 75, maxPerDay: 10 },
    stakingDeposit: { baseXP: 25, maxPerDay: 3 }
  }
};
```

## Security Architecture

### Multi-Layer Security

```
Security Layers
┌─────────────────────────────────────────────────────────────┐
│                    Application Security                      │
├─────────────────────────────────────────────────────────────┤
│ • Input Validation    • Rate Limiting    • CORS Protection  │
│ • XSS Prevention     • CSRF Protection   • SQL Injection    │
│ • Authentication     • Authorization     • Session Mgmt     │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Security                   │
├─────────────────────────────────────────────────────────────┤
│ • HTTPS/TLS          • Security Headers   • Environment     │
│ • Firewall Rules     • DDoS Protection    • Secrets Mgmt    │
│ • Monitoring         • Logging           • Backup/Recovery  │
├─────────────────────────────────────────────────────────────┤
│                    Blockchain Security                       │
├─────────────────────────────────────────────────────────────┤
│ • Smart Contract     • Multi-sig Wallets • Access Control   │
│ • Audit & Testing    • Upgrade Patterns  • Emergency Pause  │
│ • Oracle Security    • Front-running     • MEV Protection   │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Wallet Authentication
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Blockchain │
│             │    │             │    │             │
│ 1. Request  │───►│ 2. Generate │    │             │
│    Nonce    │    │    Nonce    │    │             │
│             │    │             │    │             │
│ 3. Sign     │    │             │    │             │
│    Message  │    │             │    │             │
│             │    │             │    │             │
│ 4. Submit   │───►│ 5. Verify   │───►│ 6. Validate │
│ Signature   │    │ Signature   │    │   Address   │
│             │    │             │    │             │
│ 7. Receive  │◄───│ 8. Issue    │    │             │
│    JWT      │    │    JWT      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Performance Architecture

### Optimization Strategies

1. **Frontend Optimization**
   - Code splitting and lazy loading
   - Image optimization and CDN
   - Caching strategies
   - Bundle size optimization

2. **Backend Optimization**
   - Database query optimization
   - Connection pooling
   - Caching layers (Redis)
   - API response compression

3. **Blockchain Optimization**
   - Gas optimization
   - Batch transactions
   - Layer 2 integration
   - Event filtering

### Caching Strategy

```
Caching Layers
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   CDN/Edge      │    │   Application   │
│   Cache         │    │   Cache         │    │   Cache         │
│                 │    │                 │    │                 │
│ • Static Assets │    │ • Images        │    │ • Database      │
│ • API Responses │    │ • API Responses │    │   Queries       │
│ • User Data     │    │ • Static Files  │    │ • Computed      │
│                 │    │                 │    │   Results       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Deployment Architecture

### Infrastructure Overview

```
Production Infrastructure
┌─────────────────────────────────────────────────────────────┐
│                         Load Balancer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   App       │  │   App       │  │   App       │         │
│  │ Instance 1  │  │ Instance 2  │  │ Instance 3  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │    Redis    │  │    IPFS     │         │
│  │ (Supabase)  │  │   Cache     │  │  (Pinata)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Monitoring  │  │   Logging   │  │   Backup    │         │
│  │  (Sentry)   │  │ (Winston)   │  │  Service    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Pipeline

```
CI/CD Pipeline
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │    │    Build    │    │    Test     │    │   Deploy    │
│   Control   │    │             │    │             │    │             │
│             │    │             │    │             │    │             │
│ • Git Push  │───►│ • Install   │───►│ • Unit      │───►│ • Staging   │
│ • PR Merge  │    │   Deps      │    │   Tests     │    │ • Production│
│ • Tag       │    │ • Build     │    │ • E2E Tests │    │ • Rollback  │
│   Release   │    │   App       │    │ • Security  │    │   Capability│
│             │    │ • Optimize  │    │   Scan      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Monitoring and Observability

### Monitoring Stack

```
Observability Platform
┌─────────────────────────────────────────────────────────────┐
│                        Metrics                              │
├─────────────────────────────────────────────────────────────┤
│ • Application Performance  • Business Metrics              │
│ • Infrastructure Health   • User Analytics                 │
│ • Blockchain Metrics      • Error Rates                    │
├─────────────────────────────────────────────────────────────┤
│                         Logging                            │
├─────────────────────────────────────────────────────────────┤
│ • Structured Logging      • Error Tracking                 │
│ • Audit Trails           • Security Events                 │
│ • Performance Logs       • User Actions                    │
├─────────────────────────────────────────────────────────────┤
│                        Alerting                            │
├─────────────────────────────────────────────────────────────┤
│ • Real-time Alerts       • Escalation Policies             │
│ • Threshold Monitoring   • Incident Management             │
│ • Health Checks          • SLA Monitoring                  │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

1. **Application Layer**
   - Stateless application design
   - Load balancer distribution
   - Auto-scaling groups
   - Container orchestration

2. **Database Layer**
   - Read replicas
   - Connection pooling
   - Query optimization
   - Partitioning strategies

3. **Blockchain Layer**
   - Layer 2 solutions
   - State channels
   - Sidechains
   - Cross-chain bridges

### Future Architecture Evolution

```
Roadmap Architecture
┌─────────────────────────────────────────────────────────────┐
│                      Phase 1 (Current)                     │
│ • Single Chain (Ethereum)  • Centralized Backend          │
│ • Basic NFT Functionality  • Simple Marketplace           │
├─────────────────────────────────────────────────────────────┤
│                      Phase 2 (Q2 2024)                     │
│ • Layer 2 Integration     • Advanced Analytics             │
│ • Cross-chain Support     • Enhanced Governance            │
├─────────────────────────────────────────────────────────────┤
│                      Phase 3 (Q4 2024)                     │
│ • Fully Decentralized     • AI-Powered Features            │
│ • Multi-chain Native      • Advanced DeFi Integration      │
└─────────────────────────────────────────────────────────────┘
```

This architecture provides a solid foundation for the LandKrypt platform while maintaining flexibility for future enhancements and scaling requirements.
