// Contract Event Listener and Database Integration
// Listens to all contract events and stores them in the database

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

class ContractEventListener {
  constructor() {
    this.contracts = {};
    this.eventHandlers = {};
    this.databaseQueue = [];
    this.isListening = false;
  }

  async startEventListening() {
    console.log('👂 Starting Contract Event Listening...\n');
    console.log('='.repeat(50));

    try {
      // 1. Setup contracts
      await this.setupContracts();
      
      // 2. Setup event handlers
      await this.setupEventHandlers();
      
      // 3. Start listening to events
      await this.startListening();
      
      console.log('\n🎉 Contract event listening started successfully!');
      
    } catch (error) {
      console.error('\n❌ Contract event listening failed:', error);
      throw error;
    }
  }

  async setupContracts() {
    console.log('🔧 Setting up contract connections...');
    
    try {
      // Load deployment data
      const deploymentPath = path.join(__dirname, '../../deployments/sepolia-enhanced-deployment.json');
      if (!fs.existsSync(deploymentPath)) {
        throw new Error('Deployment file not found');
      }
      
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      // Connect to contracts
      this.contracts.nft = await ethers.getContractAt('GasOptimizedNFT', deployment.contracts.nft.address);
      this.contracts.marketplace = await ethers.getContractAt('EnhancedMarketplace', deployment.contracts.marketplace.address);
      this.contracts.staking = await ethers.getContractAt('AdvancedStaking', deployment.contracts.staking.address);
      this.contracts.governance = await ethers.getContractAt('QuadraticGovernance', deployment.contracts.governance.address);
      
      console.log('✅ Contract connections established');
      console.log(`   NFT Contract: ${this.contracts.nft.target}`);
      console.log(`   Marketplace: ${this.contracts.marketplace.target}`);
      console.log(`   Staking: ${this.contracts.staking.target}`);
      console.log(`   Governance: ${this.contracts.governance.target}`);
      
    } catch (error) {
      console.error('❌ Contract setup failed:', error.message);
      throw error;
    }
  }

  async setupEventHandlers() {
    console.log('\n📡 Setting up event handlers...');
    
    // NFT Contract Events
    this.eventHandlers.nft = {
      'Transfer': this.handleNFTTransfer.bind(this),
      'Approval': this.handleNFTApproval.bind(this),
      'ApprovalForAll': this.handleNFTApprovalForAll.bind(this)
    };

    // Marketplace Contract Events
    this.eventHandlers.marketplace = {
      'ItemListed': this.handleItemListed.bind(this),
      'ItemSold': this.handleItemSold.bind(this),
      'ItemCanceled': this.handleItemCanceled.bind(this),
      'OfferMade': this.handleOfferMade.bind(this),
      'OfferAccepted': this.handleOfferAccepted.bind(this)
    };

    // Staking Contract Events
    this.eventHandlers.staking = {
      'NFTStaked': this.handleNFTStaked.bind(this),
      'NFTUnstaked': this.handleNFTUnstaked.bind(this),
      'RewardsClaimed': this.handleRewardsClaimed.bind(this),
      'TierUpgraded': this.handleTierUpgraded.bind(this)
    };

    // Governance Contract Events
    this.eventHandlers.governance = {
      'ProposalCreated': this.handleProposalCreated.bind(this),
      'VoteCast': this.handleVoteCast.bind(this),
      'ProposalExecuted': this.handleProposalExecuted.bind(this)
    };

    console.log('✅ Event handlers configured');
    console.log(`   NFT Events: ${Object.keys(this.eventHandlers.nft).length}`);
    console.log(`   Marketplace Events: ${Object.keys(this.eventHandlers.marketplace).length}`);
    console.log(`   Staking Events: ${Object.keys(this.eventHandlers.staking).length}`);
    console.log(`   Governance Events: ${Object.keys(this.eventHandlers.governance).length}`);
  }

  async startListening() {
    console.log('\n🎧 Starting event listeners...');
    
    try {
      // Setup NFT event listeners
      Object.entries(this.eventHandlers.nft).forEach(([eventName, handler]) => {
        this.contracts.nft.on(eventName, handler);
        console.log(`   ✅ Listening to NFT.${eventName}`);
      });

      // Setup Marketplace event listeners
      Object.entries(this.eventHandlers.marketplace).forEach(([eventName, handler]) => {
        this.contracts.marketplace.on(eventName, handler);
        console.log(`   ✅ Listening to Marketplace.${eventName}`);
      });

      // Setup Staking event listeners
      Object.entries(this.eventHandlers.staking).forEach(([eventName, handler]) => {
        this.contracts.staking.on(eventName, handler);
        console.log(`   ✅ Listening to Staking.${eventName}`);
      });

      // Setup Governance event listeners
      Object.entries(this.eventHandlers.governance).forEach(([eventName, handler]) => {
        this.contracts.governance.on(eventName, handler);
        console.log(`   ✅ Listening to Governance.${eventName}`);
      });

      this.isListening = true;
      console.log('\n🎉 All event listeners active!');
      
    } catch (error) {
      console.error('❌ Event listener setup failed:', error.message);
      throw error;
    }
  }

  // NFT Event Handlers
  async handleNFTTransfer(from, to, tokenId, event) {
    console.log(`\n🎨 NFT Transfer Event: Token ${tokenId} from ${from} to ${to}`);
    
    const dbRecord = {
      table: 'nft_ownership',
      action: from === ethers.ZeroAddress ? 'INSERT' : 'UPDATE',
      data: {
        user_address: to,
        nft_id: tokenId.toString(),
        contract_address: this.contracts.nft.target,
        previous_owner: from !== ethers.ZeroAddress ? from : null,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        action_type: from === ethers.ZeroAddress ? 'MINT' : 'TRANSFER',
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async handleNFTApproval(owner, approved, tokenId, event) {
    console.log(`\n✅ NFT Approval Event: Token ${tokenId} approved for ${approved}`);
    
    const dbRecord = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: owner,
        nft_id: tokenId.toString(),
        action_type: 'APPROVE',
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        metadata: {
          approved_address: approved,
          contract_address: this.contracts.nft.target
        },
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async handleNFTApprovalForAll(owner, operator, approved, event) {
    console.log(`\n🔓 NFT ApprovalForAll Event: ${owner} ${approved ? 'approved' : 'revoked'} ${operator}`);
    
    const dbRecord = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: owner,
        nft_id: 0, // ApprovalForAll applies to all tokens
        action_type: 'APPROVE_ALL',
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        metadata: {
          operator_address: operator,
          approved: approved,
          contract_address: this.contracts.nft.target
        },
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  // Marketplace Event Handlers
  async handleItemListed(seller, nftContract, tokenId, price, event) {
    console.log(`\n🛒 Item Listed Event: Token ${tokenId} listed for ${ethers.formatEther(price)} ETH`);
    
    const dbRecord = {
      table: 'marketplace_listings',
      action: 'INSERT',
      data: {
        user_address: seller,
        nft_id: tokenId.toString(),
        contract_address: nftContract,
        price: price.toString(),
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        is_active: true,
        action_type: 'LIST',
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async handleItemSold(seller, buyer, nftContract, tokenId, price, event) {
    console.log(`\n💰 Item Sold Event: Token ${tokenId} sold for ${ethers.formatEther(price)} ETH`);
    
    // Update listing as sold
    const updateListing = {
      table: 'marketplace_listings',
      action: 'UPDATE',
      data: {
        is_active: false,
        buyer_address: buyer,
        sold_price: price.toString(),
        sold_tx_hash: event.transactionHash,
        sold_timestamp: new Date().toISOString()
      },
      where: {
        nft_id: tokenId.toString(),
        user_address: seller,
        is_active: true
      }
    };

    // Record sale action
    const saleRecord = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: buyer,
        nft_id: tokenId.toString(),
        action_type: 'PURCHASE',
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        amount: price.toString(),
        metadata: {
          seller_address: seller,
          contract_address: nftContract
        },
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(updateListing);
    await this.queueDatabaseOperation(saleRecord);
  }

  async handleItemCanceled(seller, nftContract, tokenId, event) {
    console.log(`\n❌ Item Canceled Event: Token ${tokenId} listing canceled`);
    
    const dbRecord = {
      table: 'marketplace_listings',
      action: 'UPDATE',
      data: {
        is_active: false,
        canceled_tx_hash: event.transactionHash,
        canceled_timestamp: new Date().toISOString()
      },
      where: {
        nft_id: tokenId.toString(),
        user_address: seller,
        is_active: true
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  // Staking Event Handlers
  async handleNFTStaked(user, tokenId, stakingPower, event) {
    console.log(`\n🥩 NFT Staked Event: Token ${tokenId} staked by ${user}`);
    
    const dbRecord = {
      table: 'nft_stakes',
      action: 'INSERT',
      data: {
        user_address: user,
        nft_id: tokenId.toString(),
        staking_contract: this.contracts.staking.target,
        amount: stakingPower.toString(),
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        is_active: true,
        start_timestamp: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async handleNFTUnstaked(user, tokenId, rewards, event) {
    console.log(`\n🔓 NFT Unstaked Event: Token ${tokenId} unstaked, rewards: ${ethers.formatEther(rewards)} ETH`);
    
    const dbRecord = {
      table: 'nft_stakes',
      action: 'UPDATE',
      data: {
        is_active: false,
        end_timestamp: new Date().toISOString(),
        rewards_earned: rewards.toString(),
        unstake_tx_hash: event.transactionHash
      },
      where: {
        user_address: user,
        nft_id: tokenId.toString(),
        is_active: true
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async handleRewardsClaimed(user, amount, event) {
    console.log(`\n💎 Rewards Claimed Event: ${user} claimed ${ethers.formatEther(amount)} ETH`);
    
    const dbRecord = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: user,
        nft_id: 0, // Rewards are not tied to specific NFT
        action_type: 'CLAIM_REWARDS',
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        amount: amount.toString(),
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  // Governance Event Handlers
  async handleVoteCast(voter, proposalId, support, weight, event) {
    console.log(`\n🗳️  Vote Cast Event: ${voter} voted ${support ? 'YES' : 'NO'} on proposal ${proposalId}`);
    
    const dbRecord = {
      table: 'nft_votes',
      action: 'INSERT',
      data: {
        user_address: voter,
        nft_id: 0, // Will be updated based on voting power source
        proposal_id: proposalId.toString(),
        vote_choice: support,
        voting_power: weight.toString(),
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        timestamp: new Date().toISOString()
      }
    };

    await this.queueDatabaseOperation(dbRecord);
  }

  async queueDatabaseOperation(operation) {
    this.databaseQueue.push({
      ...operation,
      queued_at: new Date().toISOString()
    });

    // Process queue immediately for testing
    await this.processDatabaseQueue();
  }

  async processDatabaseQueue() {
    if (this.databaseQueue.length === 0) return;

    console.log(`📝 Processing ${this.databaseQueue.length} database operations...`);

    // For testing, we'll save to a file instead of actual database
    const queuePath = path.join(__dirname, '../../DATABASE_OPERATIONS_QUEUE.json');
    
    let existingOperations = [];
    if (fs.existsSync(queuePath)) {
      existingOperations = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    }

    existingOperations.push(...this.databaseQueue);
    
    fs.writeFileSync(queuePath, JSON.stringify(existingOperations, null, 2));
    
    console.log(`✅ ${this.databaseQueue.length} operations saved to database queue`);
    
    // Clear the queue
    this.databaseQueue = [];
  }

  async stopListening() {
    console.log('\n🛑 Stopping event listeners...');
    
    if (this.isListening) {
      // Remove all listeners
      this.contracts.nft.removeAllListeners();
      this.contracts.marketplace.removeAllListeners();
      this.contracts.staking.removeAllListeners();
      this.contracts.governance.removeAllListeners();
      
      this.isListening = false;
      console.log('✅ All event listeners stopped');
    }
  }

  async generateListenerReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.isListening ? 'ACTIVE' : 'STOPPED',
      contracts: {
        nft: this.contracts.nft?.target,
        marketplace: this.contracts.marketplace?.target,
        staking: this.contracts.staking?.target,
        governance: this.contracts.governance?.target
      },
      eventHandlers: {
        nft: Object.keys(this.eventHandlers.nft || {}),
        marketplace: Object.keys(this.eventHandlers.marketplace || {}),
        staking: Object.keys(this.eventHandlers.staking || {}),
        governance: Object.keys(this.eventHandlers.governance || {})
      },
      queuedOperations: this.databaseQueue.length
    };

    const reportPath = path.join(__dirname, '../../CONTRACT_EVENT_LISTENER_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Event Listener Report Generated:');
    console.log(`Status: ${report.status}`);
    console.log(`Contracts Connected: ${Object.keys(report.contracts).length}`);
    console.log(`Event Types Monitored: ${Object.values(report.eventHandlers).flat().length}`);
    console.log(`Queued Operations: ${report.queuedOperations}`);

    return report;
  }
}

// Execute event listening
async function main() {
  const listener = new ContractEventListener();
  
  try {
    await listener.startEventListening();
    
    // Generate initial report
    await listener.generateListenerReport();
    
    console.log('\n🎧 Event listener is now active and monitoring all contract interactions!');
    console.log('📝 All events will be automatically stored in the database queue.');
    console.log('🛑 Press Ctrl+C to stop listening...');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Received SIGINT, stopping event listener...');
      await listener.stopListening();
      await listener.generateListenerReport();
      process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {
      if (listener.isListening) {
        console.log(`📡 Event listener active - ${new Date().toISOString()}`);
      }
    }, 30000); // Log every 30 seconds
    
  } catch (error) {
    console.error('❌ Event listener failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ContractEventListener };
