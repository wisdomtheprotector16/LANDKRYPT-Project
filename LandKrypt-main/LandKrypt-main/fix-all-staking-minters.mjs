// Script to fix all staking contract minter permission issues
import { ethers } from 'ethers';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Contract ABIs
const LKST_ABI = [
  "function addMinter(address account) external",
  "function isMinter(address account) external view returns (bool)",
  "function getAllMinters() external view returns (address[] memory)",
  "function owner() external view returns (address)"
];

const STAKING_FACTORY_ABI = [
  "function getStakingContractForNFT(uint256 tokenId) external view returns (address)"
];

// Contract addresses
const ADDRESSES = {
  LKST: process.env.NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS,
  STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
};

async function main() {
  console.log("🔧 Fixing All Staking Contract Minter Permissions");
  console.log("===============================================\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  
  console.log(`👤 Wallet: ${wallet.address}`);
  console.log(`🌐 Network: Sepolia\n`);

  // Connect to contracts
  const lkstContract = new ethers.Contract(ADDRESSES.LKST, LKST_ABI, wallet);
  const stakingFactory = new ethers.Contract(ADDRESSES.STAKING_FACTORY, STAKING_FACTORY_ABI, wallet);

  console.log("📋 Contract Addresses:");
  console.log("=====================");
  console.log(`LKST: ${ADDRESSES.LKST}`);
  console.log(`Staking Factory: ${ADDRESSES.STAKING_FACTORY}\n`);

  // Check current owner
  try {
    const owner = await lkstContract.owner();
    console.log(`📜 LKST Contract Owner: ${owner}`);
    console.log(`🔑 Our Wallet: ${wallet.address}`);
    console.log(`✅ Is Owner: ${owner.toLowerCase() === wallet.address.toLowerCase()}\n`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log("❌ Error: You are not the owner of the LKST contract!");
      console.log("💡 You need to use the owner wallet to add minters.");
      return;
    }
  } catch (error) {
    console.log(`❌ Failed to check owner: ${error.message}`);
    return;
  }

  // Process all NFT token IDs (1-6)
  console.log("🔍 Processing All Staking Contracts:");
  console.log("===================================");
  
  const tokenIds = [1, 2, 3, 4, 5, 6];
  let successCount = 0;
  let alreadyMinterCount = 0;
  let errorCount = 0;

  for (const tokenId of tokenIds) {
    console.log(`\n🎯 Processing NFT #${tokenId}:`);
    
    try {
      // Get staking contract address for this NFT
      const stakingContractAddress = await stakingFactory.getStakingContractForNFT(tokenId);
      console.log(`   Staking Contract: ${stakingContractAddress}`);
      
      if (stakingContractAddress === '0x0000000000000000000000000000000000000000') {
        console.log("   ❌ No staking contract found for this NFT");
        errorCount++;
        continue;
      }

      // Check if it's already a minter
      const isAlreadyMinter = await lkstContract.isMinter(stakingContractAddress);
      console.log(`   Is Minter: ${isAlreadyMinter}`);

      if (isAlreadyMinter) {
        console.log("   ✅ Already has minter permission");
        alreadyMinterCount++;
        continue;
      }

      // Add as minter
      console.log("   🔧 Adding as minter...");
      const tx = await lkstContract.addMinter(stakingContractAddress);
      console.log(`   📝 Transaction: ${tx.hash}`);
      
      console.log("   ⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify
      const isNowMinter = await lkstContract.isMinter(stakingContractAddress);
      if (isNowMinter) {
        console.log("   🎉 SUCCESS! Now has minter permission");
        successCount++;
      } else {
        console.log("   ❌ FAILED! Still not a minter");
        errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing NFT #${tokenId}: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log("===========");
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`🔄 Already minters: ${alreadyMinterCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${tokenIds.length}`);

  // Show all current minters
  try {
    console.log("\n📋 Current LKST Minters:");
    console.log("========================");
    const allMinters = await lkstContract.getAllMinters();
    console.log(`Total minters: ${allMinters.length}`);
    allMinters.forEach((minter, index) => {
      console.log(`${index + 1}. ${minter}`);
    });
  } catch (error) {
    console.log(`❌ Failed to get all minters: ${error.message}`);
  }

  if (successCount > 0 || alreadyMinterCount > 0) {
    console.log("\n🎉 Staking should now work for all properties!");
    console.log("💡 Users can now stake LKUSD and receive LKST tokens.");
  }

  console.log("\n✨ All staking contract minter fixes completed!");
}

// Run the fix
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fix failed:", error);
    process.exit(1);
  });
