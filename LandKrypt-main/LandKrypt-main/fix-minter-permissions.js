// Fix Minter Permissions Script
// This script adds StakingFactory as a minter on the LandKryptStablecoin contract

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

// Environment variable validation
function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} not set`);
  }
  return value;
}

async function fixMinterPermissions() {
  console.log('🔧 Fixing Minter Permissions for StakingFactory...\n');

  try {
    // Load configuration from environment
    const config = {
      rpcUrl: getRequiredEnvVar('ALCHEMY_SEPOLIA_URL'),
      stakingFactoryAddress: getRequiredEnvVar('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS'),
      lkusdAddress: getRequiredEnvVar('NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS'),
      ownerPrivateKey: getRequiredEnvVar('DEPLOYER_PRIVATE_KEY'),
    };

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.ownerPrivateKey, provider);

    // Create contract instance
    const lkusdContract = new ethers.Contract(
      config.lkusdAddress,
      LKUSD_ABI,
      wallet
    );

    console.log(`📋 Contract Details:`);
    console.log(`   LKUSD Contract: ${config.lkusdAddress}`);
    console.log(`   StakingFactory: ${config.stakingFactoryAddress}`);
    console.log(`   Owner: ${wallet.address}\n`);

    // Check current owner
    const contractOwner = await lkusdContract.owner();
    console.log(`🔍 Current contract owner: ${contractOwner}`);
    
    if (contractOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error(`Wallet ${wallet.address} is not the contract owner. Owner is: ${contractOwner}`);
    }
    console.log(`✅ Ownership verified\n`);

    // Check if StakingFactory is already a minter
    const isAlreadyMinter = await lkusdContract.isMinter(config.stakingFactoryAddress);
    
    if (isAlreadyMinter) {
      console.log(`✅ StakingFactory is already a minter!`);
      return {
        success: true,
        alreadyMinter: true,
        stakingFactoryAddress: config.stakingFactoryAddress
      };
    }

    console.log(`🔧 Adding StakingFactory as minter...`);

    // Add StakingFactory as minter
    const addMinterTx = await lkusdContract.addMinter(config.stakingFactoryAddress);
    console.log(`⏳ Transaction sent: ${addMinterTx.hash}`);
    
    const receipt = await addMinterTx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify the minter was added
    const isMinterNow = await lkusdContract.isMinter(config.stakingFactoryAddress);
    
    if (isMinterNow) {
      console.log(`🎉 StakingFactory successfully added as minter!`);
    } else {
      throw new Error('Failed to add StakingFactory as minter');
    }

    return {
      success: true,
      alreadyMinter: false,
      txHash: addMinterTx.hash,
      stakingFactoryAddress: config.stakingFactoryAddress
    };

  } catch (error) {
    console.error('\n💥 Failed to fix minter permissions:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  fixMinterPermissions()
    .then(result => {
      console.log('\n🎊 Minter permissions fixed successfully!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Failed to fix minter permissions:', error);
      process.exit(1);
    });
}

module.exports = { fixMinterPermissions };
