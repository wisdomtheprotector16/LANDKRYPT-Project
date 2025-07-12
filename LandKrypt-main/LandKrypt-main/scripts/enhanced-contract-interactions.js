// Enhanced Contract Interaction Scripts
// Provides utilities for interacting with upgraded LandKrypt contracts

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Import contract ABIs
const GAS_OPTIMIZED_NFT_ABI = require('../artifacts/contracts/upgrades/GasOptimizedNFT.sol/GasOptimizedNFT.json').abi;
const ENHANCED_MARKETPLACE_ABI = require('../artifacts/contracts/upgrades/EnhancedMarketplace.sol/EnhancedMarketplace.json').abi;
const ADVANCED_STAKING_ABI = require('../artifacts/contracts/upgrades/AdvancedStaking.sol/AdvancedStaking.json').abi;
const QUADRATIC_GOVERNANCE_ABI = require('../artifacts/contracts/upgrades/QuadraticGovernance.sol/QuadraticGovernance.json').abi;

class EnhancedContractManager {
  constructor() {
    this.contracts = {};
    this.signers = {};
    this.deploymentInfo = null;
  }

  async initialize() {
    console.log('🔧 Initializing Enhanced Contract Manager...');
    
    // Get signers
    const signers = await ethers.getSigners();
    this.signers = {
      deployer: signers[0],
      admin: signers[1],
      minter: signers[2],
      user1: signers[3],
      user2: signers[4],
    };

    // Load deployment info
    try {
      const deploymentPath = path.join(__dirname, '../deployments/localhost-upgrades.json');
      if (fs.existsSync(deploymentPath)) {
        this.deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        await this.loadContracts();
      } else {
        console.log('⚠️  No deployment info found. Please deploy contracts first.');
      }
    } catch (error) {
      console.error('Error loading deployment info:', error);
    }

    console.log('✅ Enhanced Contract Manager initialized');
  }

  async loadContracts() {
    if (!this.deploymentInfo) return;

    const { contracts } = this.deploymentInfo;

    // Load Gas Optimized NFT
    if (contracts.gasOptimizedNFT) {
      this.contracts.gasOptimizedNFT = new ethers.Contract(
        contracts.gasOptimizedNFT,
        GAS_OPTIMIZED_NFT_ABI,
        this.signers.deployer
      );
    }

    // Load Enhanced Marketplace
    if (contracts.enhancedMarketplace) {
      this.contracts.enhancedMarketplace = new ethers.Contract(
        contracts.enhancedMarketplace,
        ENHANCED_MARKETPLACE_ABI,
        this.signers.deployer
      );
    }

    // Load Advanced Staking
    if (contracts.advancedStaking) {
      this.contracts.advancedStaking = new ethers.Contract(
        contracts.advancedStaking,
        ADVANCED_STAKING_ABI,
        this.signers.deployer
      );
    }

    // Load Quadratic Governance
    if (contracts.quadraticGovernance) {
      this.contracts.quadraticGovernance = new ethers.Contract(
        contracts.quadraticGovernance,
        QUADRATIC_GOVERNANCE_ABI,
        this.signers.deployer
      );
    }

    console.log('📦 Contracts loaded successfully');
  }

  // =====================================================
  // GAS OPTIMIZED NFT FUNCTIONS
  // =====================================================

  async mintSingleNFT(to, uri, propertyData, royaltyFee = 250) {
    console.log(`🎨 Minting single NFT to ${to}...`);
    
    try {
      const tx = await this.contracts.gasOptimizedNFT.connect(this.signers.minter).mint(
        to,
        uri,
        propertyData,
        royaltyFee
      );
      
      const receipt = await tx.wait();
      const tokenId = receipt.events?.find(e => e.event === 'PropertyMinted')?.args?.tokenId;
      
      console.log(`✅ NFT minted successfully! Token ID: ${tokenId}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      
      return { tokenId, txHash: tx.hash, gasUsed: receipt.gasUsed };
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      throw error;
    }
  }

  async batchMintNFTs(mintData) {
    console.log(`🎨 Batch minting ${mintData.length} NFTs...`);
    
    try {
      const tx = await this.contracts.gasOptimizedNFT.connect(this.signers.minter).batchMint(mintData);
      const receipt = await tx.wait();
      
      const batchEvent = receipt.events?.find(e => e.event === 'BatchMinted');
      const tokenIds = batchEvent?.args?.tokenIds || [];
      
      console.log(`✅ Batch mint successful! Token IDs: ${tokenIds.join(', ')}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`   Gas per NFT: ${receipt.gasUsed.div(mintData.length).toString()}`);
      
      return { tokenIds, txHash: tx.hash, gasUsed: receipt.gasUsed };
    } catch (error) {
      console.error('❌ Error batch minting NFTs:', error);
      throw error;
    }
  }

  async getPropertyData(tokenId) {
    try {
      const data = await this.contracts.gasOptimizedNFT.getPropertyData(tokenId);
      return {
        price: ethers.utils.formatEther(data.price),
        propertyType: data.propertyType,
        location: data.location,
        rarity: data.rarity,
        attributes: data.attributes,
        timestamp: new Date(data.timestamp * 1000),
      };
    } catch (error) {
      console.error('❌ Error getting property data:', error);
      throw error;
    }
  }

  // =====================================================
  // ENHANCED MARKETPLACE FUNCTIONS
  // =====================================================

  async createFixedPriceListing(nftContract, tokenId, price, currency, duration) {
    console.log(`🏪 Creating fixed price listing for token ${tokenId}...`);
    
    try {
      const tx = await this.contracts.enhancedMarketplace.createListing(
        nftContract,
        tokenId,
        ethers.utils.parseEther(price.toString()),
        currency,
        duration
      );
      
      const receipt = await tx.wait();
      const listingEvent = receipt.events?.find(e => e.event === 'ListingCreated');
      const listingId = listingEvent?.args?.listingId;
      
      console.log(`✅ Fixed price listing created! Listing ID: ${listingId}`);
      return { listingId, txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      throw error;
    }
  }

  async createDutchAuction(nftContract, tokenId, startPrice, endPrice, duration) {
    console.log(`🔨 Creating Dutch auction for token ${tokenId}...`);
    
    try {
      const tx = await this.contracts.enhancedMarketplace.createDutchAuction(
        nftContract,
        tokenId,
        ethers.utils.parseEther(startPrice.toString()),
        ethers.utils.parseEther(endPrice.toString()),
        duration
      );
      
      const receipt = await tx.wait();
      const auctionEvent = receipt.events?.find(e => e.event === 'AuctionCreated');
      const auctionId = auctionEvent?.args?.auctionId;
      
      console.log(`✅ Dutch auction created! Auction ID: ${auctionId}`);
      return { auctionId, txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error creating Dutch auction:', error);
      throw error;
    }
  }

  async makeOffer(nftContract, tokenId, amount, currency, expiry) {
    console.log(`💰 Making offer on token ${tokenId}...`);
    
    try {
      const tx = await this.contracts.enhancedMarketplace.connect(this.signers.user1).makeOffer(
        nftContract,
        tokenId,
        ethers.utils.parseEther(amount.toString()),
        currency,
        expiry
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Offer made successfully!`);
      return { txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error making offer:', error);
      throw error;
    }
  }

  async getCurrentDutchPrice(auctionId) {
    try {
      const price = await this.contracts.enhancedMarketplace.getCurrentDutchPrice(auctionId);
      return ethers.utils.formatEther(price);
    } catch (error) {
      console.error('❌ Error getting Dutch price:', error);
      throw error;
    }
  }

  // =====================================================
  // ADVANCED STAKING FUNCTIONS
  // =====================================================

  async stakeTokens(poolId, amount) {
    console.log(`🔒 Staking ${amount} tokens in pool ${poolId}...`);
    
    try {
      const tx = await this.contracts.advancedStaking.connect(this.signers.user1).deposit(
        poolId,
        ethers.utils.parseEther(amount.toString())
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Tokens staked successfully!`);
      return { txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error staking tokens:', error);
      throw error;
    }
  }

  async stakeNFT(poolId, tokenId) {
    console.log(`🔒 Staking NFT ${tokenId} in pool ${poolId}...`);
    
    try {
      const tx = await this.contracts.advancedStaking.connect(this.signers.user1).stakeNFT(
        poolId,
        tokenId
      );
      
      const receipt = await tx.wait();
      console.log(`✅ NFT staked successfully!`);
      return { txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error staking NFT:', error);
      throw error;
    }
  }

  async activateBooster(poolId, boosterId) {
    console.log(`🚀 Activating booster ${boosterId} for pool ${poolId}...`);
    
    try {
      const tx = await this.contracts.advancedStaking.connect(this.signers.user1).activateBooster(
        poolId,
        boosterId
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Booster activated successfully!`);
      return { txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error activating booster:', error);
      throw error;
    }
  }

  async getPendingRewards(poolId, user) {
    try {
      const rewards = await this.contracts.advancedStaking.pendingReward(poolId, user);
      return ethers.utils.formatEther(rewards);
    } catch (error) {
      console.error('❌ Error getting pending rewards:', error);
      throw error;
    }
  }

  // =====================================================
  // QUADRATIC GOVERNANCE FUNCTIONS
  // =====================================================

  async createProposal(targets, values, calldatas, description) {
    console.log(`🗳️  Creating governance proposal...`);
    
    try {
      const tx = await this.contracts.quadraticGovernance.connect(this.signers.user1).propose(
        targets,
        values,
        calldatas,
        description
      );
      
      const receipt = await tx.wait();
      const proposalEvent = receipt.events?.find(e => e.event === 'ProposalCreated');
      const proposalId = proposalEvent?.args?.proposalId;
      
      console.log(`✅ Proposal created! Proposal ID: ${proposalId}`);
      return { proposalId, txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error creating proposal:', error);
      throw error;
    }
  }

  async castVote(proposalId, support) {
    console.log(`🗳️  Casting vote on proposal ${proposalId}...`);
    
    try {
      const tx = await this.contracts.quadraticGovernance.connect(this.signers.user1).castVote(
        proposalId,
        support
      );
      
      const receipt = await tx.wait();
      console.log(`✅ Vote cast successfully!`);
      return { txHash: tx.hash };
    } catch (error) {
      console.error('❌ Error casting vote:', error);
      throw error;
    }
  }

  async getVotingPower(account, blockNumber) {
    try {
      const power = await this.contracts.quadraticGovernance.getVotingPower(account, blockNumber);
      return {
        tokenBalance: ethers.utils.formatEther(power.tokenBalance),
        nftCount: power.nftCount.toString(),
        stakedAmount: ethers.utils.formatEther(power.stakedAmount),
        delegatedPower: ethers.utils.formatEther(power.delegatedPower),
        tierMultiplier: power.tierMultiplier.toString(),
      };
    } catch (error) {
      console.error('❌ Error getting voting power:', error);
      throw error;
    }
  }

  // =====================================================
  // DEMONSTRATION FUNCTIONS
  // =====================================================

  async demonstrateGasOptimization() {
    console.log('\n🧪 Demonstrating Gas Optimization...\n');
    
    const propertyData = {
      price: ethers.utils.parseEther('2.5'),
      propertyType: 1,
      location: 1,
      rarity: 3,
      attributes: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // Single mint
    console.log('1️⃣ Single Mint:');
    const singleResult = await this.mintSingleNFT(
      this.signers.user1.address,
      'ipfs://single-test',
      propertyData
    );

    // Batch mint
    console.log('\n2️⃣ Batch Mint (5 NFTs):');
    const batchData = Array(5).fill().map((_, i) => ({
      to: this.signers.user1.address,
      uri: `ipfs://batch-test-${i}`,
      propertyData,
      royaltyFee: 250,
    }));

    const batchResult = await this.batchMintNFTs(batchData);

    // Calculate savings
    const singleGasTotal = singleResult.gasUsed.mul(5);
    const batchGas = batchResult.gasUsed;
    const savings = singleGasTotal.sub(batchGas);
    const savingsPercentage = savings.mul(100).div(singleGasTotal);

    console.log('\n📊 Gas Optimization Results:');
    console.log(`   Single mint gas: ${singleResult.gasUsed.toString()}`);
    console.log(`   5x single mints: ${singleGasTotal.toString()}`);
    console.log(`   Batch mint gas: ${batchGas.toString()}`);
    console.log(`   Gas saved: ${savings.toString()} (${savingsPercentage}%)`);
  }

  async demonstrateMarketplaceFeatures() {
    console.log('\n🏪 Demonstrating Enhanced Marketplace...\n');

    const nftContract = this.contracts.gasOptimizedNFT.address;
    const tokenId = 0; // Assuming we have minted some NFTs

    // Create fixed price listing
    console.log('1️⃣ Creating Fixed Price Listing:');
    await this.createFixedPriceListing(
      nftContract,
      tokenId,
      '1.5',
      ethers.constants.AddressZero, // ETH
      7 * 24 * 60 * 60 // 7 days
    );

    // Create Dutch auction
    console.log('\n2️⃣ Creating Dutch Auction:');
    await this.createDutchAuction(
      nftContract,
      tokenId + 1,
      '3.0', // Start price
      '1.0', // End price
      24 * 60 * 60 // 24 hours
    );

    // Make offer
    console.log('\n3️⃣ Making Offer:');
    await this.makeOffer(
      nftContract,
      tokenId + 2,
      '2.0',
      ethers.constants.AddressZero, // ETH
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days from now
    );
  }

  async demonstrateStakingFeatures() {
    console.log('\n🔒 Demonstrating Advanced Staking...\n');

    // Stake tokens
    console.log('1️⃣ Staking Tokens:');
    await this.stakeTokens(0, '100');

    // Get pending rewards
    console.log('\n2️⃣ Checking Pending Rewards:');
    const rewards = await this.getPendingRewards(0, this.signers.user1.address);
    console.log(`   Pending rewards: ${rewards} tokens`);
  }

  async runFullDemo() {
    console.log('🚀 Running Full Enhanced Contract Demo...\n');
    
    await this.demonstrateGasOptimization();
    await this.demonstrateMarketplaceFeatures();
    await this.demonstrateStakingFeatures();
    
    console.log('\n🎉 Demo completed successfully!');
  }
}

// Export for use in other scripts
module.exports = { EnhancedContractManager };

// Run demo if called directly
if (require.main === module) {
  async function main() {
    const manager = new EnhancedContractManager();
    await manager.initialize();
    await manager.runFullDemo();
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
