// Enhanced Sepolia Deployment Script
// Deploys upgraded contracts to Sepolia, uploads images to Pinata, mints NFTs, and updates env files

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Sepolia Chainlink Price Feed Addresses
const SEPOLIA_PRICE_FEEDS = {
  ETH_USD: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  BTC_USD: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
  USDC_USD: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E',
  DAI_USD: '0x14866185B1962B63C3Ea9E03Bc1da838bab34C19'
};

// Your address for minting NFTs
const RECIPIENT_ADDRESS = '0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC';

class SepoliaEnhancedDeployer {
  constructor() {
    this.deployedContracts = {};
    this.nftData = [];
    this.deploymentInfo = null;
  }

  async deploy() {
    console.log('🚀 Starting Enhanced LandKrypt Deployment to Sepolia...\n');
    console.log('='.repeat(60));

    try {
      // Initialize deployment
      await this.initialize();
      
      // Deploy contracts
      await this.deployContracts();
      
      // Upload images and mint NFTs
      await this.uploadImagesAndMintNFTs();
      
      // Update environment files
      await this.updateEnvironmentFiles();
      
      // Generate deployment report
      await this.generateDeploymentReport();

      console.log('\n🎉 Sepolia deployment completed successfully!');
      return this.deploymentInfo;

    } catch (error) {
      console.error('\n❌ Deployment failed:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('🔧 Initializing Sepolia deployment...');
    
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;
    
    console.log('Deploying with account:', deployer.address);
    const balance = await deployer.getBalance();
    console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
      throw new Error('Insufficient ETH balance for deployment. Need at least 0.1 ETH on Sepolia.');
    }
    
    console.log('✅ Initialization complete\n');
  }

  async deployContracts() {
    console.log('📦 Deploying Enhanced Contracts to Sepolia...\n');

    // 1. Deploy Mock ERC20 Token
    console.log('1️⃣ Deploying Mock ERC20 Token...');
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20Factory.deploy(
      'LandKrypt Sepolia Token',
      'LKST',
      ethers.utils.parseEther('10000000') // 10M tokens
    );
    await mockToken.deployed();
    console.log('✅ MockERC20 deployed to:', mockToken.address);
    this.deployedContracts.mockToken = mockToken.address;

    // 2. Deploy Gas Optimized NFT
    console.log('\n2️⃣ Deploying Gas Optimized NFT...');
    const GasOptimizedNFTFactory = await ethers.getContractFactory('GasOptimizedNFT');
    const gasOptimizedNFT = await GasOptimizedNFTFactory.deploy(
      'LandKrypt Property Enhanced',
      'LKPROP',
      this.deployer.address
    );
    await gasOptimizedNFT.deployed();
    console.log('✅ GasOptimizedNFT deployed to:', gasOptimizedNFT.address);
    this.deployedContracts.gasOptimizedNFT = gasOptimizedNFT.address;

    // Grant minter role
    const MINTER_ROLE = await gasOptimizedNFT.MINTER_ROLE();
    await gasOptimizedNFT.grantRole(MINTER_ROLE, this.deployer.address);
    console.log('   - Granted MINTER_ROLE to deployer');

    // 3. Deploy Enhanced Marketplace
    console.log('\n3️⃣ Deploying Enhanced Marketplace...');
    const EnhancedMarketplaceFactory = await ethers.getContractFactory('EnhancedMarketplace');
    const enhancedMarketplace = await EnhancedMarketplaceFactory.deploy(this.deployer.address);
    await enhancedMarketplace.deployed();
    console.log('✅ EnhancedMarketplace deployed to:', enhancedMarketplace.address);
    this.deployedContracts.enhancedMarketplace = enhancedMarketplace.address;

    // Configure marketplace
    await enhancedMarketplace.setSupportedNFT(gasOptimizedNFT.address, true);
    await enhancedMarketplace.setSupportedToken(mockToken.address, true);
    await enhancedMarketplace.setSupportedToken(ethers.constants.AddressZero, true); // ETH
    console.log('   - Configured supported NFTs and tokens');

    // 4. Deploy Advanced Staking
    console.log('\n4️⃣ Deploying Advanced Staking...');
    const AdvancedStakingFactory = await ethers.getContractFactory('AdvancedStaking');
    const rewardPerBlock = ethers.utils.parseEther('0.1'); // 0.1 token per block
    const currentBlock = await ethers.provider.getBlockNumber();
    const bonusEndBlock = currentBlock + 100000; // Bonus for 100k blocks

    const advancedStaking = await AdvancedStakingFactory.deploy(
      mockToken.address,
      rewardPerBlock,
      currentBlock,
      bonusEndBlock,
      this.deployer.address
    );
    await advancedStaking.deployed();
    console.log('✅ AdvancedStaking deployed to:', advancedStaking.address);
    this.deployedContracts.advancedStaking = advancedStaking.address;

    // Add staking pools
    await advancedStaking.addPool(100, mockToken.address, ethers.utils.parseEther('10'), 0, false);
    await advancedStaking.addPool(200, gasOptimizedNFT.address, 1, 7 * 24 * 60 * 60, false);
    console.log('   - Added token and NFT staking pools');

    // 5. Deploy Quadratic Governance
    console.log('\n5️⃣ Deploying Quadratic Governance...');
    const QuadraticGovernanceFactory = await ethers.getContractFactory('QuadraticGovernance');
    const quadraticGovernance = await QuadraticGovernanceFactory.deploy(
      mockToken.address,
      gasOptimizedNFT.address,
      advancedStaking.address,
      this.deployer.address // Tier contract placeholder
    );
    await quadraticGovernance.deployed();
    console.log('✅ QuadraticGovernance deployed to:', quadraticGovernance.address);
    this.deployedContracts.quadraticGovernance = quadraticGovernance.address;

    // 6. Deploy Oracle with Sepolia price feeds
    console.log('\n6️⃣ Deploying Oracle with Sepolia Price Feeds...');
    const OracleFactory = await ethers.getContractFactory('Oracle');
    const oracle = await OracleFactory.deploy(SEPOLIA_PRICE_FEEDS.ETH_USD);
    await oracle.deployed();
    console.log('✅ Oracle deployed to:', oracle.address);
    this.deployedContracts.oracle = oracle.address;

    // Add additional price feeds
    await oracle.addPriceFeed('BTC', SEPOLIA_PRICE_FEEDS.BTC_USD);
    await oracle.addPriceFeed('USDC', SEPOLIA_PRICE_FEEDS.USDC_USD);
    await oracle.addPriceFeed('DAI', SEPOLIA_PRICE_FEEDS.DAI_USD);
    console.log('   - Added BTC, USDC, and DAI price feeds');

    // Transfer tokens for rewards
    await mockToken.transfer(advancedStaking.address, ethers.utils.parseEther('1000000'));
    console.log('   - Transferred 1M tokens to staking contract for rewards');

    console.log('\n✅ All contracts deployed successfully!');
  }

  async uploadImagesAndMintNFTs() {
    console.log('\n🎨 Uploading Images to Pinata and Minting NFTs...\n');

    const nftImagesDir = path.join(__dirname, '../public/nfts');
    const imageFiles = fs.readdirSync(nftImagesDir).filter(file => 
      file.match(/\.(jpg|jpeg|png|gif)$/i)
    );

    console.log(`Found ${imageFiles.length} NFT images to process`);

    const gasOptimizedNFT = await ethers.getContractAt('GasOptimizedNFT', this.deployedContracts.gasOptimizedNFT);

    for (let i = 0; i < Math.min(imageFiles.length, 5); i++) { // Limit to 5 NFTs for demo
      const imageFile = imageFiles[i];
      const imagePath = path.join(nftImagesDir, imageFile);
      const tokenId = i + 1;

      console.log(`\n🔄 Processing NFT #${tokenId}: ${imageFile}`);

      try {
        // Upload image to Pinata
        console.log('   📤 Uploading image to Pinata...');
        const imageCid = await this.uploadToPinata(imagePath, `nft-${tokenId}-${imageFile}`);
        console.log(`   ✅ Image uploaded: ipfs://${imageCid}`);

        // Generate metadata
        const metadata = this.generateNFTMetadata(tokenId, imageCid, imageFile);
        
        // Upload metadata to Pinata
        console.log('   📝 Uploading metadata to Pinata...');
        const metadataCid = await this.uploadMetadataToPinata(metadata, `metadata-${tokenId}.json`);
        console.log(`   ✅ Metadata uploaded: ipfs://${metadataCid}`);

        // Mint NFT
        console.log('   ⛓️  Minting NFT on Sepolia...');
        const propertyData = {
          price: ethers.utils.parseEther((2 + Math.random() * 3).toFixed(2)), // Random price 2-5 ETH
          propertyType: (i % 4) + 1, // Cycle through property types
          location: (i % 4) + 1, // Cycle through locations
          rarity: Math.min((i % 5) + 1, 5), // Cycle through rarities
          attributes: Math.floor(Math.random() * 0xFFFF),
          timestamp: Math.floor(Date.now() / 1000)
        };

        const tx = await gasOptimizedNFT.mint(
          RECIPIENT_ADDRESS,
          `ipfs://${metadataCid}`,
          propertyData,
          250 // 2.5% royalty
        );

        const receipt = await tx.wait();
        console.log(`   ✅ NFT #${tokenId} minted! Gas used: ${receipt.gasUsed.toString()}`);

        // Store NFT data
        this.nftData.push({
          tokenId,
          imageCid,
          metadataCid,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          propertyData,
          imageFile
        });

        // Wait between mints to avoid rate limiting
        if (i < imageFiles.length - 1) {
          console.log('   ⏳ Waiting 3 seconds before next mint...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`   ❌ Failed to process NFT #${tokenId}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully minted ${this.nftData.length} NFTs to ${RECIPIENT_ADDRESS}`);
  }

  async uploadToPinata(filePath, filename) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: filename,
      keyvalues: {
        project: 'LandKrypt-Enhanced',
        network: 'sepolia',
        type: 'nft-image'
      }
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    return response.data.IpfsHash;
  }

  async uploadMetadataToPinata(metadata, filename) {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
        }
      }
    );

    return response.data.IpfsHash;
  }

  generateNFTMetadata(tokenId, imageCid, imageFile) {
    const propertyTypes = ['Villa', 'Apartment', 'Commercial', 'Land'];
    const locations = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'];
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

    return {
      name: `LandKrypt Property #${tokenId}`,
      description: `Enhanced LandKrypt property NFT #${tokenId} with gas-optimized features and advanced marketplace capabilities.`,
      image: `ipfs://${imageCid}`,
      external_url: `https://landkrypt.com/nft/${tokenId}`,
      attributes: [
        {
          trait_type: "Property Type",
          value: propertyTypes[(tokenId - 1) % propertyTypes.length]
        },
        {
          trait_type: "Location",
          value: locations[(tokenId - 1) % locations.length]
        },
        {
          trait_type: "Rarity",
          value: rarities[Math.min((tokenId - 1) % rarities.length, 4)]
        },
        {
          trait_type: "Network",
          value: "Sepolia"
        },
        {
          trait_type: "Enhanced Features",
          value: "Gas Optimized"
        },
        {
          trait_type: "Token ID",
          value: tokenId,
          display_type: "number"
        }
      ],
      properties: {
        category: "Real Estate",
        network: "Sepolia",
        contract_type: "Enhanced NFT",
        gas_optimized: true,
        batch_mintable: true
      }
    };
  }

  async updateEnvironmentFiles() {
    console.log('\n📝 Updating Environment Files...\n');

    // Update .env.local for development
    await this.updateEnvLocal();
    
    // Create/update .env.sepolia for testnet
    await this.updateEnvSepolia();
    
    // Update .env.production template
    await this.updateEnvProduction();

    console.log('✅ Environment files updated successfully!');
  }

  async updateEnvLocal() {
    const envLocalContent = `# Enhanced LandKrypt - Sepolia Deployment
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}
NEXT_PUBLIC_ETHERSCAN_URL=https://sepolia.etherscan.io

# Enhanced Contract Addresses (Sepolia)
NEXT_PUBLIC_GAS_OPTIMIZED_NFT=${this.deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_ENHANCED_MARKETPLACE=${this.deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_ADVANCED_STAKING=${this.deployedContracts.advancedStaking}
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=${this.deployedContracts.quadraticGovernance}
NEXT_PUBLIC_ORACLE=${this.deployedContracts.oracle}
NEXT_PUBLIC_MOCK_ERC20=${this.deployedContracts.mockToken}

# Legacy Contract Addresses (for compatibility)
NEXT_PUBLIC_REAL_ESTATE_NFT=${this.deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_NFT_MARKETPLACE=${this.deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_NFT_STAKING=${this.deployedContracts.advancedStaking}
NEXT_PUBLIC_NFT_DAO=${this.deployedContracts.quadraticGovernance}
NEXT_PUBLIC_LAND_KRYPT_STABLE_COIN=${this.deployedContracts.mockToken}

# Deployment Info
NEXT_PUBLIC_DEPLOYMENT_NETWORK=sepolia
NEXT_PUBLIC_DEPLOYMENT_DATE=${new Date().toISOString()}
NEXT_PUBLIC_DEPLOYER_ADDRESS=${this.deployer.address}
NEXT_PUBLIC_RECIPIENT_ADDRESS=${RECIPIENT_ADDRESS}

# Feature Flags
NEXT_PUBLIC_ENHANCED_FEATURES=true
NEXT_PUBLIC_GAS_OPTIMIZATION=true
NEXT_PUBLIC_BATCH_MINTING=true
NEXT_PUBLIC_ADVANCED_MARKETPLACE=true
NEXT_PUBLIC_MULTI_ASSET_STAKING=true
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=true

# Demo Mode
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_MOCK_DEPLOYMENT=false
`;

    fs.writeFileSync(path.join(__dirname, '../.env.local'), envLocalContent);
    console.log('✅ Updated .env.local');
  }

  async updateEnvSepolia() {
    const envSepoliaContent = `# LandKrypt Enhanced - Sepolia Testnet Configuration
# Generated on: ${new Date().toISOString()}

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}
NEXT_PUBLIC_ETHERSCAN_URL=https://sepolia.etherscan.io

# Enhanced Contract Addresses
NEXT_PUBLIC_GAS_OPTIMIZED_NFT=${this.deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_ENHANCED_MARKETPLACE=${this.deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_ADVANCED_STAKING=${this.deployedContracts.advancedStaking}
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=${this.deployedContracts.quadraticGovernance}
NEXT_PUBLIC_ORACLE=${this.deployedContracts.oracle}
NEXT_PUBLIC_MOCK_ERC20=${this.deployedContracts.mockToken}

# Chainlink Price Feeds (Sepolia)
NEXT_PUBLIC_ETH_USD_FEED=${SEPOLIA_PRICE_FEEDS.ETH_USD}
NEXT_PUBLIC_BTC_USD_FEED=${SEPOLIA_PRICE_FEEDS.BTC_USD}
NEXT_PUBLIC_USDC_USD_FEED=${SEPOLIA_PRICE_FEEDS.USDC_USD}
NEXT_PUBLIC_DAI_USD_FEED=${SEPOLIA_PRICE_FEEDS.DAI_USD}

# Deployment Information
DEPLOYMENT_NETWORK=sepolia
DEPLOYMENT_DATE=${new Date().toISOString()}
DEPLOYER_ADDRESS=${this.deployer.address}
RECIPIENT_ADDRESS=${RECIPIENT_ADDRESS}
TOTAL_NFTS_MINTED=${this.nftData.length}

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=sepolia
`;

    fs.writeFileSync(path.join(__dirname, '../.env.sepolia'), envSepoliaContent);
    console.log('✅ Created .env.sepolia');
  }

  async updateEnvProduction() {
    // Read existing production env and update contract addresses
    const prodEnvPath = path.join(__dirname, '../.env.production');
    let prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');

    // Update contract addresses section
    const contractSection = `
# ===========================================
# ENHANCED CONTRACT ADDRESSES (SEPOLIA TESTNET)
# ===========================================
# Use these addresses for testing before mainnet deployment

NEXT_PUBLIC_GAS_OPTIMIZED_NFT=${this.deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_ENHANCED_MARKETPLACE=${this.deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_ADVANCED_STAKING=${this.deployedContracts.advancedStaking}
NEXT_PUBLIC_QUADRATIC_GOVERNANCE=${this.deployedContracts.quadraticGovernance}
NEXT_PUBLIC_ORACLE=${this.deployedContracts.oracle}
NEXT_PUBLIC_MOCK_ERC20=${this.deployedContracts.mockToken}

# Legacy compatibility addresses
NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS=${this.deployedContracts.gasOptimizedNFT}
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=${this.deployedContracts.enhancedMarketplace}
NEXT_PUBLIC_NFT_DAO_ADDRESS=${this.deployedContracts.quadraticGovernance}
NEXT_PUBLIC_ORACLE_ADDRESS=${this.deployedContracts.oracle}

# Sepolia Chainlink Price Feeds
NEXT_PUBLIC_ETH_USD_FEED=${SEPOLIA_PRICE_FEEDS.ETH_USD}
NEXT_PUBLIC_BTC_USD_FEED=${SEPOLIA_PRICE_FEEDS.BTC_USD}
NEXT_PUBLIC_USDC_USD_FEED=${SEPOLIA_PRICE_FEEDS.USDC_USD}
NEXT_PUBLIC_DAI_USD_FEED=${SEPOLIA_PRICE_FEEDS.DAI_USD}
`;

    // Replace the contract addresses section
    prodEnvContent = prodEnvContent.replace(
      /# ===========================================\n# PRODUCTION CONTRACT ADDRESSES[\s\S]*?# ===========================================/,
      contractSection.trim()
    );

    fs.writeFileSync(prodEnvPath, prodEnvContent);
    console.log('✅ Updated .env.production with Sepolia addresses');
  }

  async generateDeploymentReport() {
    console.log('\n📊 Generating Deployment Report...\n');

    this.deploymentInfo = {
      network: 'sepolia',
      chainId: 11155111,
      timestamp: new Date().toISOString(),
      deployer: this.deployer.address,
      recipient: RECIPIENT_ADDRESS,
      contracts: this.deployedContracts,
      priceFeeds: SEPOLIA_PRICE_FEEDS,
      nfts: this.nftData,
      summary: {
        totalContracts: Object.keys(this.deployedContracts).length,
        totalNFTsMinted: this.nftData.length,
        totalGasUsed: this.nftData.reduce((sum, nft) => sum + parseInt(nft.gasUsed), 0),
        averageGasPerNFT: this.nftData.length > 0 ? 
          Math.floor(this.nftData.reduce((sum, nft) => sum + parseInt(nft.gasUsed), 0) / this.nftData.length) : 0
      }
    };

    // Save deployment report
    const reportPath = path.join(__dirname, '../deployments/sepolia-enhanced-deployment.json');
    const deploymentsDir = path.dirname(reportPath);
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.deploymentInfo, null, 2));
    console.log('💾 Deployment report saved to:', reportPath);

    // Display summary
    console.log('📋 DEPLOYMENT SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Network: Sepolia (Chain ID: 11155111)`);
    console.log(`Deployer: ${this.deployer.address}`);
    console.log(`NFT Recipient: ${RECIPIENT_ADDRESS}`);
    console.log(`Contracts Deployed: ${this.deploymentInfo.summary.totalContracts}`);
    console.log(`NFTs Minted: ${this.deploymentInfo.summary.totalNFTsMinted}`);
    console.log(`Total Gas Used: ${this.deploymentInfo.summary.totalGasUsed.toLocaleString()}`);
    console.log(`Average Gas per NFT: ${this.deploymentInfo.summary.averageGasPerNFT.toLocaleString()}`);
    console.log('');

    console.log('📦 CONTRACT ADDRESSES:');
    Object.entries(this.deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(25)}: ${address}`);
    });
    console.log('');

    console.log('🎨 MINTED NFTS:');
    this.nftData.forEach(nft => {
      console.log(`Token #${nft.tokenId}: ipfs://${nft.metadataCid} (${nft.imageFile})`);
    });
  }
}

// Execute deployment
async function main() {
  const deployer = new SepoliaEnhancedDeployer();
  await deployer.deploy();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { SepoliaEnhancedDeployer };
