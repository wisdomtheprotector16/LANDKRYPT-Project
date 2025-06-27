import { useWriteContract, useSimulateContract, useReadContract, useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther, parseUnits } from 'viem';
import { toast } from 'react-hot-toast';
import React from 'react';

// Hook for contract write operations
export const useContractWriteCustom = (contractAddress, abi, functionName, args = [], value = 0) => {
  const { data: simulateData, error: prepareError, isError: isPrepareError } = useSimulateContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    value: value ? parseEther(value.toString()) : undefined,
    query: {
      enabled: !!contractAddress && !!functionName && args.every(arg => arg !== undefined),
    }
  });

  const { 
    data, 
    isPending: isLoading, 
    isSuccess, 
    isError, 
    error, 
    writeContract 
  } = useWriteContract();

  // Auto-show toast notifications
  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction successful!');
    }
    if (isError || isPrepareError) {
      toast.error(error?.message || prepareError?.message || 'Transaction failed');
    }
  }, [isSuccess, isError, isPrepareError, error, prepareError]);

  const write = () => {
    if (simulateData?.request) {
      writeContract(simulateData.request);
    }
  };

  return { 
    write, 
    data, 
    isLoading, 
    isSuccess, 
    isError: isError || isPrepareError, 
    error: error || prepareError 
  };
};

// Hook for contract read operations
export const useContractReadData = (contractAddress, abi, functionName, args = []) => {
  const { data, isError, isLoading, error } = useReadContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    query: {
      enabled: !!contractAddress && !!functionName,
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    }
  });

  return { data, isError, isLoading, error };
};

// Hook for wallet connection status
export const useWallet = () => {
  const { address, isConnected, isDisconnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return {
    address,
    isConnected,
    isDisconnected,
    balance: balance ? formatEther(balance.value) : '0',
    balanceFormatted: balance?.formatted || '0'
  };
};

// Utility function to handle transaction errors
export const handleTransactionError = (error) => {
  if (error?.message?.includes('User rejected')) {
    toast.error('Transaction rejected by user');
  } else if (error?.message?.includes('insufficient funds')) {
    toast.error('Insufficient funds for transaction');
  } else if (error?.message?.includes('gas')) {
    toast.error('Gas estimation failed. Please try again.');
  } else {
    toast.error(error?.message || 'Transaction failed');
  }
};

// Format large numbers for display
export const formatAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  const formatted = formatEther(amount);
  return parseFloat(formatted).toLocaleString();
};

// Parse input amount to wei
export const parseAmount = (amount, decimals = 18) => {
  if (!amount || isNaN(amount)) return 0;
  return parseUnits(amount.toString(), decimals);
};
