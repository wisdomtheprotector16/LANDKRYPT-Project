// Demo Deployment Script - Creates mock deployment for frontend demonstration
// This creates a simulated deployment without requiring actual contract compilation

const fs = require('fs');
const path = require('path');

async function createMockDeployment() {
  console.log('🎭 Creating Mock Deployment for Frontend Demo...\n');

  // Generate mock contract addresses (deterministic for consistency)
  const mockAddresses = {
    gasOptimizedNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    enhancedMarketplace: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    advancedStaking: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    quadraticGovernance: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    mockToken: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  };

  const mockAccounts = {
    deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    admin: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    minter: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    pauser: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    feeRecipient: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  };

  console.log('📦 Mock Contract Addresses:');
  console.log('='.repeat(50));
  Object.entries(mockAddresses).forEach(([name, address]) => {
    console.log(`${name.padEnd(25)}: ${address}`);
  });

  // Create deployment info
  const deploymentInfo = {
    network: 'localhost',
    chainId: 31337,
    timestamp: new Date().toISOString(),
    deployer: mockAccounts.deployer,
    contracts: mockAddresses,
    accounts: mockAccounts,
    status: 'mock_deployment',
    note: 'This is a mock deployment for frontend demonstration'
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, 'localhost-enhanced.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Mock deployment info saved to:', deploymentPath);

  // Create environment file for frontend
  const envContent = `# Enhanced LandKrypt Contract Addresses (Mock Deployment)
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Enhanced Contract Addresses
NEXT_PUBLIC_GAS_OPTIMIZED_NFT=${mockAddresses.gasOptimizedNFT}
NEXT_PUBLIC_ENHANCED_MARKETPLACE=${mockAddresses.enhancedMarketplace}
NEXT_PUBLIC_ADVANCED_STAKING=${mockAddresses.advancedStaking}
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=${mockAddresses.quadraticGovernance}
NEXT_PUBLIC_MOCK_ERC20=${mockAddresses.mockToken}

# Original Contract Addresses (for compatibility)
NEXT_PUBLIC_REAL_ESTATE_NFT=${mockAddresses.gasOptimizedNFT}
NEXT_PUBLIC_NFT_MARKETPLACE=${mockAddresses.enhancedMarketplace}
NEXT_PUBLIC_NFT_STAKING=${mockAddresses.advancedStaking}
NEXT_PUBLIC_NFT_DAO=${mockAddresses.quadraticGovernance}
NEXT_PUBLIC_LAND_KRYPT_STABLE_COIN=${mockAddresses.mockToken}

# Test Accounts
NEXT_PUBLIC_DEPLOYER_ADDRESS=${mockAccounts.deployer}
NEXT_PUBLIC_ADMIN_ADDRESS=${mockAccounts.admin}
NEXT_PUBLIC_MINTER_ADDRESS=${mockAccounts.minter}

# Demo Mode
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_MOCK_DEPLOYMENT=true
`;

  const envPath = path.join(__dirname, '../.env.local');
  fs.writeFileSync(envPath, envContent);
  console.log('💾 Environment file created at:', envPath);

  // Create mock data for frontend
  const mockData = {
    nfts: [
      {
        id: 0,
        name: 'Lagos Premium Villa',
        description: 'Luxury 4-bedroom villa in Victoria Island, Lagos',
        image: '/api/placeholder/400/300',
        price: '2.5',
        currency: 'ETH',
        owner: mockAccounts.deployer,
        propertyType: 1,
        location: 1,
        rarity: 3,
        attributes: {
          bedrooms: 4,
          bathrooms: 3,
          area: '350 sqm',
          yearBuilt: 2022
        },
        royalty: 2.5,
        listed: true,
        listingType: 'fixed_price'
      },
      {
        id: 1,
        name: 'Abuja Commercial Complex',
        description: 'Modern commercial building in Central Business District',
        image: '/api/placeholder/400/300',
        price: '5.0',
        currency: 'ETH',
        owner: mockAccounts.admin,
        propertyType: 3,
        location: 2,
        rarity: 4,
        attributes: {
          floors: 8,
          offices: 24,
          area: '2500 sqm',
          yearBuilt: 2023
        },
        royalty: 3.0,
        listed: true,
        listingType: 'dutch_auction',
        startPrice: '5.0',
        endPrice: '3.0',
        currentPrice: '4.2'
      },
      {
        id: 2,
        name: 'Port Harcourt Apartment',
        description: '2-bedroom apartment in GRA Phase 2',
        image: '/api/placeholder/400/300',
        price: '1.8',
        currency: 'ETH',
        owner: mockAccounts.minter,
        propertyType: 2,
        location: 4,
        rarity: 2,
        attributes: {
          bedrooms: 2,
          bathrooms: 2,
          area: '120 sqm',
          yearBuilt: 2021
        },
        royalty: 2.0,
        listed: false
      }
    ],
    marketplace: {
      totalListings: 15,
      totalVolume: '45.7',
      averagePrice: '2.8',
      activeAuctions: 3
    },
    staking: {
      totalStaked: '125000',
      totalRewards: '8750',
      apy: 12.5,
      userStaked: '2500',
      userRewards: '175'
    },
    governance: {
      totalProposals: 8,
      activeProposals: 2,
      totalVotes: 1250,
      userVotingPower: 850
    },
    user: {
      address: mockAccounts.deployer,
      tier: 3,
      xp: 2750,
      nftsOwned: 5,
      totalStaked: '2500',
      marketplaceTransactions: 12,
      governanceParticipation: 6,
      gasSaved: 15420
    }
  };

  const mockDataPath = path.join(__dirname, '../src/data/mockData.json');
  const mockDataDir = path.dirname(mockDataPath);
  if (!fs.existsSync(mockDataDir)) {
    fs.mkdirSync(mockDataDir, { recursive: true });
  }
  fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));
  console.log('💾 Mock data created at:', mockDataPath);

  console.log('\n🎉 Mock deployment completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the frontend: npm run dev');
  console.log('2. The app will run in demo mode with mock data');
  console.log('3. All enhanced features will be visible and interactive');
  console.log('4. No blockchain connection required for demo');

  return {
    addresses: mockAddresses,
    accounts: mockAccounts,
    deploymentPath,
    envPath,
    mockDataPath
  };
}

// Execute mock deployment
if (require.main === module) {
  createMockDeployment()
    .then(() => {
      console.log('\n✅ Mock deployment setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Mock deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { createMockDeployment };
