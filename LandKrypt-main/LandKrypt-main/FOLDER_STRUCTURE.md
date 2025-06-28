# LandKrypt Project Organization Structure

This document outlines a proposed folder structure for organizing the LandKrypt project to improve maintainability and development workflow.

## Current Project Structure Analysis

The project currently has scripts and files scattered in the root directory, making it difficult to navigate and maintain. This reorganization will group related functionality together.

## Proposed Folder Structure

```
LandKrypt/
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── tailwind.config.js
├── .env.example
├── .env
├── .gitignore
├── SCRIPT_DOCUMENTATION.md
├── FOLDER_STRUCTURE.md
│
├── contracts/                          # Smart contract related files
│   ├── scripts/                        # Contract deployment and management scripts
│   │   ├── deploy-contracts.js
│   │   ├── setup-staking.js
│   │   ├── stake-management.js
│   │   ├── mint-nfts.js
│   │   ├── verify-contracts.js
│   │   └── contract-utils.js
│   │
│   ├── artifacts/                      # Compiled contract artifacts
│   │   └── contracts/
│   │       ├── NFTContract.sol/
│   │       ├── TokenContract.sol/
│   │       └── StakingContract.sol/
│   │
│   ├── cache/                          # Hardhat cache
│   └── typechain-types/                # Generated TypeScript types
│
├── scripts/                            # General utility and management scripts
│   ├── database/                       # Database management scripts
│   │   ├── database-access.js
│   │   ├── store-complete-nft-data.js
│   │   ├── store-marketplace-listings.js
│   │   ├── backup-database.js
│   │   ├── migrate-database.js
│   │   └── seed-database.js
│   │
│   ├── metadata/                       # NFT metadata generation scripts
│   │   ├── generate-nft-metadata.js
│   │   ├── upload-to-ipfs.js
│   │   ├── validate-metadata.js
│   │   └── metadata-utils.js
│   │
│   ├── deployment/                     # General deployment scripts
│   │   ├── deploy-frontend.js
│   │   ├── setup-environment.js
│   │   ├── validate-deployment.js
│   │   └── health-check.js
│   │
│   └── maintenance/                    # Maintenance and monitoring scripts
│       ├── monitor-contracts.js
│       ├── update-listings.js
│       ├── cleanup-data.js
│       └── performance-check.js
│
├── data/                              # Data storage directory
│   ├── json/                          # JSON data files
│   │   ├── marketplace-listings.json
│   │   ├── nft-metadata.json
│   │   ├── staking-data.json
│   │   └── categorized-listings.json
│   │
│   ├── backups/                       # Data backups
│   │   ├── daily/
│   │   ├── weekly/
│   │   └── manual/
│   │
│   └── exports/                       # Data exports
│       ├── csv/
│       └── reports/
│
├── src/                               # Frontend source code
│   ├── app/                          # Next.js app directory
│   │   ├── globals.css
│   │   ├── layout.js
│   │   ├── page.js
│   │   │
│   │   ├── marketplace/              # Marketplace pages
│   │   │   ├── page.jsx
│   │   │   └── [id]/
│   │   │       └── page.jsx
│   │   │
│   │   ├── staking/                  # Staking pages
│   │   │   └── page.jsx
│   │   │
│   │   ├── profile/                  # User profile pages
│   │   │   └── page.jsx
│   │   │
│   │   └── api/                      # API routes
│   │       ├── nft/
│   │       ├── staking/
│   │       └── marketplace/
│   │
│   ├── components/                    # React components
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Card.jsx
│   │   │
│   │   ├── marketplace/              # Marketplace-specific components
│   │   │   ├── NFTCard.jsx
│   │   │   ├── PropertyDetailPage.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   └── VotingModal.jsx
│   │   │
│   │   ├── staking/                  # Staking-specific components
│   │   │   ├── StakingPanel.jsx
│   │   │   ├── RewardsDisplay.jsx
│   │   │   └── StakingHistory.jsx
│   │   │
│   │   ├── wallet/                   # Wallet connection components
│   │   │   ├── WalletConnector.jsx
│   │   │   ├── NetworkSwitcher.jsx
│   │   │   └── WalletStatus.jsx
│   │   │
│   │   └── layout/                   # Layout components
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── Sidebar.jsx
│   │       └── Navigation.jsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── blockchain/               # Blockchain interaction hooks
│   │   │   ├── useContractOperations.js
│   │   │   ├── useContractInteraction.js
│   │   │   ├── useStaking.js
│   │   │   └── useNFTData.js
│   │   │
│   │   ├── data/                     # Data fetching hooks
│   │   │   ├── useMarketplaceData.js
│   │   │   ├── useUserData.js
│   │   │   └── useMetadata.js
│   │   │
│   │   └── utils/                    # Utility hooks
│   │       ├── useLocalStorage.js
│   │       ├── useDebounce.js
│   │       └── useToast.js
│   │
│   ├── lib/                          # Utility libraries and configurations
│   │   ├── blockchain/               # Blockchain utilities
│   │   │   ├── wagmi-config.js
│   │   │   ├── contract-utils.js
│   │   │   ├── network-config.js
│   │   │   └── abi/
│   │   │       ├── NFTContract.json
│   │   │       ├── TokenContract.json
│   │   │       └── StakingContract.json
│   │   │
│   │   ├── database/                 # Database utilities
│   │   │   ├── supabase.js
│   │   │   ├── queries.js
│   │   │   └── schema.sql
│   │   │
│   │   ├── storage/                  # Storage utilities
│   │   │   ├── ipfs.js
│   │   │   ├── local-storage.js
│   │   │   └── file-utils.js
│   │   │
│   │   └── utils/                    # General utilities
│   │       ├── formatting.js
│   │       ├── validation.js
│   │       ├── constants.js
│   │       └── helpers.js
│   │
│   └── styles/                       # Styling files
│       ├── globals.css
│       ├── components.css
│       └── utilities.css
│
├── public/                           # Static assets
│   ├── images/                       # Image assets
│   │   ├── nft/
│   │   ├── icons/
│   │   └── ui/
│   │
│   ├── favicon.ico
│   └── manifest.json
│
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   ├── development/                  # Development guides
│   └── user/                         # User guides
│
├── tests/                            # Test files
│   ├── contracts/                    # Smart contract tests
│   ├── components/                   # Component tests
│   ├── hooks/                        # Hook tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
│
├── config/                           # Configuration files
│   ├── hardhat.config.js
│   ├── jest.config.js
│   ├── eslint.config.js
│   └── deployment/
│       ├── localhost.json
│       ├── testnet.json
│       └── mainnet.json
│
└── tools/                            # Development tools and utilities
    ├── generators/                   # Code generators
    ├── validators/                   # Validation tools
    └── monitoring/                   # Monitoring tools
```

## Migration Plan

### Phase 1: Core Structure Setup
1. Create the main directory structure
2. Move existing files to appropriate locations
3. Update import paths in all files
4. Test that the application still works

### Phase 2: Script Organization
1. Move all deployment scripts to `contracts/scripts/`
2. Move database scripts to `scripts/database/`
3. Move metadata scripts to `scripts/metadata/`
4. Update script documentation with new paths

### Phase 3: Frontend Organization
1. Reorganize components by feature
2. Extract utility functions to `lib/`
3. Organize hooks by category
4. Update all import statements

### Phase 4: Configuration and Documentation
1. Move configuration files to `config/`
2. Create comprehensive documentation in `docs/`
3. Set up testing structure in `tests/`
4. Add development tools in `tools/`

## File Movement Commands

Here are the specific commands to reorganize the current structure:

```bash
# Create directory structure
mkdir -p contracts/scripts contracts/artifacts contracts/cache
mkdir -p scripts/{database,metadata,deployment,maintenance}
mkdir -p data/{json,backups,exports}
mkdir -p src/components/{ui,marketplace,staking,wallet,layout}
mkdir -p src/hooks/{blockchain,data,utils}
mkdir -p src/lib/{blockchain,database,storage,utils}
mkdir -p src/lib/blockchain/abi
mkdir -p docs/{api,deployment,development,user}
mkdir -p tests/{contracts,components,hooks,integration,e2e}
mkdir -p config/deployment
mkdir -p tools/{generators,validators,monitoring}

# Move contract-related scripts
mv deploy-contracts.js contracts/scripts/
mv setup-staking.js contracts/scripts/
mv mint-nfts.js contracts/scripts/

# Move database scripts
mv database-access.js scripts/database/
mv store-complete-nft-data.js scripts/database/
mv store-marketplace-listings.js scripts/database/

# Move metadata scripts
mv generate-nft-metadata.js scripts/metadata/

# Move data files
mv marketplace-listings.json data/json/
mv *.json data/json/ 2>/dev/null || true

# Move frontend files (if they exist in root)
mv useContractOperations.js src/hooks/blockchain/ 2>/dev/null || true
mv useContractInteraction.js src/hooks/blockchain/ 2>/dev/null || true

# Move configuration files
mv hardhat.config.js config/ 2>/dev/null || true
```

## Benefits of This Structure

### 1. **Improved Navigation**
- Clear separation of concerns
- Easy to find related files
- Logical grouping by functionality

### 2. **Better Maintainability**
- Related files are co-located
- Easier to refactor and update
- Clear ownership of components

### 3. **Enhanced Collaboration**
- Team members can work on specific areas
- Clear separation between frontend and backend
- Easier to onboard new developers

### 4. **Scalability**
- Structure supports project growth
- Easy to add new features
- Clear patterns for new components

### 5. **Development Workflow**
- Separated concerns for different types of work
- Clear distinction between source and generated files
- Better support for automated tools

## Configuration Updates Required

After reorganization, update these configuration files:

### `package.json`
```json
{
  "scripts": {
    "deploy:contracts": "hardhat run contracts/scripts/deploy-contracts.js",
    "deploy:localhost": "hardhat run contracts/scripts/deploy-contracts.js --network localhost",
    "setup:staking": "node contracts/scripts/setup-staking.js",
    "mint:nfts": "node contracts/scripts/mint-nfts.js",
    "update:data": "node scripts/database/store-complete-nft-data.js",
    "update:listings": "node scripts/database/store-marketplace-listings.js",
    "generate:metadata": "node scripts/metadata/generate-nft-metadata.js"
  }
}
```

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Update any path references if needed
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
```

### `hardhat.config.js` (if moving to config/)
```javascript
// Update paths to contract files if needed
module.exports = {
  solidity: "0.8.19",
  paths: {
    sources: "./contracts",
    tests: "./tests/contracts",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts"
  },
  // ... rest of configuration
}
```

## Import Path Updates

After reorganization, update import statements:

**Frontend Components:**
```javascript
// Old
import { useContractOperations } from '../useContractOperations';

// New
import { useContractOperations } from '@/hooks/blockchain/useContractOperations';
```

**Database Scripts:**
```javascript
// Old
const { storeNFTData } = require('./database-access');

// New
const { storeNFTData } = require('../database/database-access');
```

**Contract ABIs:**
```javascript
// Old
import NFTContract from './NFTContract.json';

// New
import NFTContract from '@/lib/blockchain/abi/NFTContract.json';
```

## Additional Recommendations

### 1. **Environment Configuration**
- Create environment-specific config files in `config/deployment/`
- Use consistent environment variable naming
- Document all required environment variables

### 2. **Documentation Structure**
- API documentation for all contract functions
- Development setup guides
- Deployment procedures
- User guides for the frontend

### 3. **Testing Organization**
- Unit tests for all components and hooks
- Integration tests for contract interactions
- End-to-end tests for user workflows

### 4. **Development Tools**
- Code generators for repetitive tasks
- Validation tools for data integrity
- Monitoring tools for contract events

This structure provides a solid foundation for the LandKrypt project that will scale with your needs and make development more efficient.
