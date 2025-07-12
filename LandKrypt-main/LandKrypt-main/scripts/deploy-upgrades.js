// Deploy Upgrades Script
// Deploys all upgrade contracts to localhost for testing

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying LandKrypt Upgrades to localhost...\n');

  const [deployer, admin, minter, pauser, feeRecipient] = await ethers.getSigners();
  
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  const deployedContracts = {};

  try {
    // 1. Deploy Mock Contracts for Testing
    console.log('📦 Deploying Mock Contracts...');
    
    // Mock ERC20 Token
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20.deploy(
      'LandKrypt Test Token',
      'LKTEST',
      ethers.utils.parseEther('1000000')
    );
    await mockToken.deployed();
    console.log('✅ MockERC20 deployed to:', mockToken.address);
    deployedContracts.mockToken = mockToken.address;

    // Mock NFT
    const MockNFT = await ethers.getContractFactory('MockNFT');
    const mockNFT = await MockNFT.deploy('Test Property NFT', 'TPROP');
    await mockNFT.deployed();
    console.log('✅ MockNFT deployed to:', mockNFT.address);
    deployedContracts.mockNFT = mockNFT.address;

    // Mock Royalty NFT
    const MockRoyaltyNFT = await ethers.getContractFactory('MockRoyaltyNFT');
    const mockRoyaltyNFT = await MockRoyaltyNFT.deploy('Test Royalty NFT', 'TRNFT');
    await mockRoyaltyNFT.deployed();
    console.log('✅ MockRoyaltyNFT deployed to:', mockRoyaltyNFT.address);
    deployedContracts.mockRoyaltyNFT = mockRoyaltyNFT.address;

    // Mock Access Control
    const MockAccessControl = await ethers.getContractFactory('MockAccessControl');
    const mockAccessControl = await MockAccessControl.deploy();
    await mockAccessControl.deployed();
    console.log('✅ MockAccessControl deployed to:', mockAccessControl.address);
    deployedContracts.mockAccessControl = mockAccessControl.address;

    console.log('\n🔧 Deploying Upgrade Contracts...');

    // 2. Deploy Gas Optimized NFT
    const GasOptimizedNFT = await ethers.getContractFactory('GasOptimizedNFT');
    const gasOptimizedNFT = await GasOptimizedNFT.deploy(
      'LandKrypt Property Optimized',
      'LKPROP',
      deployer.address
    );
    await gasOptimizedNFT.deployed();
    console.log('✅ GasOptimizedNFT deployed to:', gasOptimizedNFT.address);
    deployedContracts.gasOptimizedNFT = gasOptimizedNFT.address;

    // Grant minter role
    const MINTER_ROLE = await gasOptimizedNFT.MINTER_ROLE();
    await gasOptimizedNFT.grantRole(MINTER_ROLE, minter.address);
    console.log('   - Granted MINTER_ROLE to:', minter.address);

    // 3. Deploy Enhanced Marketplace
    const EnhancedMarketplace = await ethers.getContractFactory('EnhancedMarketplace');
    const enhancedMarketplace = await EnhancedMarketplace.deploy(feeRecipient.address);
    await enhancedMarketplace.deployed();
    console.log('✅ EnhancedMarketplace deployed to:', enhancedMarketplace.address);
    deployedContracts.enhancedMarketplace = enhancedMarketplace.address;

    // Configure marketplace
    await enhancedMarketplace.setSupportedNFT(gasOptimizedNFT.address, true);
    await enhancedMarketplace.setSupportedNFT(mockNFT.address, true);
    await enhancedMarketplace.setSupportedNFT(mockRoyaltyNFT.address, true);
    await enhancedMarketplace.setSupportedToken(mockToken.address, true);
    await enhancedMarketplace.setSupportedToken(ethers.constants.AddressZero, true); // ETH
    console.log('   - Configured supported NFTs and tokens');

    // 4. Deploy Advanced Staking
    const AdvancedStaking = await ethers.getContractFactory('AdvancedStaking');
    const rewardPerBlock = ethers.utils.parseEther('1'); // 1 token per block
    const startBlock = await ethers.provider.getBlockNumber();
    const bonusEndBlock = startBlock + 1000; // Bonus for 1000 blocks

    const advancedStaking = await AdvancedStaking.deploy(
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
    const QuadraticGovernance = await ethers.getContractFactory('QuadraticGovernance');
    const quadraticGovernance = await QuadraticGovernance.deploy(
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
    await gasOptimizedNFT.connect(minter).mint(
      deployer.address,
      'ipfs://QmTestHash1',
      {
        price: ethers.utils.parseEther('2.5'),
        propertyType: 1,
        location: 1,
        rarity: 3,
        attributes: 0x1234,
        timestamp: Math.floor(Date.now() / 1000)
      },
      250 // 2.5% royalty
    );

    await gasOptimizedNFT.connect(minter).mint(
      admin.address,
      'ipfs://QmTestHash2',
      {
        price: ethers.utils.parseEther('1.8'),
        propertyType: 2,
        location: 2,
        rarity: 2,
        attributes: 0x5678,
        timestamp: Math.floor(Date.now() / 1000)
      },
      300 // 3% royalty
    );

    console.log('✅ Minted test NFTs');

    // Distribute test tokens
    await mockToken.transfer(admin.address, ethers.utils.parseEther('10000'));
    await mockToken.transfer(minter.address, ethers.utils.parseEther('10000'));
    await mockToken.transfer(pauser.address, ethers.utils.parseEther('10000'));
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

    const deploymentPath = path.join(__dirname, '../deployments/localhost-upgrades.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to:', deploymentPath);

    console.log('\n🧪 Running basic functionality tests...');
    await runBasicTests(deployedContracts, { deployer, admin, minter, mockToken, gasOptimizedNFT, enhancedMarketplace });

    console.log('\n🎉 All upgrades deployed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run comprehensive tests: npm run test:upgrades');
    console.log('2. Test gas optimizations: npm run test:gas');
    console.log('3. Verify core functionality: npm run test:core');

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

    // Test 5: Access Control
    console.log('  🧪 Testing access control...');
    const MINTER_ROLE = await gasOptimizedNFT.MINTER_ROLE();
    const hasMinterRole = await gasOptimizedNFT.hasRole(MINTER_ROLE, minter.address);
    console.log(`     ✅ Minter has MINTER_ROLE: ${hasMinterRole}`);

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
