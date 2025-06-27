// Check and Fix All Minter Permissions
// This script checks all the required minter permissions and fixes them

const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs
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
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const LKST_ABI = [
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

// Environment variable validation
function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} not set`);
  }
  return value;
}

async function checkAndFixAllMinters() {
  console.log('🔧 Checking and Fixing All Minter Permissions...\n');

  try {
    // Load configuration from environment
    const config = {
      rpcUrl: getRequiredEnvVar('ALCHEMY_SEPOLIA_URL'),
      stakingFactoryAddress: getRequiredEnvVar('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS'),
      marketplaceAddress: getRequiredEnvVar('NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS'),
      exchangeAddress: getRequiredEnvVar('NEXT_PUBLIC_EXCHANGE_ADDRESS'),
      lkusdAddress: getRequiredEnvVar('NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS'),
      lkstAddress: getRequiredEnvVar('NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS'),
      ownerPrivateKey: getRequiredEnvVar('DEPLOYER_PRIVATE_KEY'),
    };

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.ownerPrivateKey, provider);

    // Create contract instances
    const lkusdContract = new ethers.Contract(config.lkusdAddress, LKUSD_ABI, wallet);
    const lkstContract = new ethers.Contract(config.lkstAddress, LKST_ABI, wallet);

    console.log(`📋 Contract Addresses:`);
    console.log(`   LKUSD: ${config.lkusdAddress}`);
    console.log(`   LKST: ${config.lkstAddress}`);
    console.log(`   StakingFactory: ${config.stakingFactoryAddress}`);
    console.log(`   Marketplace: ${config.marketplaceAddress}`);
    console.log(`   Exchange: ${config.exchangeAddress}`);
    console.log(`   Owner: ${wallet.address}\n`);

    // Define required minters for each contract
    const requiredMinters = {
      LKUSD: [
        { address: config.stakingFactoryAddress, name: 'StakingFactory' },
        { address: config.marketplaceAddress, name: 'Marketplace' },
        { address: config.exchangeAddress, name: 'Exchange' }
      ],
      LKST: [
        { address: config.stakingFactoryAddress, name: 'StakingFactory' }
      ]
    };

    const results = {
      LKUSD: [],
      LKST: []
    };

    // Check and fix LKUSD minters
    console.log('🔍 Checking LKUSD Minter Permissions...');
    for (const minter of requiredMinters.LKUSD) {
      console.log(`\n   📝 Checking ${minter.name} (${minter.address})...`);
      
      const isMinter = await lkusdContract.isMinter(minter.address);
      console.log(`   🔍 Current status: ${isMinter ? 'IS MINTER' : 'NOT MINTER'}`);
      
      if (!isMinter) {
        console.log(`   🔧 Adding ${minter.name} as LKUSD minter...`);
        try {
          const tx = await lkusdContract.addMinter(minter.address);
          console.log(`   ⏳ Transaction sent: ${tx.hash}`);
          await tx.wait();
          console.log(`   ✅ Successfully added as minter`);
          
          // Verify
          const isNowMinter = await lkusdContract.isMinter(minter.address);
          results.LKUSD.push({
            name: minter.name,
            address: minter.address,
            wasAlreadyMinter: false,
            addedSuccessfully: isNowMinter,
            txHash: tx.hash
          });
        } catch (error) {
          console.log(`   ❌ Failed to add as minter: ${error.message}`);
          results.LKUSD.push({
            name: minter.name,
            address: minter.address,
            wasAlreadyMinter: false,
            addedSuccessfully: false,
            error: error.message
          });
        }
      } else {
        console.log(`   ✅ Already a minter`);
        results.LKUSD.push({
          name: minter.name,
          address: minter.address,
          wasAlreadyMinter: true,
          addedSuccessfully: true
        });
      }
    }

    // Check and fix LKST minters
    console.log('\n🔍 Checking LKST Minter Permissions...');
    for (const minter of requiredMinters.LKST) {
      console.log(`\n   📝 Checking ${minter.name} (${minter.address})...`);
      
      const isMinter = await lkstContract.isMinter(minter.address);
      console.log(`   🔍 Current status: ${isMinter ? 'IS MINTER' : 'NOT MINTER'}`);
      
      if (!isMinter) {
        console.log(`   🔧 Adding ${minter.name} as LKST minter...`);
        try {
          const tx = await lkstContract.addMinter(minter.address);
          console.log(`   ⏳ Transaction sent: ${tx.hash}`);
          await tx.wait();
          console.log(`   ✅ Successfully added as minter`);
          
          // Verify
          const isNowMinter = await lkstContract.isMinter(minter.address);
          results.LKST.push({
            name: minter.name,
            address: minter.address,
            wasAlreadyMinter: false,
            addedSuccessfully: isNowMinter,
            txHash: tx.hash
          });
        } catch (error) {
          console.log(`   ❌ Failed to add as minter: ${error.message}`);
          results.LKST.push({
            name: minter.name,
            address: minter.address,
            wasAlreadyMinter: false,
            addedSuccessfully: false,
            error: error.message
          });
        }
      } else {
        console.log(`   ✅ Already a minter`);
        results.LKST.push({
          name: minter.name,
          address: minter.address,
          wasAlreadyMinter: true,
          addedSuccessfully: true
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MINTER PERMISSIONS SUMMARY');
    console.log('='.repeat(80));

    console.log('\n🟡 LKUSD Minters:');
    results.LKUSD.forEach(result => {
      const status = result.addedSuccessfully ? '✅' : '❌';
      const action = result.wasAlreadyMinter ? 'Already was' : (result.addedSuccessfully ? 'Added' : 'Failed');
      console.log(`   ${status} ${result.name}: ${action}`);
      if (result.txHash) console.log(`      TX: ${result.txHash}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });

    console.log('\n🟢 LKST Minters:');
    results.LKST.forEach(result => {
      const status = result.addedSuccessfully ? '✅' : '❌';
      const action = result.wasAlreadyMinter ? 'Already was' : (result.addedSuccessfully ? 'Added' : 'Failed');
      console.log(`   ${status} ${result.name}: ${action}`);
      if (result.txHash) console.log(`      TX: ${result.txHash}`);
      if (result.error) console.log(`      Error: ${result.error}`);
    });

    // Check if all required permissions are in place
    const allLKUSDGood = results.LKUSD.every(r => r.addedSuccessfully);
    const allLKSTGood = results.LKST.every(r => r.addedSuccessfully);
    
    console.log('\n🎯 FINAL STATUS:');
    console.log(`   LKUSD Permissions: ${allLKUSDGood ? '✅ ALL GOOD' : '❌ ISSUES FOUND'}`);
    console.log(`   LKST Permissions: ${allLKSTGood ? '✅ ALL GOOD' : '❌ ISSUES FOUND'}`);

    if (allLKUSDGood && allLKSTGood) {
      console.log('\n🎉 All minter permissions are properly configured!');
      console.log('✨ You can now proceed with creating staking contracts.');
    } else {
      console.log('\n⚠️  Some minter permissions need attention before proceeding.');
    }

    return {
      success: allLKUSDGood && allLKSTGood,
      results
    };

  } catch (error) {
    console.error('\n💥 Failed to check/fix minter permissions:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  checkAndFixAllMinters()
    .then(result => {
      console.log('\n🎊 Minter permission check completed!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Minter permission check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndFixAllMinters };
