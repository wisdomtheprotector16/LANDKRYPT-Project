// LandKrypt Staking Debug Script
// This script identifies issues with the staking functionality

import { ethers } from 'ethers';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Contract ABIs
const LKUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

const NFT_STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function totalStaked() external view returns (uint256)",
  "function targetAmount() external view returns (uint256)",
  "function stakers(address) external view returns (uint256 amount, uint256 lastClaimDay, uint256 accumulatedRewards, uint256 finalRewardEligibleAmount)",
  "function returnTokenId() external view returns (uint256)"
];

const STAKING_FACTORY_ABI = [
  "function getStakingContractForNFT(uint256 tokenId) external view returns (address)"
];

// Contract addresses
const ADDRESSES = {
  LKUSD: process.env.NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS,
  STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
};

async function main() {
  console.log("🔍 LandKrypt Staking Debug Analysis");
  console.log("===================================\n");

  // Setup provider (using Alchemy)
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  console.log("🌐 Connected to Sepolia network");

  // For testing, we'll use a known wallet address or create a test one
  // In production, this would be the user's connected wallet
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  console.log(`👤 Test Wallet: ${wallet.address}`);

  // Get wallet ETH balance
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

  // Connect to contracts
  const lkusdContract = new ethers.Contract(ADDRESSES.LKUSD, LKUSD_ABI, wallet);
  const stakingFactory = new ethers.Contract(ADDRESSES.STAKING_FACTORY, STAKING_FACTORY_ABI, wallet);

  console.log("📋 Contract Information:");
  console.log("=======================");
  console.log(`LKUSD Address: ${ADDRESSES.LKUSD}`);
  console.log(`Staking Factory: ${ADDRESSES.STAKING_FACTORY}\n`);

  // Check LKUSD balance
  try {
    const lkusdBalance = await lkusdContract.balanceOf(wallet.address);
    const decimals = await lkusdContract.decimals();
    console.log(`💰 LKUSD Balance: ${ethers.formatUnits(lkusdBalance, decimals)} LKUSD`);
    
    if (lkusdBalance === 0n) {
      console.log("❌ Error: No LKUSD tokens in wallet!");
      console.log("💡 Solution: Get LKUSD from the exchange first\n");
      
      // Show how to get LKUSD
      console.log("🔄 To get LKUSD:");
      console.log("1. Go to the Exchange page");
      console.log("2. Swap ETH for LKUSD");
      console.log("3. Then try staking again\n");
      return;
    }
  } catch (error) {
    console.log(`❌ Failed to check LKUSD balance: ${error.message}`);
    return;
  }

  // Get a test staking contract address (for NFT ID 1)
  console.log("🔍 Finding Staking Contract:");
  console.log("============================");
  
  let stakingContractAddress;
  try {
    stakingContractAddress = await stakingFactory.getStakingContractForNFT(1);
    console.log(`Staking Contract for NFT #1: ${stakingContractAddress}`);
    
    if (stakingContractAddress === '0x0000000000000000000000000000000000000000') {
      console.log("❌ No staking contract found for NFT #1");
      console.log("💡 This NFT may not be listed for staking yet\n");
      return;
    }
  } catch (error) {
    console.log(`❌ Failed to get staking contract: ${error.message}`);
    return;
  }

  // Connect to the staking contract
  const stakingContract = new ethers.Contract(stakingContractAddress, NFT_STAKING_ABI, wallet);

  // Get staking contract info
  console.log("\n📊 Staking Contract Status:");
  console.log("===========================");
  
  try {
    const totalStaked = await stakingContract.totalStaked();
    const targetAmount = await stakingContract.targetAmount();
    const tokenId = await stakingContract.returnTokenId();
    
    console.log(`Token ID: ${tokenId}`);
    console.log(`Total Staked: ${ethers.formatEther(totalStaked)} LKUSD`);
    console.log(`Target Amount: ${ethers.formatEther(targetAmount)} LKUSD`);
    console.log(`Progress: ${((parseFloat(ethers.formatEther(totalStaked)) / parseFloat(ethers.formatEther(targetAmount))) * 100).toFixed(2)}%`);
  } catch (error) {
    console.log(`❌ Failed to read staking contract: ${error.message}`);
    return;
  }

  // Check user's current stake
  try {
    const stakerInfo = await stakingContract.stakers(wallet.address);
    console.log(`Your Current Stake: ${ethers.formatEther(stakerInfo[0])} LKUSD`);
  } catch (error) {
    console.log(`❌ Failed to read staker info: ${error.message}`);
  }

  // Check allowance
  console.log("\n🔐 Approval Status:");
  console.log("===================");
  
  try {
    const currentAllowance = await lkusdContract.allowance(wallet.address, stakingContractAddress);
    console.log(`Current Allowance: ${ethers.formatEther(currentAllowance)} LKUSD`);
    
    const testAmount = ethers.parseEther("1.0"); // 1 LKUSD test
    
    if (currentAllowance < testAmount) {
      console.log(`⚠️  Need to approve at least ${ethers.formatEther(testAmount)} LKUSD`);
      
      // Test approval simulation
      console.log("\n🧪 Testing Approval Transaction:");
      console.log("================================");
      
      try {
        const gasEstimate = await lkusdContract.approve.estimateGas(stakingContractAddress, testAmount);
        console.log(`✅ Approval gas estimate: ${gasEstimate.toString()}`);
      } catch (error) {
        console.log(`❌ Approval would fail: ${error.message}`);
        return;
      }
    } else {
      console.log("✅ Sufficient allowance exists");
    }
  } catch (error) {
    console.log(`❌ Failed to check allowance: ${error.message}`);
    return;
  }

  // Test staking simulation
  console.log("\n🧪 Testing Staking Transaction:");
  console.log("===============================");
  
  const testStakeAmount = ethers.parseEther("0.1"); // Small test amount
  
  try {
    // Check if we have enough balance
    const lkusdBalance = await lkusdContract.balanceOf(wallet.address);
    if (lkusdBalance < testStakeAmount) {
      console.log(`❌ Insufficient balance for test stake`);
      console.log(`Required: ${ethers.formatEther(testStakeAmount)} LKUSD`);
      console.log(`Available: ${ethers.formatEther(lkusdBalance)} LKUSD`);
      return;
    }

    // Check allowance for test amount
    const allowance = await lkusdContract.allowance(wallet.address, stakingContractAddress);
    if (allowance < testStakeAmount) {
      console.log("⚠️  Approval needed for test stake");
      
      // Perform approval
      console.log("📝 Performing approval...");
      const approveTx = await lkusdContract.approve(stakingContractAddress, testStakeAmount);
      console.log(`Approval tx hash: ${approveTx.hash}`);
      
      console.log("⏳ Waiting for approval confirmation...");
      await approveTx.wait();
      console.log("✅ Approval confirmed");
    }

    // Test stake transaction
    console.log("📝 Testing stake transaction...");
    const gasEstimate = await stakingContract.stake.estimateGas(testStakeAmount);
    console.log(`✅ Stake gas estimate: ${gasEstimate.toString()}`);
    
    // Actually perform the stake (if you want to test for real)
    console.log("\n⚠️  Ready to perform actual stake test?");
    console.log("This will use real tokens. Set PERFORM_REAL_STAKE=true in script to proceed.");
    
    const PERFORM_REAL_STAKE = true; // Set to true to actually stake
    
    if (PERFORM_REAL_STAKE) {
      console.log("🚀 Performing actual stake...");
      const stakeTx = await stakingContract.stake(testStakeAmount);
      console.log(`Stake tx hash: ${stakeTx.hash}`);
      
      console.log("⏳ Waiting for stake confirmation...");
      const receipt = await stakeTx.wait();
      console.log("✅ Stake confirmed!");
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Check updated balance
      const newStakerInfo = await stakingContract.stakers(wallet.address);
      console.log(`Updated stake: ${ethers.formatEther(newStakerInfo[0])} LKUSD`);
    } else {
      console.log("💡 To perform real stake, set PERFORM_REAL_STAKE=true in the script");
    }
    
  } catch (error) {
    console.log(`❌ Staking test failed: ${error.message}`);
    
    // Analyze the error
    if (error.message.includes("transferFrom")) {
      console.log("\n🔍 Error Analysis: transferFrom failed");
      console.log("Possible causes:");
      console.log("1. Insufficient LKUSD balance");
      console.log("2. Insufficient allowance");
      console.log("3. LKUSD contract issue");
      console.log("4. Staking contract not authorized");
    } else if (error.message.includes("Staking goal exceeded")) {
      console.log("\n🔍 Error Analysis: Staking goal exceeded");
      console.log("The target amount for this NFT has been reached");
    } else if (error.message.includes("Must stake more than 0")) {
      console.log("\n🔍 Error Analysis: Invalid stake amount");
      console.log("The stake amount must be greater than 0");
    }
  }

  console.log("\n✨ Debug analysis completed!");
}

// Run the debug script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Debug failed:", error);
    process.exit(1);
  });
