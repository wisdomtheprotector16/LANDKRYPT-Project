// Script to fix the staking contract minter permission issue
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
  console.log("🔧 Fixing Staking Contract Minter Permissions");
  console.log("===========================================\n");

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
  } catch (error) {
    console.log(`❌ Failed to check owner: ${error.message}`);
    return;
  }

// Add all staking contracts for minter access
  try {
    // Fetch staking contracts from the marketplace
    const stakingContracts = [1, 2, 3, 4, 5, 6].map(async (tokenId) => {
      const stakingContractAddress = await stakingFactory.getStakingContractForNFT(tokenId);
      return stakingContractAddress; 
    });

    await Promise.all(stakingContracts);
    
    for (const stakingContractAddress of stakingContracts) {
      console.log(`🎯 Staking Contract: ${stakingContractAddress}`);

      if (stakingContractAddress === '0x0000000000000000000000000000000000000000') {
        console.log("❌ No valid staking contract");
        continue;
      }

      // Check and add as minter
      const isAlreadyMinter = await lkstContract.isMinter(stakingContractAddress);
      console.log(`  Is Minter: ${isAlreadyMinter}`);

      if (!isAlreadyMinter) {
        const tx = await lkstContract.addMinter(stakingContractAddress);
        console.log(`📝 Transaction sent for ${stakingContractAddress}: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Stake Contract Permission Updated!");
      } else {
        console.log("Already has minter permission.");
      }
    }

  } catch (error) {
  let stakingContractAddress;
  try {
    stakingContractAddress = await stakingFactory.getStakingContractForNFT(1);
    console.log(`🎯 Staking Contract for NFT #1: ${stakingContractAddress}\n`);
    
    if (stakingContractAddress === '0x0000000000000000000000000000000000000000') {
      console.log("❌ No staking contract found for NFT #1");
      return;
    }
  } catch (error) {
    console.log(`❌ Failed to get staking contract: ${error.message}`);
    return;
  }


  // Add staking contract as minter
  console.log("🔧 Adding staking contract as minter...");
  try {
    const tx = await lkstContract.addMinter(stakingContractAddress);
    console.log(`📝 Transaction sent: ${tx.hash}`);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}\n`);
    
    // Verify the change
    const isNowMinter = await lkstContract.isMinter(stakingContractAddress);
    console.log(`🔍 Verification:`);
    console.log(`   Staking Contract is now minter: ${isNowMinter}`);
    
    if (isNowMinter) {
      console.log("🎉 SUCCESS! Staking contract can now mint LKST tokens!");
      console.log("\n💡 You can now try staking again. The error should be resolved.");
    } else {
      console.log("❌ FAILED! Something went wrong during the transaction.");
    }
    
  } catch (error) {
    console.log(`❌ Failed to add minter: ${error.message}`);
    
    if (error.message.includes('Ownable: caller is not the owner')) {
      console.log("\n💡 You need to use the owner wallet to add minters.");
      console.log("   Check who owns the LKST contract and use that wallet instead.");
    }
  }

  console.log("\n✨ Fix attempt completed!");
}

// Run the fix
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fix failed:", error);
    process.exit(1);
  });
