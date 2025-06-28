# LandKrypt Staking Functionality - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. "Transaction Failed" Errors

**Symptoms:**
- Clicking "Stake Now" shows error message
- Transaction gets rejected
- User sees "Transaction failed" toast

**Solutions:**
```javascript
// Check these common causes:

// A. Insufficient LKUSD Balance
if (userBalance < stakeAmount) {
  // Solution: Get LKUSD from exchange first
}

// B. Insufficient Gas Fees
if (ethBalance < gasRequired) {
  // Solution: Add more ETH to wallet
}

// C. Contract Address Issues
if (stakingContractAddress === '0x0000...') {
  // Solution: Verify contract deployment
}

// D. Approval Issues
if (allowance < stakeAmount) {
  // Solution: Approve tokens first (2-step process)
}
```

### 2. Wallet Connection Issues

**Common Problems:**
- Wallet not connected
- Wrong network selected
- RPC endpoint issues

**Solutions:**
1. **Connect Wallet:** Ensure MetaMask/wallet is connected
2. **Switch Network:** Make sure you're on Sepolia testnet
3. **Check RPC:** Verify RPC endpoint in wagmi config is working

### 3. Contract Interaction Failures

**Error Patterns:**
```
- "revert" errors → Contract conditions not met
- "insufficient funds" → Need more ETH for gas
- "user rejected" → Transaction cancelled by user
- "nonce too high" → Reset wallet/MetaMask
```

### 4. Environment Configuration

**Required Environment Variables:**
```bash
NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS=0x...
NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

## 🔧 Debugging Steps

### Step 1: Run Diagnostic Script
```bash
npm run hardhat test-staking.js
```

### Step 2: Check Browser Console
```javascript
// Look for these in browser console:
console.log('Contract addresses:', CONTRACT_ADDRESSES);
console.log('User balance:', lkusdBalance);
console.log('Staking contract:', stakingContractAddress);
```

### Step 3: Verify Contract Deployment
```bash
# Check if contracts are deployed
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Step 4: Test Individual Functions
```javascript
// Test approval first
const approval = await approveToken(tokenAddress, spender, amount);

// Then test staking
const staking = await stakeTokens(stakingContract, amount);
```

## 🎯 Production-Ready Checklist

### Frontend Fixes Applied:
- ✅ Enhanced error handling with user-friendly messages
- ✅ Proper validation before transactions
- ✅ 2-step process (Approve → Stake) with clear UI
- ✅ Better loading states and transaction tracking
- ✅ Comprehensive input validation
- ✅ Fallback RPC endpoints for reliability
- ✅ Transaction retry mechanisms
- ✅ Proper gas estimation

### Security Measures:
- ✅ Input sanitization and validation
- ✅ Minimum/maximum amount checks
- ✅ Allowance verification
- ✅ Contract address validation
- ✅ Network verification

### User Experience:
- ✅ Clear progress indicators
- ✅ Detailed error messages
- ✅ Transaction hash display
- ✅ Etherscan links
- ✅ Success confirmations
- ✅ Retry mechanisms

## 🚀 Quick Fix Implementation

### 1. Update StakingModal Component
The StakingModal has been updated with:
- Better error handling
- Input validation
- Transaction retry logic
- Clear user feedback

### 2. Enhanced Error Utilities
Created `src/utils/errorHandling.js` with:
- Contract error parsing
- User-friendly error messages
- Validation functions
- Retry mechanisms

### 3. Improved Wagmi Configuration
Updated `src/app/wagmi.js` with:
- Multiple RPC fallbacks
- Better timeout handling
- Enhanced retry logic
- Proper network configuration

## 🔍 Testing the Fix

### Manual Testing Steps:
1. **Connect Wallet** → Should show wallet connection
2. **Check Balance** → Should display LKUSD balance
3. **Enter Amount** → Should validate input
4. **Approve Tokens** → Should trigger approval transaction
5. **Stake Tokens** → Should trigger staking transaction
6. **Verify Success** → Should show success message and update UI

### Error Scenarios to Test:
1. **No LKUSD Balance** → Should show "insufficient balance" error
2. **Amount Too High** → Should show "exceeds balance" error
3. **Rejected Transaction** → Should show "transaction cancelled" error
4. **Network Issues** → Should retry automatically
5. **Invalid Contract** → Should show "contract not found" error

## 📞 Support

If issues persist:

1. **Check Network Status:** Ensure Sepolia testnet is operational
2. **Verify Contracts:** Confirm all contracts are deployed correctly
3. **Test with Small Amounts:** Start with 0.01 LKUSD
4. **Clear Browser Cache:** Sometimes helps with stale data
5. **Reset Wallet:** Reset MetaMask if nonce issues occur

## 🎉 Success Indicators

The staking button is production-ready when:
- ✅ No console errors
- ✅ Clear user feedback at each step
- ✅ Proper error handling for all scenarios
- ✅ Transactions complete successfully
- ✅ UI updates reflect blockchain state
- ✅ Users can stake, see progress, and earn rewards

---

**Last Updated:** 2025-06-28
**Status:** Production Ready 🚀
