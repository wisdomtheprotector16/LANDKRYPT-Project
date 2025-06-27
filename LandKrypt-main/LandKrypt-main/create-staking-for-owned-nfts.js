// Generalized Staking Contract Creator
// Discovers all RealEstateNFTs owned by the calling address and creates staking contracts
const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

// Default configuration (can be overridden via command line arguments)
const DEFAULT_CONFIG = {
    LISTING_PRICE: "200000", // 200,000 LKUSD (in ether units)
    TARGET_AMOUNT: "200000", // Same as listing price by default
    MAX_TOKEN_ID_SCAN: 1000,  // Maximum token ID to scan for ownership
    GAS_BUFFER_PERCENT: 20    // Gas estimation buffer percentage
};

// Contract addresses from environment
const CONTRACT_ADDRESSES = {
    STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
    REAL_ESTATE_NFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
};

/**
 * Parse command line arguments
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const config = { ...DEFAULT_CONFIG };
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];
        
        switch (key) {
            case '--listing-price':
                config.LISTING_PRICE = value;
                break;
            case '--target-amount':
                config.TARGET_AMOUNT = value;
                break;
            case '--max-scan':
                config.MAX_TOKEN_ID_SCAN = parseInt(value);
                break;
            case '--gas-buffer':
                config.GAS_BUFFER_PERCENT = parseInt(value);
                break;
            case '--help':
                console.log(`
Usage: node create-staking-for-owned-nfts.js [options]

Options:
  --listing-price <amount>   Listing price in LKUSD (default: 200000)
  --target-amount <amount>   Target staking amount (default: same as listing price)
  --max-scan <number>        Maximum token ID to scan (default: 1000)
  --gas-buffer <percent>     Gas estimation buffer percentage (default: 20)
  --help                     Show this help message

Examples:
  node create-staking-for-owned-nfts.js
  node create-staking-for-owned-nfts.js --listing-price 150000 --target-amount 150000
  node create-staking-for-owned-nfts.js --max-scan 500 --gas-buffer 30
                `);
                process.exit(0);
                break;
        }
    }
    
    // If target amount not specified, use listing price
    if (config.TARGET_AMOUNT === DEFAULT_CONFIG.TARGET_AMOUNT && config.LISTING_PRICE !== DEFAULT_CONFIG.LISTING_PRICE) {
        config.TARGET_AMOUNT = config.LISTING_PRICE;
    }
    
    return config;
}

/**
 * Discover all NFTs owned by the given address
 */
async function discoverOwnedNFTs(realEstateNFT, ownerAddress, maxTokenId) {
    console.log(`🔍 Scanning for NFTs owned by ${ownerAddress}...`);
    console.log(`   Scanning token IDs 1 to ${maxTokenId}...`);
    
    const ownedNFTs = [];
    const batchSize = 50; // Process in batches to avoid RPC rate limits
    
    for (let start = 1; start <= maxTokenId; start += batchSize) {
        const end = Math.min(start + batchSize - 1, maxTokenId);
        const promises = [];
        
        // Create batch of ownership checks
        for (let tokenId = start; tokenId <= end; tokenId++) {
            promises.push(
                realEstateNFT.ownerOf(tokenId)
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
    
    console.log(`✅ Discovery complete! Found ${ownedNFTs.length} NFTs owned by ${ownerAddress}`);
    return ownedNFTs;
}

/**
 * Get NFT metadata for display
 */
async function getNFTMetadata(realEstateNFT, tokenId) {
    try {
        const description = await realEstateNFT.getTokenDescription(tokenId);
        return description;
    } catch (error) {
        return `NFT #${tokenId}`;
    }
}

/**
 * Main function
 */
async function main() {
    const config = parseArguments();
    const [caller] = await ethers.getSigners();
    
    console.log(`\n🏗️  Generalized Staking Contract Creator`);
    console.log(`👤 Caller: ${caller.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await caller.provider.getBalance(caller.address))} ETH\n`);

    // Validate contract addresses
    if (!CONTRACT_ADDRESSES.STAKING_FACTORY || !CONTRACT_ADDRESSES.REAL_ESTATE_NFT) {
        throw new Error("Missing contract addresses in environment file. Please run deployment first.");
    }

    // Parse configuration
    const listingPrice = ethers.parseEther(config.LISTING_PRICE);
    const targetAmount = ethers.parseEther(config.TARGET_AMOUNT);

    console.log("📋 Configuration:");
    console.log(`   StakingFactory: ${CONTRACT_ADDRESSES.STAKING_FACTORY}`);
    console.log(`   RealEstateNFT: ${CONTRACT_ADDRESSES.REAL_ESTATE_NFT}`);
    console.log(`   Listing Price: ${config.LISTING_PRICE} LKUSD`);
    console.log(`   Target Amount: ${config.TARGET_AMOUNT} LKUSD`);
    console.log(`   Max Scan Range: 1-${config.MAX_TOKEN_ID_SCAN}`);
    console.log(`   Gas Buffer: ${config.GAS_BUFFER_PERCENT}%\n`);

    // Get contract instances
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await StakingFactory.attach(CONTRACT_ADDRESSES.STAKING_FACTORY);

    const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
    const realEstateNFT = await RealEstateNFT.attach(CONTRACT_ADDRESSES.REAL_ESTATE_NFT);

    // Discover owned NFTs
    const ownedNFTs = await discoverOwnedNFTs(realEstateNFT, caller.address, config.MAX_TOKEN_ID_SCAN);
    
    if (ownedNFTs.length === 0) {
        console.log("❌ No NFTs found owned by your address.");
        console.log("💡 Make sure you have minted NFTs or check the scan range with --max-scan parameter.");
        return;
    }

    console.log(`\n📦 Found ${ownedNFTs.length} NFTs to process:`);
    for (const tokenId of ownedNFTs) {
        const description = await getNFTMetadata(realEstateNFT, tokenId);
        console.log(`   NFT #${tokenId}: ${description}`);
    }
    console.log("");

    // Process each NFT
    const results = [];
    let totalGasUsed = 0n;
    
    for (const tokenId of ownedNFTs) {
        try {
            console.log(`🔄 Processing NFT #${tokenId}...`);
            const description = await getNFTMetadata(realEstateNFT, tokenId);

            // Check if staking contract already exists
            const existingStakingContract = await stakingFactory.getStakingContractForNFT(tokenId);
            if (existingStakingContract !== ethers.ZeroAddress) {
                console.log(`   ℹ️  Staking contract already exists: ${existingStakingContract}`);
                results.push({
                    tokenId,
                    description,
                    status: 'already_exists',
                    stakingContract: existingStakingContract
                });
                continue;
            }

            console.log(`   📝 Description: ${description}`);
            console.log(`   💰 Creating staking contract...`);

            // Estimate gas (ethers v6 syntax)
            const gasEstimate = await stakingFactory.createStakingContract.estimateGas(
                tokenId,
                targetAmount,
                listingPrice
            );

            const gasLimit = gasEstimate * BigInt(100 + config.GAS_BUFFER_PERCENT) / 100n;
            console.log(`   ⛽ Gas estimate: ${gasEstimate.toString()} (limit: ${gasLimit.toString()})`);

            // Create staking contract
            const tx = await stakingFactory.createStakingContract(
                tokenId,
                targetAmount,
                listingPrice,
                { gasLimit }
            );

            console.log(`   📤 Transaction: ${tx.hash}`);
            console.log(`   ⏳ Waiting for confirmation...`);

            const receipt = await tx.wait();
            console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

            totalGasUsed = totalGasUsed + receipt.gasUsed;

            // Extract staking contract address from events
            const stakingContractCreatedEvent = receipt.events?.find(
                event => event.event === 'StakingContractCreated'
            );

            let stakingContractAddress = null;
            if (stakingContractCreatedEvent) {
                stakingContractAddress = stakingContractCreatedEvent.args.stakingContract;
                console.log(`   🎯 Staking contract: ${stakingContractAddress}`);
            }

            results.push({
                tokenId,
                description,
                status: 'success',
                stakingContract: stakingContractAddress,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            });

            console.log(`   ✨ Success!\n`);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
            
            results.push({
                tokenId,
                description: await getNFTMetadata(realEstateNFT, tokenId),
                status: 'error',
                error: error.message
            });
        }
    }

    // Generate summary
    console.log("📊 SUMMARY");
    console.log("=" .repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const existing = results.filter(r => r.status === 'already_exists');
    const failed = results.filter(r => r.status === 'error');

    console.log(`📈 Total NFTs processed: ${results.length}`);
    console.log(`✅ Successfully created: ${successful.length}`);
    console.log(`ℹ️  Already existed: ${existing.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
    console.log("");

    if (successful.length > 0) {
        console.log("🎯 Newly Created Staking Contracts:");
        successful.forEach(result => {
            console.log(`   NFT #${result.tokenId}: ${result.stakingContract}`);
            console.log(`   Description: ${result.description}`);
            console.log(`   Transaction: ${result.txHash}`);
            console.log("");
        });
    }

    if (existing.length > 0) {
        console.log("📋 Pre-existing Staking Contracts:");
        existing.forEach(result => {
            console.log(`   NFT #${result.tokenId}: ${result.stakingContract}`);
            console.log(`   Description: ${result.description}`);
        });
        console.log("");
    }

    if (failed.length > 0) {
        console.log("⚠️  Failed Operations:");
        failed.forEach(result => {
            console.log(`   NFT #${result.tokenId}: ${result.error}`);
            console.log(`   Description: ${result.description}`);
        });
        console.log("");
    }

    // Save detailed report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(__dirname, 'records', `staking-creation-${timestamp}.json`);
    
    const reportData = {
        timestamp: new Date().toISOString(),
        caller: caller.address,
        configuration: {
            listingPrice: config.LISTING_PRICE,
            targetAmount: config.TARGET_AMOUNT,
            maxScanRange: config.MAX_TOKEN_ID_SCAN,
            gasBufferPercent: config.GAS_BUFFER_PERCENT
        },
        discovery: {
            totalNFTsFound: ownedNFTs.length,
            nftIds: ownedNFTs
        },
        results,
        summary: {
            total: results.length,
            successful: successful.length,
            existing: existing.length,
            failed: failed.length,
            totalGasUsed: totalGasUsed.toString()
        }
    };

    // Ensure records directory exists
    const recordsDir = path.join(__dirname, 'records');
    if (!fs.existsSync(recordsDir)) {
        fs.mkdirSync(recordsDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));
    console.log(`📁 Detailed report saved to: ${outputFile}`);

    console.log("\n🚀 Staking Contract Creation Complete! 🚀");
    
    if (successful.length > 0) {
        console.log("\n💡 Next Steps:");
        console.log("   1. Users can now stake LKUSD on these properties");
        console.log("   2. When target amount is reached, NFT will be purchased automatically");
        console.log("   3. Stakers will earn LKST governance tokens");
        console.log("   4. Use the marketplace UI to view and interact with these properties");
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("⚠️ Script Failed:", error);
        console.error(error.stack);
        process.exit(1);
    });
