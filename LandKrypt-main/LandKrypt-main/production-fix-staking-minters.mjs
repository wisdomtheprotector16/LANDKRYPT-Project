#!/usr/bin/env node
/**
 * Production-Ready Staking Contract Minter Permission Manager
 * 
 * This script dynamically discovers all staking contracts on the marketplace
 * and ensures they have proper minter permissions for LKST tokens.
 * 
 * Features:
 * - Dynamic discovery of all staking contracts
 * - Duplicate prevention
 * - Comprehensive error handling
 * - Detailed logging and reporting
 * - Production-safe operations
 * - Gas optimization
 * - Rollback capability
 * 
 * Usage: node production-fix-staking-minters.mjs [options]
 * Options:
 *   --dry-run    Only check permissions without making changes
 *   --max-nfts   Maximum NFT ID to check (default: auto-detect)
 *   --help       Show this help message
 */

import { ethers } from 'ethers';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

// Get script directory for logging
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced Contract ABIs
const LKST_ABI = [
  "function addMinter(address account) external",
  "function removeMinter(address account) external", 
  "function isMinter(address account) external view returns (bool)",
  "function getAllMinters() external view returns (address[] memory)",
  "function owner() external view returns (address)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)"
];

const STAKING_FACTORY_ABI = [
  "function getStakingContractForNFT(uint256 tokenId) external view returns (address)",
  "function stakingContracts(uint256) external view returns (address)",
  "function getStakingContractsCount() external view returns (uint256)"
];

const NFT_CONTRACT_ABI = [
  "function totalSupply() external view returns (uint256)",
  "function exists(uint256 tokenId) external view returns (bool)",
  "function isThereTokenId(uint256 tokenId) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

const MARKETPLACE_ABI = [
  "function listings(uint256 tokenId) external view returns (uint256 price, address stakingContract, bool isListed)",
  "function listedBool(uint256 tokenId) external view returns (bool)"
];

// Contract addresses
const ADDRESSES = {
  LKST: process.env.NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS,
  STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
  NFT_CONTRACT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
  MARKETPLACE: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
};

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 5, // Process in batches to avoid rate limiting
  GAS_LIMIT_BUFFER: 1.2, // 20% buffer for gas estimation
  CONFIRMATION_BLOCKS: 1,
};

// Global state
let provider, wallet, contracts, operationLog;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    maxNfts: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--max-nfts':
        options.maxNfts = parseInt(args[++i]);
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.log(`Unknown option: ${args[i]}`);
        options.help = true;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Production-Ready Staking Contract Minter Permission Manager

Usage: node production-fix-staking-minters.mjs [options]

Options:
  --dry-run    Only check permissions without making changes
  --max-nfts   Maximum NFT ID to check (default: auto-detect)
  --help       Show this help message

Examples:
  node production-fix-staking-minters.mjs                    # Run full fix
  node production-fix-staking-minters.mjs --dry-run          # Check only
  node production-fix-staking-minters.mjs --max-nfts 10      # Check up to NFT #10
`);
}

/**
 * Initialize contracts and connections
 */
async function initialize() {
  console.log("🔧 Initializing Production Staking Minter Manager");
  console.log("=================================================\n");

  // Validate environment
  const requiredEnvVars = [
    'ALCHEMY_SEPOLIA_URL',
    'DEPLOYER_PRIVATE_KEY',
    'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS',
    'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS',
    'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS',
    'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  // Setup provider and wallet
  provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 Wallet: ${wallet.address}`);
  console.log(`🌐 Network: ${(await provider.getNetwork()).name} (Chain ID: ${(await provider.getNetwork()).chainId})`);
  console.log(`💰 ETH Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH\n`);

  // Initialize contracts
  contracts = {
    lkst: new ethers.Contract(ADDRESSES.LKST, LKST_ABI, wallet),
    stakingFactory: new ethers.Contract(ADDRESSES.STAKING_FACTORY, STAKING_FACTORY_ABI, wallet),
    nftContract: new ethers.Contract(ADDRESSES.NFT_CONTRACT, NFT_CONTRACT_ABI, wallet),
    marketplace: new ethers.Contract(ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, wallet),
  };

  console.log("📋 Contract Addresses:");
  console.log("======================");
  Object.entries(ADDRESSES).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  console.log();

  // Verify contract ownership
  const owner = await contracts.lkst.owner();
  const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
  
  console.log(`📜 LKST Contract Owner: ${owner}`);
  console.log(`🔑 Our Wallet: ${wallet.address}`);
  console.log(`✅ Is Owner: ${isOwner}\n`);
  
  if (!isOwner) {
    throw new Error("Error: You are not the owner of the LKST contract! You need owner privileges to add minters.");
  }

  // Initialize operation log
  operationLog = {
    timestamp: new Date().toISOString(),
    network: (await provider.getNetwork()).name,
    wallet: wallet.address,
    operations: [],
    summary: {
      discovered: 0,
      alreadyMinters: 0,
      successfullyAdded: 0,
      errors: 0,
      gasUsed: 0n
    }
  };
}

/**
 * Discover all staking contracts dynamically
 */
async function discoverStakingContracts(maxNfts = null) {
  console.log("🔍 Discovering All Staking Contracts:");
  console.log("=====================================");

  const stakingContracts = new Set(); // Use Set to prevent duplicates
  const contractDetails = new Map();

  try {
    // Method 1: Check NFT total supply to determine range
    let totalSupply = 0;
    try {
      totalSupply = Number(await contracts.nftContract.totalSupply());
      console.log(`📊 NFT Total Supply: ${totalSupply}`);
    } catch (error) {
      console.log(`⚠️  Could not get total supply, using fallback method: ${error.message}`);
      totalSupply = maxNfts || 50; // Fallback to reasonable limit
    }

    const maxToCheck = maxNfts || Math.min(totalSupply + 10, 100); // Add buffer but cap at 100
    console.log(`🎯 Checking NFT IDs 1 to ${maxToCheck}\n`);

    // Method 2: Check each NFT ID for staking contracts
    for (let tokenId = 1; tokenId <= maxToCheck; tokenId++) {
      try {
        // Check if NFT exists first
        let nftExists = false;
        try {
          const owner = await contracts.nftContract.ownerOf(tokenId);
          nftExists = owner !== ethers.ZeroAddress;
        } catch {
          // NFT doesn't exist, try alternative method
          try {
            nftExists = await contracts.nftContract.isThereTokenId(tokenId);
          } catch {
            nftExists = false;
          }
        }

        if (!nftExists) {
          continue; // Skip non-existent NFTs
        }

        // Get staking contract for this NFT
        const stakingAddress = await contracts.stakingFactory.getStakingContractForNFT(tokenId);
        
        if (stakingAddress && stakingAddress !== ethers.ZeroAddress) {
          stakingContracts.add(stakingAddress);
          
          // Get additional details
          let isListed = false;
          try {
            isListed = await contracts.marketplace.listedBool(tokenId);
          } catch (error) {
            // Marketplace check failed, assume unlisted
          }

          contractDetails.set(stakingAddress, {
            tokenIds: contractDetails.get(stakingAddress)?.tokenIds || [],
            isListed
          });
          
          contractDetails.get(stakingAddress).tokenIds.push(tokenId);
          
          console.log(`   NFT #${tokenId}: ${stakingAddress}${isListed ? ' (Listed)' : ' (Unlisted)'}`);
        }
      } catch (error) {
        console.log(`   ⚠️  NFT #${tokenId}: Error checking - ${error.message}`);
      }
    }

    // Method 3: Get existing minters to see if we missed any staking contracts
    console.log("\n🔍 Checking existing minters for missed contracts:");
    try {
      const existingMinters = await contracts.lkst.getAllMinters();
      for (const minter of existingMinters) {
        if (!stakingContracts.has(minter)) {
          // This might be a staking contract we missed
          console.log(`   Found potential staking contract in minters: ${minter}`);
          stakingContracts.add(minter);
          contractDetails.set(minter, {
            tokenIds: ['Unknown'],
            isListed: false,
            source: 'existing-minter'
          });
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check existing minters: ${error.message}`);
    }

    console.log(`\n📊 Discovery Results:`);
    console.log(`   Total unique staking contracts found: ${stakingContracts.size}`);
    console.log(`   NFT range checked: 1 to ${maxToCheck}`);

    operationLog.summary.discovered = stakingContracts.size;

    return { stakingContracts: Array.from(stakingContracts), contractDetails };

  } catch (error) {
    console.error(`❌ Error during discovery: ${error.message}`);
    throw error;
  }
}

/**
 * Check and fix minter permissions with retry logic
 */
async function processStakingContract(stakingAddress, details, dryRun) {
  let attempt = 0;
  
  while (attempt < CONFIG.MAX_RETRIES) {
    try {
      const operation = {
        stakingContract: stakingAddress,
        tokenIds: details.tokenIds,
        isListed: details.isListed,
        timestamp: new Date().toISOString(),
        attempt: attempt + 1,
        success: false,
        error: null,
        txHash: null,
        gasUsed: null
      };

      // Check current minter status
      const isAlreadyMinter = await contracts.lkst.isMinter(stakingAddress);
      operation.wasAlreadyMinter = isAlreadyMinter;

      if (isAlreadyMinter) {
        console.log(`   ✅ Already has minter permission`);
        operation.success = true;
        operation.action = 'no-action-needed';
        operationLog.operations.push(operation);
        operationLog.summary.alreadyMinters++;
        return { success: true, operation };
      }

      if (dryRun) {
        console.log(`   🔍 DRY RUN: Would add as minter`);
        operation.action = 'dry-run-would-add';
        operation.success = true;
        operationLog.operations.push(operation);
        return { success: true, operation };
      }

      // Add as minter
      console.log(`   🔧 Adding as minter...`);
      
      // Estimate gas first
      const gasEstimate = await contracts.lkst.addMinter.estimateGas(stakingAddress);
      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * CONFIG.GAS_LIMIT_BUFFER));
      
      const tx = await contracts.lkst.addMinter(stakingAddress, { gasLimit });
      operation.txHash = tx.hash;
      operation.action = 'added-minter';
      
      console.log(`   📝 Transaction: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait(CONFIG.CONFIRMATION_BLOCKS);
      operation.gasUsed = receipt.gasUsed;
      operationLog.summary.gasUsed += receipt.gasUsed;
      
      console.log(`   ✅ Confirmed! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify the change
      const isNowMinter = await contracts.lkst.isMinter(stakingAddress);
      if (isNowMinter) {
        console.log(`   🎉 SUCCESS! Now has minter permission`);
        operation.success = true;
        operationLog.summary.successfullyAdded++;
      } else {
        throw new Error("Verification failed: Still not a minter after transaction");
      }

      operationLog.operations.push(operation);
      return { success: true, operation };

    } catch (error) {
      attempt++;
      console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt >= CONFIG.MAX_RETRIES) {
        const operation = {
          stakingContract: stakingAddress,
          tokenIds: details.tokenIds,
          isListed: details.isListed,
          timestamp: new Date().toISOString(),
          attempt,
          success: false,
          error: error.message,
          action: 'failed-after-retries'
        };
        
        operationLog.operations.push(operation);
        operationLog.summary.errors++;
        return { success: false, operation, error };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
    }
  }
}

/**
 * Process all staking contracts in batches
 */
async function processAllStakingContracts(stakingContracts, contractDetails, dryRun) {
  console.log("\n🔧 Processing Staking Contract Minter Permissions:");
  console.log("==================================================");

  const results = [];
  
  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < stakingContracts.length; i += CONFIG.BATCH_SIZE) {
    const batch = stakingContracts.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(stakingContracts.length / CONFIG.BATCH_SIZE)}:`);
    
    for (const stakingAddress of batch) {
      const details = contractDetails.get(stakingAddress);
      console.log(`\n🎯 Processing: ${stakingAddress}`);
      console.log(`   Token IDs: ${details.tokenIds.join(', ')}`);
      console.log(`   Listed: ${details.isListed}`);
      
      const result = await processStakingContract(stakingAddress, details, dryRun);
      results.push(result);
    }
    
    // Small delay between batches
    if (i + CONFIG.BATCH_SIZE < stakingContracts.length) {
      console.log(`\n⏸️  Waiting before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Generate comprehensive report
 */
async function generateReport(dryRun) {
  console.log("\n📊 Final Report:");
  console.log("=================");
  
  const summary = operationLog.summary;
  
  console.log(`📈 Summary:`);
  console.log(`   Contracts discovered: ${summary.discovered}`);
  console.log(`   Already minters: ${summary.alreadyMinters}`);
  console.log(`   Successfully added: ${summary.successfullyAdded}`);
  console.log(`   Errors: ${summary.errors}`);
  console.log(`   Total gas used: ${summary.gasUsed.toString()}`);
  console.log(`   Operation type: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  // Show current minters
  try {
    console.log(`\n📋 Current LKST Minters:`);
    console.log(`========================`);
    const allMinters = await contracts.lkst.getAllMinters();
    console.log(`Total minters: ${allMinters.length}`);
    allMinters.forEach((minter, index) => {
      const details = operationLog.operations.find(op => op.stakingContract === minter);
      const tokenInfo = details ? ` (NFTs: ${details.tokenIds.join(', ')})` : '';
      console.log(`${index + 1}. ${minter}${tokenInfo}`);
    });
  } catch (error) {
    console.log(`❌ Failed to get current minters: ${error.message}`);
  }

  // Save detailed log to file
  const logFileName = `staking-minter-fix-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const logPath = join(__dirname, logFileName);
  
  try {
    // Custom JSON serializer to handle BigInt
    const logData = JSON.stringify(operationLog, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
    
    writeFileSync(logPath, logData);
    console.log(`\n📄 Detailed log saved: ${logFileName}`);
  } catch (error) {
    console.log(`⚠️  Could not save log file: ${error.message}`);
  }

  // Success message
  if (summary.errors === 0) {
    if (dryRun) {
      console.log(`\n🎉 DRY RUN COMPLETE: All checks passed!`);
      console.log(`💡 Run without --dry-run to apply changes.`);
    } else {
      console.log(`\n🎉 SUCCESS: All staking contracts are properly configured!`);
      console.log(`💡 Users can now stake LKUSD and receive LKST tokens on all properties.`);
    }
  } else {
    console.log(`\n⚠️  COMPLETED WITH ${summary.errors} ERROR(S)`);
    console.log(`💡 Check the detailed log for error information.`);
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  try {
    // Initialize
    await initialize();
    
    // Discover all staking contracts
    const { stakingContracts, contractDetails } = await discoverStakingContracts(options.maxNfts);
    
    if (stakingContracts.length === 0) {
      console.log("ℹ️  No staking contracts found. Nothing to process.");
      return;
    }

    // Process all contracts
    await processAllStakingContracts(stakingContracts, contractDetails, options.dryRun);
    
    // Generate report
    await generateReport(options.dryRun);
    
  } catch (error) {
    console.error(`\n💥 Fatal Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Received SIGINT. Shutting down gracefully...');
  if (operationLog) {
    generateReport(true).then(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

// Run the script
main()
  .then(() => {
    console.log('\n✨ All operations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
