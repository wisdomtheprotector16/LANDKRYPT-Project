// Error handling utilities for LandKrypt DApp
import { toast } from 'react-hot-toast';

/**
 * Parse and format contract error messages
 * @param {Error} error - The error object from contract interaction
 * @returns {string} - User-friendly error message
 */
export function parseContractError(error) {
  if (!error) return 'Unknown error occurred';

  const errorMessage = error.message || error.toString();
  
  // Common Web3 error patterns
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient ETH for gas fees. Please add more ETH to your wallet.';
  }
  
  if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
    return 'Transaction was cancelled by user';
  }
  
  if (errorMessage.includes('nonce too high')) {
    return 'Transaction nonce error. Please reset your wallet and try again.';
  }
  
  if (errorMessage.includes('replacement transaction underpriced')) {
    return 'Transaction underpriced. Please increase gas price and try again.';
  }
  
  if (errorMessage.includes('already known')) {
    return 'Transaction already pending. Please wait for confirmation.';
  }

  // Contract-specific errors
  if (errorMessage.includes('allowance')) {
    return 'Token allowance error. Please approve tokens first.';
  }
  
  if (errorMessage.includes('balance')) {
    return 'Insufficient token balance for this transaction.';
  }
  
  if (errorMessage.includes('paused')) {
    return 'Contract is currently paused. Please try again later.';
  }
  
  if (errorMessage.includes('deadline')) {
    return 'Transaction deadline exceeded. Please try again.';
  }
  
  if (errorMessage.includes('slippage')) {
    return 'Price changed too much. Increase slippage tolerance or try again.';
  }

  // Network errors
  if (errorMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Transaction timed out. Please try again.';
  }

  // Staking-specific errors
  if (errorMessage.includes('staking target reached')) {
    return 'Staking target already reached for this property.';
  }
  
  if (errorMessage.includes('minimum stake')) {
    return 'Amount below minimum staking requirement.';
  }
  
  if (errorMessage.includes('not owner')) {
    return 'You are not authorized to perform this action.';
  }

  // Generic contract revert
  if (errorMessage.includes('revert')) {
    const revertMatch = errorMessage.match(/revert (.+?)(?:\s|$)/);
    if (revertMatch) {
      return `Contract error: ${revertMatch[1]}`;
    }
    return 'Transaction failed due to contract conditions.';
  }

  // If no specific pattern matches, return a cleaned version
  return errorMessage.length > 100 
    ? 'Transaction failed. Please check your inputs and try again.'
    : errorMessage;
}

/**
 * Handle transaction errors with toast notifications
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed (e.g., 'staking', 'approval')
 */
export function handleTransactionError(error, operation = 'transaction') {
  const message = parseContractError(error);
  console.error(`${operation} error:`, error);
  toast.error(message);
  return message;
}

/**
 * Validate staking parameters
 * @param {string} amount - The staking amount
 * @param {string} balance - User's balance
 * @param {number} remaining - Remaining amount for target
 * @returns {Object} - Validation result
 */
export function validateStakingParams(amount, balance, remaining) {
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance || '0');
  const remainingNum = parseFloat(remaining || '0');

  if (!amount || amount === '') {
    return { valid: false, error: 'Please enter an amount' };
  }

  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: 'Please enter a valid amount' };
  }

  if (amountNum < 0.01) {
    return { valid: false, error: 'Minimum staking amount is 0.01 LKUSD' };
  }

  if (amountNum > balanceNum) {
    return { 
      valid: false, 
      error: `Insufficient balance. You have ${balanceNum.toFixed(2)} LKUSD` 
    };
  }

  if (remainingNum > 0 && amountNum > remainingNum) {
    return { 
      valid: false, 
      error: `Amount exceeds remaining target. Maximum: ${remainingNum.toFixed(2)} LKUSD` 
    };
  }

  return { valid: true };
}

/**
 * Format transaction hash for display
 * @param {string} hash - Transaction hash
 * @returns {string} - Formatted hash
 */
export function formatTxHash(hash) {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get Etherscan URL for transaction
 * @param {string} hash - Transaction hash
 * @param {string} network - Network name (default: 'sepolia')
 * @returns {string} - Etherscan URL
 */
export function getEtherscanUrl(hash, network = 'sepolia') {
  if (!hash) return '';
  
  const baseUrls = {
    mainnet: 'https://etherscan.io',
    sepolia: 'https://sepolia.etherscan.io',
    goerli: 'https://goerli.etherscan.io',
  };
  
  const baseUrl = baseUrls[network] || baseUrls.sepolia;
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Check if error is a user rejection
 * @param {Error} error - The error object
 * @returns {boolean} - True if user rejected the transaction
 */
export function isUserRejection(error) {
  const message = error?.message || error?.toString() || '';
  return message.includes('user rejected') || 
         message.includes('User rejected') ||
         message.includes('denied transaction signature');
}

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} - True if it's a network error
 */
export function isNetworkError(error) {
  const message = error?.message || error?.toString() || '';
  return message.includes('network') || 
         message.includes('timeout') ||
         message.includes('fetch');
}

/**
 * Format balance for display
 * @param {string|number} balance - Balance value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted balance
 */
export function formatBalance(balance, decimals = 2) {
  const num = parseFloat(balance || '0');
  if (isNaN(num)) return '0.00';
  
  // For very small numbers, show more decimals
  if (num > 0 && num < 0.01 && decimals === 2) {
    return num.toFixed(4);
  }
  
  return num.toFixed(decimals);
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise that resolves when function succeeds or max retries reached
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (isUserRejection(error)) throw error; // Don't retry user rejections
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
