'use client';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, NFTDAO_ABI } from '@/contracts/abis';

export function useDeveloperStatus() {
  const { address, isConnected } = useAccount();

  // Check if the current user is a registered developer
  const { 
    data: isRegisteredDeveloper, 
    isLoading: isCheckingStatus,
    error: statusError,
    refetch: refetchStatus
  } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT_DAO,
    abi: NFTDAO_ABI,
    functionName: 'registeredDevelopers',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Get developer fee required for registration
  const { 
    data: developerFee, 
    isLoading: isFeeLoading 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT_DAO,
    abi: NFTDAO_ABI,
    functionName: 'developerFee',
    query: {
      refetchInterval: 60000, // Refetch every minute
    },
  });

  return {
    isRegisteredDeveloper: !!isRegisteredDeveloper,
    developerFee,
    isCheckingStatus,
    isFeeLoading,
    statusError,
    refetchStatus,
    isConnected,
    userAddress: address
  };
}

export default useDeveloperStatus;
