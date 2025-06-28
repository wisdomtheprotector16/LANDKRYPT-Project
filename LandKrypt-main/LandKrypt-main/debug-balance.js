#!/usr/bin/env node

// Debug script to check LKUSD balance formatting
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { 
  ALCHEMY_SEPOLIA_URL, 
  DEPLOYER_PRIVATE_KEY,
  NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS
} = process.env;

// LKUSD ABI
const LKUSD_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function debugBalance() {
  console.log('🔍 Debugging LKUSD Balance Formatting');
  console.log('====================================\n');

  try {
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    console.log('🔗 Connected to wallet:', wallet.address);
    console.log('💰 Contract Address:', NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS);
    
    // Get contract instance
    const lkusdContract = new ethers.Contract(NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS, LKUSD_ABI, provider);
    
    // Get token info
    const symbol = await lkusdContract.symbol();
    const decimals = await lkusdContract.decimals();
    console.log('🪙 Token Symbol:', symbol);
    console.log('🔢 Token Decimals:', decimals.toString());
    
    // Get raw balance
    const rawBalance = await lkusdContract.balanceOf(wallet.address);
    console.log('\n📊 Balance Information:');
    console.log('Raw balance (wei):', rawBalance.toString());
    
    // Format with different methods
    const ethersFormatted = ethers.formatEther(rawBalance);
    const ethersFormattedUnits = ethers.formatUnits(rawBalance, decimals);
    const manualFormatted = Number(rawBalance) / Math.pow(10, Number(decimals));
    
    console.log('ethers.formatEther():', ethersFormatted);
    console.log('ethers.formatUnits(balance, decimals):', ethersFormattedUnits);
    console.log('Manual calculation:', manualFormatted);
    
    // Show what your wallet shows vs what the script shows
    console.log('\n💡 Comparison:');
    console.log('What test-functions.js showed:', ethersFormatted);
    console.log('What your wallet likely shows:', parseFloat(ethersFormatted).toFixed(2));
    console.log('Properly formatted for UI:', parseFloat(ethersFormatted).toFixed(4));
    
    // Check if the issue is decimal places
    const actualBalance = parseFloat(ethersFormatted);
    if (actualBalance > 0 && actualBalance < 1) {
      console.log('\n⚠️  ISSUE FOUND:');
      console.log('Your balance is a small decimal number that needs proper formatting');
      console.log('The staking modal might be having issues with decimal validation');
    }
    
    // Show what different formatting would look like
    console.log('\n🎯 UI Formatting Options:');
    console.log('Raw float:', actualBalance);
    console.log('2 decimals:', actualBalance.toFixed(2));
    console.log('4 decimals:', actualBalance.toFixed(4));
    console.log('6 decimals:', actualBalance.toFixed(6));
    console.log('Scientific notation:', actualBalance.toExponential(2));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugBalance().catch(console.error);
