// LandKrypt Staking Test & Diagnostic Script
// This script tests all staking-related functionality

const { ethers } = require('hardhat');
require('dotenv').config();

// Contract ABIs - simplified for testing
const NFT_STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function withdrawStake() external", 
  "function claimDailyRewards() external",
  "function balanceOf(address account) external view returns (uint256)",
  "function earned(address account) external view returns (uint256)",
  "function totalStaked() external view returns (uint256)",
  "function targetAmount() external view returns (uint256)",
  "function returnTokenId() external view returns (uint256)"
];

const LKUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// Contract addresses from environment
const ADDRESSES = {
  LKUSD: process.env.NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS,
  LKST: process.env.NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS,
  NFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
  MARKETPLACE: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
  STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
  EXCHANGE: process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS
};

async function main() {
  console.log("🔍 LandKrypt Staking Diagnostic Test");
  console.log("=====================================\n");

  // Get network and signer
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Test Account: ${signer.address}`);
  console.log(`💰 ETH Balance: ${ethers.formatEther(await ethers.provider.getBalance(signer.address))} ETH\n`);

  // Validate contract addresses
  console.log("📋 Contract Addresses:");
  console.log("======================");
  for (const [name, address] of Object.entries(ADDRESSES)) {
    console.log(`${name}: ${address || 'NOT SET'}`);
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      console.log(`❌ ${name} address is invalid!`);
    }
  }
  console.log();

  // Test contract connectivity
  console.log("🔗 Testing Contract Connectivity:");
  console.log("==================================");
  
  let lkusdContract, testStakingContract;

  try {
    // Connect to LKUSD contract
    lkusdContract = new ethers.Contract(ADDRESSES.LKUSD, LKUSD_ABI, signer);
    const lkusdBalance = await lkusdContract.balanceOf(signer.address);
    console.log(`✅ LKUSD Contract: Connected`);
    console.log(`   Balance: ${ethers.formatEther(lkusdBalance)} LKUSD`);

    if (lkusdBalance === 0n) {
      console.log(`⚠️  Warning: You have 0 LKUSD tokens. You may need to get some from the exchange first.`);
    }

  } catch (error) {
    console.log(`❌ LKUSD Contract: Failed to connect`);
    console.log(`   Error: ${error.message}`);
    return;
  }

  // For testing purposes, let's find or create a test staking contract
  // In practice, this would be passed from the StakingModal
  const TEST_STAKING_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual address
  
  try {
    if (TEST_STAKING_ADDRESS !== "0x1234567890123456789012345678901234567890") {
      testStakingContract = new ethers.Contract(TEST_STAKING_ADDRESS, NFT_STAKING_ABI, signer);
      
      // Test basic reads
      const totalStaked = await testStakingContract.totalStaked();
      const targetAmount = await testStakingContract.targetAmount();
      const userBalance = await testStakingContract.balanceOf(signer.address);
      const earnedRewards = await testStakingContract.earned(signer.address);
      
      console.log(`✅ Staking Contract: Connected`);
      console.log(`   Total Staked: ${ethers.formatEther(totalStaked)} LKUSD`);
      console.log(`   Target Amount: ${ethers.formatEther(targetAmount)} LKUSD`);
      console.log(`   Your Stake: ${ethers.formatEther(userBalance)} LKUSD`);
      console.log(`   Earned Rewards: ${ethers.formatEther(earnedRewards)} LKUSD`);
      
      // Test allowance
      const currentAllowance = await lkusdContract.allowance(signer.address, TEST_STAKING_ADDRESS);
      console.log(`   Current Allowance: ${ethers.formatEther(currentAllowance)} LKUSD`);
    } else {
      console.log(`⚠️  Test Staking Contract: Address not provided (this is expected for diagnostic)`);
    }
  } catch (error) {
    console.log(`❌ Staking Contract: Failed to connect`);
    console.log(`   Error: ${error.message}`);
  }

  console.log();

  // Test staking flow (simulation)
  console.log("🧪 Staking Flow Simulation:");
  console.log("============================");
  
  const testAmount = "1.0"; // 1 LKUSD for testing
  const amountWei = ethers.parseEther(testAmount);
  
  console.log(`Testing with amount: ${testAmount} LKUSD`);

  try {
    const lkusdBalance = await lkusdContract.balanceOf(signer.address);
    
    if (lkusdBalance < amountWei) {
      console.log(`❌ Insufficient LKUSD balance for test`);
      console.log(`   Required: ${testAmount} LKUSD`);
      console.log(`   Available: ${ethers.formatEther(lkusdBalance)} LKUSD`);
      console.log(`   💡 Tip: Use the exchange to get LKUSD first`);
    } else {
      console.log(`✅ Sufficient LKUSD balance for test`);
      
      if (testStakingContract) {
        // Check allowance
        const allowance = await lkusdContract.allowance(signer.address, TEST_STAKING_ADDRESS);
        
        if (allowance < amountWei) {
          console.log(`⚠️  Approval needed`);
          console.log(`   Current allowance: ${ethers.formatEther(allowance)} LKUSD`);
          console.log(`   Required allowance: ${testAmount} LKUSD`);
          
          // Simulate approval transaction
          console.log(`📝 Simulating approval transaction...`);
          const gasEstimate = await lkusdContract.approve.estimateGas(TEST_STAKING_ADDRESS, amountWei);
          console.log(`   Estimated gas for approval: ${gasEstimate.toString()}`);
        } else {
          console.log(`✅ Sufficient allowance already exists`);
        }
        
        // Simulate staking transaction
        console.log(`📝 Simulating staking transaction...`);
        try {
          const gasEstimate = await testStakingContract.stake.estimateGas(amountWei);
          console.log(`   Estimated gas for staking: ${gasEstimate.toString()}`);
        } catch (error) {
          console.log(`❌ Staking simulation failed: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Balance check failed: ${error.message}`);
  }

  console.log();

  // Network-specific checks
  console.log("🌐 Network Configuration:");
  console.log("==========================");
  
  const gasPrice = await ethers.provider.getFeeData();
  console.log(`Current Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} gwei`);
  console.log(`Max Fee Per Gas: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`Max Priority Fee: ${ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0n, "gwei")} gwei`);

  // Environment validation
  console.log("\n⚙️  Environment Validation:");
  console.log("============================");
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS',
    'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS',
    'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value && value !== '0x0000000000000000000000000000000000000000') {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing or invalid`);
    }
  }

  console.log();

  // Recommendations
  console.log("💡 Recommendations:");
  console.log("====================");
  
  if (!ADDRESSES.LKUSD || ADDRESSES.LKUSD === '0x0000000000000000000000000000000000000000') {
    console.log("❌ Deploy LKUSD contract first");
  }
  
  if (!ADDRESSES.STAKING_FACTORY || ADDRESSES.STAKING_FACTORY === '0x0000000000000000000000000000000000000000') {
    console.log("❌ Deploy Staking Factory contract");
  }
  
  console.log("✅ Ensure wallet is connected in frontend");
  console.log("✅ Ensure proper error handling in StakingModal component");
  console.log("✅ Test with small amounts first");
  console.log("✅ Check transaction on Etherscan after submission");

  console.log("\n🎯 Next Steps for Frontend:");
  console.log("============================");
  console.log("1. Verify wallet connection");
  console.log("2. Check contract addresses in wagmi config");
  console.log("3. Ensure proper RPC endpoint configuration");
  console.log("4. Test approval flow first");
  console.log("5. Then test staking flow");
  console.log("6. Add comprehensive error handling");
  console.log("7. Implement proper loading states");

  console.log("\n✨ Test completed!");
}

// Run the diagnostic
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Diagnostic failed:", error);
    process.exit(1);
  });
