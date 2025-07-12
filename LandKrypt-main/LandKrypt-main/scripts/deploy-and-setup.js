// Simple Deployment and Setup Script for LandKrypt
// Deploys contracts, mints NFTs, and updates environment files

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting LandKrypt Deployment and Setup...\n');

  // Get signers
  const [deployer, admin, minter, user1, user2] = await ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const deployedContracts = {};

  try {
    // 1. Deploy Mock ERC20 for testing
    console.log('📄 Deploying MockERC20...');
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy("LandKrypt Test Token", "LKTT", ethers.parseEther("1000000"));
    await mockERC20.waitForDeployment();
    deployedContracts.mockERC20 = await mockERC20.getAddress();
    console.log(`✅ MockERC20: ${deployedContracts.mockERC20}`);

    // 2. Deploy Gas Optimized NFT
    console.log('📄 Deploying GasOptimizedNFT...');
    const GasOptimizedNFT = await ethers.getContractFactory("GasOptimizedNFT");
    const gasOptimizedNFT = await GasOptimizedNFT.deploy(
      "LandKrypt Enhanced NFT",
      "LKNFT",
      "https://api.landkrypt.com/metadata/",
      admin.address,
      minter.address
    );
    await gasOptimizedNFT.waitForDeployment();
    deployedContracts.gasOptimizedNFT = await gasOptimizedNFT.getAddress();
    console.log(`✅ GasOptimizedNFT: ${deployedContracts.gasOptimizedNFT}`);

    // 3. Deploy Enhanced Marketplace
    console.log('📄 Deploying EnhancedMarketplace...');
    const EnhancedMarketplace = await ethers.getContractFactory("EnhancedMarketplace");
    const enhancedMarketplace = await EnhancedMarketplace.deploy(250, admin.address);
    await enhancedMarketplace.waitForDeployment();
    deployedContracts.enhancedMarketplace = await enhancedMarketplace.getAddress();
    console.log(`✅ EnhancedMarketplace: ${deployedContracts.enhancedMarketplace}`);

    // 4. Deploy Advanced Staking
    console.log('📄 Deploying AdvancedStaking...');
    const AdvancedStaking = await ethers.getContractFactory("AdvancedStaking");
    const advancedStaking = await AdvancedStaking.deploy(
      deployedContracts.mockERC20,
      deployedContracts.gasOptimizedNFT,
      admin.address
    );
    await advancedStaking.waitForDeployment();
    deployedContracts.advancedStaking = await advancedStaking.getAddress();
    console.log(`✅ AdvancedStaking: ${deployedContracts.advancedStaking}`);

    // 5. Deploy Quadratic Governance
    console.log('📄 Deploying QuadraticGovernance...');
    const QuadraticGovernance = await ethers.getContractFactory("QuadraticGovernance");
    const quadraticGovernance = await QuadraticGovernance.deploy(
      deployedContracts.mockERC20,
      deployedContracts.gasOptimizedNFT,
      604800, // 7 days
      admin.address
    );
    await quadraticGovernance.waitForDeployment();
    deployedContracts.quadraticGovernance = await quadraticGovernance.getAddress();
    console.log(`✅ QuadraticGovernance: ${deployedContracts.quadraticGovernance}`);

    // 6. Deploy Oracle
    console.log('📄 Deploying Oracle...');
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy("0x694AA1769357215DE4FAC081bf1f309aDC325306");
    await oracle.waitForDeployment();
    deployedContracts.oracle = await oracle.getAddress();
    console.log(`✅ Oracle: ${deployedContracts.oracle}`);

    console.log('\n🔗 Setting up contract relationships...');

    // Setup marketplace approval
    await gasOptimizedNFT.connect(admin).setApprovalForAll(deployedContracts.enhancedMarketplace, true);
    console.log('✅ Marketplace approval set');

    // Grant staking role
    const STAKER_ROLE = await gasOptimizedNFT.STAKER_ROLE();
    await gasOptimizedNFT.connect(admin).grantRole(STAKER_ROLE, deployedContracts.advancedStaking);
    console.log('✅ Staking role granted');

    // Grant governance role
    const GOVERNANCE_ROLE = await gasOptimizedNFT.GOVERNANCE_ROLE();
    await gasOptimizedNFT.connect(admin).grantRole(GOVERNANCE_ROLE, deployedContracts.quadraticGovernance);
    console.log('✅ Governance role granted');

    console.log('\n🎨 Minting 5 NFTs...');

    const nftImages = [
      'property1.jpg',
      'property2.jpg', 
      'villa1.jpg',
      'apartment1.jpg',
      'land1.jpg'
    ];

    for (let i = 0; i < 5; i++) {
      const tokenURI = `https://gateway.pinata.cloud/ipfs/QmYourHashHere/${nftImages[i]}`;
      await gasOptimizedNFT.connect(minter).safeMint(deployer.address, tokenURI);
      console.log(`✅ Minted NFT ${i + 1}: ${nftImages[i]}`);
    }

    console.log('\n🏪 Setting up marketplace listings...');

    // Approve marketplace to transfer NFTs
    await gasOptimizedNFT.connect(deployer).setApprovalForAll(deployedContracts.enhancedMarketplace, true);

    // List NFT #1 and #2
    const listingPrice = ethers.parseEther("1.0");
    for (let tokenId = 1; tokenId <= 2; tokenId++) {
      await enhancedMarketplace.connect(deployer).createListing(
        deployedContracts.gasOptimizedNFT,
        tokenId,
        listingPrice,
        0, // Fixed price
        Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days
      );
      console.log(`✅ Listed NFT #${tokenId} for ${ethers.formatEther(listingPrice)} ETH`);
    }

    console.log('\n🧪 Testing staking functionality...');

    // Mint tokens to deployer for staking
    const stakeAmount = ethers.parseEther("100");
    await mockERC20.connect(deployer).mint(deployer.address, stakeAmount);
    
    // Approve and stake
    await mockERC20.connect(deployer).approve(deployedContracts.advancedStaking, stakeAmount);
    await advancedStaking.connect(deployer).stakeTokens(stakeAmount);
    console.log('✅ Staking test successful');

    console.log('\n🗳️ Testing governance functionality...');

    // Create test proposal
    await quadraticGovernance.connect(deployer).createProposal(
      "Test Proposal",
      "This is a test proposal for deployment verification"
    );
    console.log('✅ Governance test successful');

    console.log('\n📝 Updating environment files...');

    const envUpdates = {
      // Enhanced contracts
      NEXT_PUBLIC_GAS_OPTIMIZED_NFT: deployedContracts.gasOptimizedNFT,
      NEXT_PUBLIC_ENHANCED_MARKETPLACE: deployedContracts.enhancedMarketplace,
      NEXT_PUBLIC_ADVANCED_STAKING: deployedContracts.advancedStaking,
      NEXT_PUBLIC_QUADRATIC_GOVERNANCE: deployedContracts.quadraticGovernance,
      NEXT_PUBLIC_ORACLE: deployedContracts.oracle,
      NEXT_PUBLIC_MOCK_ERC20: deployedContracts.mockERC20,
      
      // Deployment info
      NEXT_PUBLIC_DEPLOYMENT_NETWORK: "localhost",
      NEXT_PUBLIC_DEPLOYMENT_DATE: new Date().toISOString(),
      NEXT_PUBLIC_DEPLOYER_ADDRESS: deployer.address,
      NEXT_PUBLIC_RECIPIENT_ADDRESS: deployer.address
    };

    // Update .env.local
    await updateEnvFile('.env.local', envUpdates);
    
    // Update .env.production
    await updateEnvFile('.env.production', envUpdates);

    console.log('✅ Environment files updated');

    console.log('\n📊 Saving deployment info...');

    const deploymentInfo = {
      network: "localhost",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts,
      nftsMinted: 5,
      marketplaceListings: 2,
      status: 'SUCCESS'
    };

    // Save deployment info
    const deploymentPath = path.join(__dirname, '../deployments/latest-deployment.json');
    fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment info saved: ${deploymentPath}`);

    console.log('\n🎉 Deployment and Setup Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Contracts deployed: ${Object.keys(deployedContracts).length}`);
    console.log(`   • NFTs minted: 5`);
    console.log(`   • Marketplace listings: 2`);
    console.log(`   • Staking tested: ✅`);
    console.log(`   • Governance tested: ✅`);
    console.log(`   • Environment files updated: ✅`);

    console.log('\n🔗 Contract Addresses:');
    for (const [name, address] of Object.entries(deployedContracts)) {
      console.log(`   ${name}: ${address}`);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  }
}

async function updateEnvFile(filename, updates) {
  const envPath = path.join(__dirname, '..', filename);
  
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add each environment variable
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`   📝 Updated ${filename}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to update ${filename}:`, error.message);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
