#!/usr/bin/env node

// Test script to verify contract functions
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { 
  ALCHEMY_SEPOLIA_URL, 
  DEPLOYER_PRIVATE_KEY,
  NEXT_PUBLIC_NFT_DAO_ADDRESS,
  NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS
} = process.env;

// Simple ABIs for testing
const NFTDAO_ABI = [
  {
    "inputs": [],
    "name": "registerDeveloper",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "developerFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const STABLECOIN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testContractFunctions() {
  console.log('🧪 Testing Contract Functions');
  console.log('==============================\n');

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    console.log('🔗 Connected to wallet:', wallet.address);
    
    // Get ETH balance
    const ethBalance = await provider.getBalance(wallet.address);
    console.log('💰 ETH Balance:', ethers.formatEther(ethBalance), 'ETH\n');

    // Test DAO contract
    console.log('📋 Testing DAO Contract Functions...');
    const daoContract = new ethers.Contract(NEXT_PUBLIC_NFT_DAO_ADDRESS, NFTDAO_ABI, wallet);
    
    try {
      const developerFee = await daoContract.developerFee();
      console.log('✅ Developer Fee:', ethers.formatEther(developerFee), 'ETH');
    } catch (error) {
      console.log('❌ Failed to get developer fee:', error.message);
    }

    // Test Stablecoin contract
    console.log('\n🪙 Testing Stablecoin Contract Functions...');
    const stablecoinContract = new ethers.Contract(NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS, STABLECOIN_ABI, provider);
    
    try {
      const balance = await stablecoinContract.balanceOf(wallet.address);
      console.log('✅ LKUSD Balance:', ethers.formatEther(balance), 'LKUSD');
    } catch (error) {
      console.log('❌ Failed to get LKUSD balance:', error.message);
    }

    console.log('\n🎯 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContractFunctions().catch(console.error);
