// Simple Deployment Script for Enhanced Contracts
// Deploys contracts without requiring additional dependencies

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying LandKrypt Enhanced Contracts...\n');

  const [deployer, admin, minter, pauser, feeRecipient] = await ethers.getSigners();
  
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  const deployedContracts = {};

  try {
    // 1. Deploy Mock ERC20 Token for testing
    console.log('📦 Deploying Mock ERC20 Token...');
    
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20Factory.deploy(
      'LandKrypt Test Token',
      'LKTEST',
      ethers.utils.parseEther('1000000')
    );
    await mockToken.deployed();
    console.log('✅ MockERC20 deployed to:', mockToken.address);
    deployedContracts.mockToken = mockToken.address;

    // 2. Deploy Gas Optimized NFT
    console.log('\n📦 Deploying Gas Optimized NFT...');
    
    const GasOptimizedNFTFactory = await ethers.getContractFactory('GasOptimizedNFT');
    const gasOptimizedNFT = await GasOptimizedNFTFactory.deploy(
      'LandKrypt Property Enhanced',
      'LKPROP',
      deployer.address
    );
    await gasOptimizedNFT.deployed();
    console.log('✅ GasOptimizedNFT deployed to:', gasOptimizedNFT.address);
    deployedContracts.gasOptimizedNFT = gasOptimizedNFT.address;

    // Grant minter role
    const MINTER_ROLE = await gasOptimizedNFT.MINTER_ROLE();
    await gasOptimizedNFT.grantRole(MINTER_ROLE, minter.address);
    await gasOptimizedNFT.grantRole(MINTER_ROLE, deployer.address);
    console.log('   - Granted MINTER_ROLE to:', minter.address);

    // 3. Deploy Enhanced Marketplace
    console.log('\n📦 Deploying Enhanced Marketplace...');
    
    const EnhancedMarketplaceFactory = await ethers.getContractFactory('EnhancedMarketplace');
    const enhancedMarketplace = await EnhancedMarketplaceFactory.deploy(feeRecipient.address);
    await enhancedMarketplace.deployed();
    console.log('✅ EnhancedMarketplace deployed to:', enhancedMarketplace.address);
    deployedContracts.enhancedMarketplace = enhancedMarketplace.address;

    // Configure marketplace
    await enhancedMarketplace.setSupportedNFT(gasOptimizedNFT.address, true);
    await enhancedMarketplace.setSupportedToken(mockToken.address, true);
    await enhancedMarketplace.setSupportedToken(ethers.constants.AddressZero, true); // ETH
    console.log('   - Configured supported NFTs and tokens');

    // 4. Deploy Advanced Staking
    console.log('\n📦 Deploying Advanced Staking...');
    
    const AdvancedStakingFactory = await ethers.getContractFactory('AdvancedStaking');
    const rewardPerBlock = ethers.utils.parseEther('1'); // 1 token per block
    const startBlock = await ethers.provider.getBlockNumber();
    const bonusEndBlock = startBlock + 1000; // Bonus for 1000 blocks

    const advancedStaking = await AdvancedStakingFactory.deploy(
      mockToken.address, // Reward token
      rewardPerBlock,
      startBlock,
      bonusEndBlock,
      feeRecipient.address
    );
    await advancedStaking.deployed();
    console.log('✅ AdvancedStaking deployed to:', advancedStaking.address);
    deployedContracts.advancedStaking = advancedStaking.address;

    // Add staking pool
    await advancedStaking.addPool(
      100, // Allocation points
      mockToken.address, // Staking token
      ethers.utils.parseEther('1'), // Min stake amount
      7 * 24 * 60 * 60, // Lock period (7 days)
      false // Don't update other pools
    );
    console.log('   - Added staking pool for mock token');

    // 5. Deploy Quadratic Governance
    console.log('\n📦 Deploying Quadratic Governance...');
    
    const QuadraticGovernanceFactory = await ethers.getContractFactory('QuadraticGovernance');
    const quadraticGovernance = await QuadraticGovernanceFactory.deploy(
      mockToken.address, // Governance token
      gasOptimizedNFT.address, // Governance NFT
      advancedStaking.address, // Staking contract
      deployer.address // Tier contract (placeholder)
    );
    await quadraticGovernance.deployed();
    console.log('✅ QuadraticGovernance deployed to:', quadraticGovernance.address);
    deployedContracts.quadraticGovernance = quadraticGovernance.address;

    console.log('\n🎯 Setting up test data...');

    // Mint some test NFTs
    const propertyData1 = {
      price: ethers.utils.parseEther('2.5'),
      propertyType: 1,
      location: 1,
      rarity: 3,
      attributes: 0x1234,
      timestamp: Math.floor(Date.now() / 1000)
    };

    await gasOptimizedNFT.mint(
      deployer.address,
      'ipfs://QmTestHash1',
      propertyData1,
      250 // 2.5% royalty
    );

    const propertyData2 = {
      price: ethers.utils.parseEther('1.8'),
      propertyType: 2,
      location: 2,
      rarity: 2,
      attributes: 0x5678,
      timestamp: Math.floor(Date.now() / 1000)
    };

    await gasOptimizedNFT.mint(
      admin.address,
      'ipfs://QmTestHash2',
      propertyData2,
      300 // 3% royalty
    );

    console.log('✅ Minted test NFTs');

    // Distribute test tokens
    await mockToken.transfer(admin.address, ethers.utils.parseEther('10000'));
    await mockToken.transfer(minter.address, ethers.utils.parseEther('10000'));
    await mockToken.transfer(pauser.address, ethers.utils.parseEther('10000'));
    await mockToken.transfer(advancedStaking.address, ethers.utils.parseEther('100000')); // For rewards
    console.log('✅ Distributed test tokens');

    // Set up approvals for testing
    await gasOptimizedNFT.setApprovalForAll(enhancedMarketplace.address, true);
    await gasOptimizedNFT.connect(admin).setApprovalForAll(enhancedMarketplace.address, true);
    console.log('✅ Set NFT approvals for marketplace');

    console.log('\n📊 Deployment Summary:');
    console.log('='.repeat(50));
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(25)}: ${address}`);
    });

    // Save deployment info
    const deploymentInfo = {
      network: 'localhost',
      chainId: 31337,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts,
      accounts: {
        deployer: deployer.address,
        admin: admin.address,
        minter: minter.address,
        pauser: pauser.address,
        feeRecipient: feeRecipient.address
      }
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, 'localhost-enhanced.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to:', deploymentPath);

    // Create environment file for frontend
    const envContent = `# Enhanced LandKrypt Contract Addresses
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Enhanced Contract Addresses
NEXT_PUBLIC_GAS_OPTIMIZED_NFT=${deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_ENHANCED_MARKETPLACE=${deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_ADVANCED_STAKING=${deployedContracts.advancedStaking}
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=${deployedContracts.quadraticGovernance}
NEXT_PUBLIC_MOCK_ERC20=${deployedContracts.mockToken}

# Original Contract Addresses (for compatibility)
NEXT_PUBLIC_REAL_ESTATE_NFT=${deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_NFT_MARKETPLACE=${deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_NFT_STAKING=${deployedContracts.advancedStaking}
NEXT_PUBLIC_NFT_DAO=${deployedContracts.quadraticGovernance}
NEXT_PUBLIC_LAND_KRYPT_STABLE_COIN=${deployedContracts.mockToken}

# Test Accounts
NEXT_PUBLIC_DEPLOYER_ADDRESS=${deployer.address}
NEXT_PUBLIC_ADMIN_ADDRESS=${admin.address}
NEXT_PUBLIC_MINTER_ADDRESS=${minter.address}
`;

    const envPath = path.join(__dirname, '../.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Environment file created at:', envPath);

    console.log('\n🧪 Running basic functionality tests...');
    await runBasicTests(deployedContracts, { deployer, admin, minter, mockToken, gasOptimizedNFT, enhancedMarketplace });

    console.log('\n🎉 Enhanced contracts deployed successfully!');
    console.log('\nContract Addresses:');
    console.log('==================');
    console.log(`Gas Optimized NFT:     ${deployedContracts.gasOptimizedNFT}`);
    console.log(`Enhanced Marketplace:  ${deployedContracts.enhancedMarketplace}`);
    console.log(`Advanced Staking:      ${deployedContracts.advancedStaking}`);
    console.log(`Quadratic Governance:  ${deployedContracts.quadraticGovernance}`);
    console.log(`Mock Token:            ${deployedContracts.mockToken}`);

    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Connect MetaMask to localhost:8545');
    console.log('3. Import test accounts using private keys');
    console.log('4. Explore the enhanced features!');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function runBasicTests(contracts, accounts) {
  const { deployer, admin, minter, mockToken, gasOptimizedNFT, enhancedMarketplace } = accounts;

  try {
    // Test 1: NFT Minting
    console.log('  🧪 Testing NFT minting...');
    const tokenCount = await gasOptimizedNFT.totalSupply();
    console.log(`     ✅ Total NFTs minted: ${tokenCount.toString()}`);

    // Test 2: Property Data
    console.log('  🧪 Testing property data...');
    const propertyData = await gasOptimizedNFT.getPropertyData(0);
    console.log(`     ✅ NFT #0 price: ${ethers.utils.formatEther(propertyData.price)} ETH`);

    // Test 3: Marketplace Configuration
    console.log('  🧪 Testing marketplace configuration...');
    const isNFTSupported = await enhancedMarketplace.supportedNFTs(gasOptimizedNFT.address);
    const isTokenSupported = await enhancedMarketplace.supportedTokens(mockToken.address);
    console.log(`     ✅ NFT supported: ${isNFTSupported}`);
    console.log(`     ✅ Token supported: ${isTokenSupported}`);

    // Test 4: Create a test listing
    console.log('  🧪 Testing marketplace listing...');
    const price = ethers.utils.parseEther('1.5');
    const duration = 7 * 24 * 60 * 60; // 7 days
    
    const tx = await enhancedMarketplace.createListing(
      gasOptimizedNFT.address,
      0, // Token ID
      price,
      mockToken.address,
      duration
    );
    await tx.wait();
    
    const listing = await enhancedMarketplace.listings(0);
    console.log(`     ✅ Created listing with price: ${ethers.utils.formatEther(listing.price)} tokens`);

    // Test 5: Token balances
    console.log('  🧪 Testing token distribution...');
    const deployerBalance = await mockToken.balanceOf(deployer.address);
    const adminBalance = await mockToken.balanceOf(admin.address);
    console.log(`     ✅ Deployer balance: ${ethers.utils.formatEther(deployerBalance)} LKTEST`);
    console.log(`     ✅ Admin balance: ${ethers.utils.formatEther(adminBalance)} LKTEST`);

    console.log('  ✅ All basic tests passed!');

  } catch (error) {
    console.error('  ❌ Basic test failed:', error.message);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
