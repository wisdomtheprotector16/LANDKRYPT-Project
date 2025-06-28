// Create Staking Contracts and Add as Minters Script
// This script creates staking contracts one by one and adds each as a minter

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const LISTING_PRICE = ethers.parseUnits('200000', 18); // 200,000 LKUSD (18 decimals)
const TARGET_AMOUNT = ethers.parseUnits('200000', 18); // Same as listing price for simplicity

// We'll discover NFTs dynamically instead of using hardcoded data

// Contract ABIs
const STAKING_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "targetAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "listingPrice", "type": "uint256"}
    ],
    "name": "createStakingContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getStakingContractForNFT",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const LKUSD_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "minter", "type": "address"}],
    "name": "addMinter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "isMinter",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const NFT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getTokenDescription",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Environment variable validation
function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} not set`);
  }
  return value;
}

// Discover all NFTs owned by the given address
async function discoverOwnedNFTs(nftContract, ownerAddress, maxTokenId = 1000) {
  console.log(`🔍 Scanning for NFTs owned by ${ownerAddress}...`);
  
  const ownedNFTs = [];
  const batchSize = 50; // Process in batches to avoid RPC rate limits
  
  for (let start = 1; start <= maxTokenId; start += batchSize) {
    const end = Math.min(start + batchSize - 1, maxTokenId);
    const promises = [];
    
    // Create batch of ownership checks
    for (let tokenId = start; tokenId <= end; tokenId++) {
      promises.push(
        nftContract.ownerOf(tokenId)
          .then(owner => ({ tokenId, owner, exists: true }))
          .catch(() => ({ tokenId, owner: null, exists: false }))
      );
    }
    
    // Execute batch
    const results = await Promise.all(promises);
    
    // Filter for NFTs owned by the target address
    for (const result of results) {
      if (result.exists && result.owner.toLowerCase() === ownerAddress.toLowerCase()) {
        ownedNFTs.push(result.tokenId);
      }
    }
    
    // Progress indicator
    if (end % 100 === 0 || end === maxTokenId) {
      console.log(`   Scanned up to token ID ${end}... Found ${ownedNFTs.length} owned NFTs so far`);
    }
  }
  
  return ownedNFTs;
}

// Get NFT description from contract
async function getNFTDescription(nftContract, tokenId) {
  try {
    const description = await nftContract.getTokenDescription(tokenId);
    return description;
  } catch (error) {
    try {
      // Fallback to tokenURI if getTokenDescription fails
      const tokenURI = await nftContract.tokenURI(tokenId);
      return `NFT #${tokenId} (${tokenURI.substring(0, 50)}...)`;
    } catch (error2) {
      return `NFT #${tokenId}`;
    }
  }
}

async function createStakingWithMinters() {
  console.log('🚀 Creating Staking Contracts and Adding Minter Permissions...\n');

  try {
    // Load configuration from environment
    const config = {
      rpcUrl: getRequiredEnvVar('ALCHEMY_SEPOLIA_URL'),
      stakingFactoryAddress: getRequiredEnvVar('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS'),
      nftContractAddress: getRequiredEnvVar('NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS'),
      lkusdAddress: getRequiredEnvVar('NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS'),
      ownerPrivateKey: getRequiredEnvVar('DEPLOYER_PRIVATE_KEY'),
    };

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.ownerPrivateKey, provider);

    // Create contract instances
    const stakingFactory = new ethers.Contract(
      config.stakingFactoryAddress,
      STAKING_FACTORY_ABI,
      wallet
    );

    const nftContract = new ethers.Contract(
      config.nftContractAddress,
      NFT_ABI,
      wallet
    );

    const lkusdContract = new ethers.Contract(
      config.lkusdAddress,
      LKUSD_ABI,
      wallet
    );

    // Discover owned NFTs
    console.log(`🔍 Discovering NFTs owned by ${wallet.address}...`);
    const ownedTokenIds = await discoverOwnedNFTs(nftContract, wallet.address, 1000);
    
    if (ownedTokenIds.length === 0) {
      console.log('❌ No NFTs found owned by your address.');
      console.log('💡 Make sure you have minted NFTs or they are owned by the deployer address.');
      return;
    }

    console.log(`📋 Creating staking contracts for ${ownedTokenIds.length} NFTs`);
    console.log(`💰 Listing price: ${ethers.formatUnits(LISTING_PRICE, 18)} LKUSD each`);
    console.log(`🎯 Target amount: ${ethers.formatUnits(TARGET_AMOUNT, 18)} LKUSD each`);
    console.log(`👤 Owner: ${wallet.address}\n`);

    const results = [];
    const errors = [];

    for (let i = 0; i < ownedTokenIds.length; i++) {
      const tokenId = ownedTokenIds[i];
      const description = await getNFTDescription(nftContract, tokenId);
      const nft = { tokenId, name: description };
      
      console.log(`\n🏠 Processing NFT ${i + 1}/${ownedTokenIds.length}:`);
      console.log(`   🏷️  Token ID: ${nft.tokenId}`);
      console.log(`   📝 Name: ${nft.name}`);

      try {
        // Check if NFT owner is correct
        const nftOwner = await nftContract.ownerOf(nft.tokenId);
        if (nftOwner.toLowerCase() !== wallet.address.toLowerCase()) {
          throw new Error(`NFT ${nft.tokenId} not owned by deployer. Owner: ${nftOwner}`);
        }
        console.log(`   ✅ NFT ownership verified`);

        // Check if staking contract already exists
        let stakingContractAddress;
        try {
          stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
          if (stakingContractAddress !== '0x0000000000000000000000000000000000000000') {
            console.log(`   ⚠️  Staking contract already exists: ${stakingContractAddress}`);
            
            // Check if it's already a minter
            const isAlreadyMinter = await lkusdContract.isMinter(stakingContractAddress);
            if (!isAlreadyMinter) {
              console.log(`   🔧 Adding existing staking contract as minter...`);
              const addMinterTx = await lkusdContract.addMinter(stakingContractAddress);
              await addMinterTx.wait();
              console.log(`   ✅ Added as minter: ${addMinterTx.hash}`);
            } else {
              console.log(`   ✅ Already a minter`);
            }

            results.push({
              tokenId: nft.tokenId,
              name: nft.name,
              stakingContract: stakingContractAddress,
              status: 'already_exists',
              minterStatus: 'verified'
            });
            continue;
          }
        } catch (error) {
          // Ignore error, contract doesn't exist
        }

        // Approve StakingFactory to transfer NFT
        console.log(`   🔓 Approving StakingFactory to transfer NFT...`);
        const approveTx = await nftContract.approve(config.stakingFactoryAddress, nft.tokenId);
        await approveTx.wait();
        console.log(`   ✅ Approval confirmed: ${approveTx.hash}`);

        // Create staking contract
        console.log(`   🏭 Creating staking contract...`);
        const createTx = await stakingFactory.createStakingContract(
          nft.tokenId,
          TARGET_AMOUNT,
          LISTING_PRICE
        );

        console.log(`   ⏳ Transaction sent: ${createTx.hash}`);
        const receipt = await createTx.wait();
        console.log(`   ✅ Staking contract created in block ${receipt.blockNumber}`);

        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get the staking contract address
        stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
        console.log(`   🏭 Staking contract address: ${stakingContractAddress}`);

        // Add the staking contract as a minter
        console.log(`   🔧 Adding staking contract as minter on LKUSD...`);
        const addMinterTx = await lkusdContract.addMinter(stakingContractAddress);
        await addMinterTx.wait();
        console.log(`   ✅ Minter permission granted: ${addMinterTx.hash}`);

        // Verify minter status
        const isMinterNow = await lkusdContract.isMinter(stakingContractAddress);
        console.log(`   🔍 Minter verification: ${isMinterNow ? 'SUCCESS' : 'FAILED'}`);

        results.push({
          tokenId: nft.tokenId,
          name: nft.name,
          stakingContract: stakingContractAddress,
          createTxHash: createTx.hash,
          approveTxHash: approveTx.hash,
          minterTxHash: addMinterTx.hash,
          minterStatus: isMinterNow ? 'granted' : 'failed',
          status: 'created'
        });

        console.log(`   🎉 NFT ${nft.tokenId} successfully setup and listed with minter permissions!`);

        // Wait 5 seconds between transactions
        if (i < ownedTokenIds.length - 1) {
          console.log('   ⏳ Waiting 5 seconds before next NFT...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error) {
        console.error(`   ❌ Failed to setup NFT ${nft.tokenId}:`, error.message);
        errors.push({
          tokenId: nft.tokenId,
          name: nft.name,
          error: error.message
        });
      }
    }

    // Summary report
    console.log('\n' + '='.repeat(80));
    console.log('🎉 STAKING SETUP WITH MINTER PERMISSIONS COMPLETED!');
    console.log('='.repeat(80));
    console.log(`📊 Total NFTs: ${ownedTokenIds.length}`);
    console.log(`✅ Successfully Setup: ${results.filter(r => r.status === 'created').length}`);
    console.log(`⚠️  Already Existed: ${results.filter(r => r.status === 'already_exists').length}`);
    console.log(`❌ Failed: ${errors.length}`);

    if (results.length > 0) {
      console.log('\n✅ SUCCESSFUL SETUPS:');
      results.forEach(result => {
        console.log(`   🏠 Token #${result.tokenId}: ${result.name}`);
        console.log(`      🏭 Staking Contract: ${result.stakingContract}`);
        console.log(`      🔧 Minter Status: ${result.minterStatus.toUpperCase()}`);
        if (result.createTxHash) {
          console.log(`      🔗 Create TX: ${result.createTxHash}`);
        }
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ FAILED SETUPS:');
      errors.forEach(error => {
        console.log(`   🏠 Token #${error.tokenId}: ${error.name}`);
        console.log(`      ❌ Error: ${error.error}`);
      });
    }

    // Save results
    const reportData = {
      timestamp: new Date().toISOString(),
      listingPrice: ethers.formatUnits(LISTING_PRICE, 18),
      targetAmount: ethers.formatUnits(TARGET_AMOUNT, 18),
      total: ownedTokenIds.length,
      successful: results.filter(r => r.status === 'created').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      failed: errors.length,
      results,
      errors
    };

    const fs = require('fs');
    const reportPath = './staking-with-minters-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);

    return reportData;

  } catch (error) {
    console.error('\n💥 Setup process failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  createStakingWithMinters()
    .then(report => {
      console.log('\n🎊 Staking setup with minters completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Staking setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createStakingWithMinters };
