'use client';
// LandKrypt Contract Operations Hook
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/abis';
import * as ABIS from '@/contracts/abis';
import { toast } from 'react-hot-toast';
import { useState, useCallback } from 'react';
import { parseEther, formatEther } from 'viem';

export function useContractOperations() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract();
  const [pendingTx, setPendingTx] = useState(null);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // NFT Operations
  const mintNFT = useCallback(async (to, tokenId, description, ipfsHash) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.REAL_ESTATE_NFT,
        abi: ABIS.REAL_ESTATE_NFT_ABI,
        functionName: 'mint',
        args: [to, tokenId, description, ipfsHash],
      });
      
      setPendingTx(hash);
      toast.success('NFT minting transaction sent!');
      return hash;
    } catch (error) {
      console.error('Mint NFT error:', error);
      toast.error(error.message || 'Failed to mint NFT');
      throw error;
    }
  }, [writeContract, isConnected]);

  // Marketplace Operations
  const listNFT = useCallback(async (tokenId, price, stakingContract, nftOwner) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.NFT_MARKETPLACE,
        abi: ABIS.NFT_MARKETPLACE_ABI,
        functionName: 'listNFT',
        args: [tokenId, parseEther(price.toString()), stakingContract, nftOwner],
      });
      
      setPendingTx(hash);
      toast.success('NFT listing transaction sent!');
      return hash;
    } catch (error) {
      console.error('List NFT error:', error);
      toast.error(error.message || 'Failed to list NFT');
      throw error;
    }
  }, [writeContract, isConnected]);

  const buyNFT = useCallback(async (tokenId) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.NFT_MARKETPLACE,
        abi: ABIS.NFT_MARKETPLACE_ABI,
        functionName: 'buyNFT',
        args: [tokenId],
      });
      
      setPendingTx(hash);
      toast.success('NFT purchase transaction sent!');
      return hash;
    } catch (error) {
      console.error('Buy NFT error:', error);
      toast.error(error.message || 'Failed to buy NFT');
      throw error;
    }
  }, [writeContract, isConnected]);

  // Staking Operations
  const stakeTokens = useCallback(async (stakingContractAddress, amount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    if (!stakingContractAddress || stakingContractAddress === '0x0000000000000000000000000000000000000000') {
      toast.error('Invalid staking contract address');
      return { success: false, error: 'Invalid staking contract' };
    }

    try {
      const hash = await writeContract({
        address: stakingContractAddress,
        abi: ABIS.NFT_STAKING_ABI,
        functionName: 'stake',
        args: [parseEther(amount.toString())],
      });
      
      setPendingTx(hash);
      toast.success('Staking transaction sent!');
      return { success: true, hash };
    } catch (error) {
      console.error('Stake tokens error:', error);
      const errorMessage = error.message?.includes('User rejected') 
        ? 'Transaction rejected by user'
        : error.message || 'Failed to stake tokens';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [writeContract, isConnected]);

  const withdrawStake = useCallback(async (stakingContractAddress) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: stakingContractAddress,
        abi: ABIS.NFT_STAKING_ABI,
        functionName: 'withdrawStake',
        args: [],
      });
      
      setPendingTx(hash);
      toast.success('Withdrawal transaction sent!');
      return hash;
    } catch (error) {
      console.error('Withdraw stake error:', error);
      toast.error(error.message || 'Failed to withdraw stake');
      throw error;
    }
  }, [writeContract, isConnected]);

  const claimRewards = useCallback(async (stakingContractAddress) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: stakingContractAddress,
        abi: ABIS.NFT_STAKING_ABI,
        functionName: 'claimDailyRewards',
        args: [],
      });
      
      setPendingTx(hash);
      toast.success('Claim rewards transaction sent!');
      return hash;
    } catch (error) {
      console.error('Claim rewards error:', error);
      toast.error(error.message || 'Failed to claim rewards');
      throw error;
    }
  }, [writeContract, isConnected]);

  // DAO Operations
  const registerDeveloper = useCallback(async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.NFT_DAO,
        abi: ABIS.NFTDAO_ABI,
        functionName: 'registerDeveloper',
        value: parseEther('0.1'), // Developer fee is 0.1 ETH
      });
      
      setPendingTx(hash);
      toast.success('Developer registration transaction sent!');
      return hash;
    } catch (error) {
      console.error('Register developer error:', error);
      toast.error(error.message || 'Failed to register as developer');
      throw error;
    }
  }, [writeContract, isConnected]);

  const createProposal = useCallback(async (description, developer, ownershipPercentage, landNFTId, projectTimeframe) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.NFT_DAO,
        abi: ABIS.NFTDAO_ABI,
        functionName: 'createProposal',
        args: [description, developer, ownershipPercentage, landNFTId, projectTimeframe],
      });
      
      setPendingTx(hash);
      toast.success('Proposal creation transaction sent!');
      return hash;
    } catch (error) {
      console.error('Create proposal error:', error);
      toast.error(error.message || 'Failed to create proposal');
      throw error;
    }
  }, [writeContract, isConnected]);

  const voteOnProposal = useCallback(async (proposalId, voteAmount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.NFT_DAO,
        abi: ABIS.NFTDAO_ABI,
        functionName: 'vote',
        args: [proposalId, parseEther(voteAmount.toString())],
      });
      
      setPendingTx(hash);
      toast.success('Vote transaction sent!');
      return hash;
    } catch (error) {
      console.error('Vote error:', error);
      toast.error(error.message || 'Failed to vote');
      throw error;
    }
  }, [writeContract, isConnected]);

  // Exchange Operations
  const swapETHForLKUSD = useCallback(async (ethAmount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.EXCHANGE,
        abi: ABIS.EXCHANGE_ABI,
        functionName: 'swapETHForLKUSD',
        value: parseEther(ethAmount.toString()),
      });
      
      setPendingTx(hash);
      toast.success('ETH to LKUSD swap transaction sent!');
      return { success: true, hash };
    } catch (error) {
      console.error('Swap ETH for LKUSD error:', error);
      const errorMessage = error.message || 'Failed to swap ETH for LKUSD';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [writeContract, isConnected]);

  const swapERC20ForLKUSD = useCallback(async (tokenAddress, amount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const hash = await writeContract({
        address: CONTRACT_ADDRESSES.EXCHANGE,
        abi: ABIS.EXCHANGE_ABI,
        functionName: 'swapERC20ForLKUSD',
        args: [tokenAddress, parseEther(amount.toString())],
      });
      
      setPendingTx(hash);
      toast.success('ERC20 to LKUSD swap transaction sent!');
      return { success: true, hash };
    } catch (error) {
      console.error('Swap ERC20 for LKUSD error:', error);
      const errorMessage = error.message || 'Failed to swap ERC20 for LKUSD';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [writeContract, isConnected]);

  const burnLKUSDForETH = useCallback(async (lkusdAmount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // First approve LKUSD to be burned
      const approveHash = await writeContract({
        address: CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
        abi: ABIS.LANDKRYPT_STABLECOIN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.EXCHANGE, parseEther(lkusdAmount.toString())],
      });
      
      // Wait for approval to be confirmed before proceeding with burn
      toast.success('LKUSD approval sent! Please wait for confirmation before burning.');
      return { success: true, hash: approveHash, requiresSecondStep: true };
    } catch (error) {
      console.error('Approve LKUSD for burn error:', error);
      const errorMessage = error.message || 'Failed to approve LKUSD for burning';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [writeContract, isConnected]);

  // Token Operations
  const approveToken = useCallback(async (tokenAddress, spender, amount) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const hash = await writeContract({
        address: tokenAddress,
        abi: ABIS.LANDKRYPT_STABLECOIN_ABI,
        functionName: 'approve',
        args: [spender, parseEther(amount.toString())],
      });
      
      setPendingTx(hash);
      toast.success('Approval transaction sent!');
      return { success: true, hash };
    } catch (error) {
      console.error('Approve token error:', error);
      const errorMessage = error.message || 'Failed to approve token';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [writeContract, isConnected]);

  return {
    // State
    isConnected,
    address,
    isWritePending,
    isConfirming,
    isConfirmed,
    pendingTx,
    writeError,

    // NFT Operations
    mintNFT,

    // Marketplace Operations
    listNFT,
    buyNFT,

    // Staking Operations
    stakeTokens,
    withdrawStake,
    claimRewards,

    // DAO Operations
    registerDeveloper,
    createProposal,
    voteOnProposal,

    // Token Operations
    approveToken,

    // Exchange Operations
    swapETHForLKUSD,
    swapERC20ForLKUSD,
    burnLKUSDForETH,

    // Utilities
    parseEther,
    formatEther,
  };
}

// Hook for reading contract data
export function useContractReads() {
  const { address } = useAccount();

  // Read LKUSD balance
  const { data: lkusdBalance, isLoading: isLkusdLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
    abi: ABIS.LANDKRYPT_STABLECOIN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  // Read LKST balance
  const { data: lkstBalance, isLoading: isLkstLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.LANDKRYPT_STAKING_TOKEN,
    abi: ABIS.LANDKRYPT_STAKING_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  // Get NFT listing
  const useNFTListing = (tokenId) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.NFT_MARKETPLACE,
      abi: ABIS.NFT_MARKETPLACE_ABI,
      functionName: 'listings',
      args: tokenId ? [tokenId] : undefined,
      query: {
        enabled: !!tokenId,
        refetchInterval: 30000,
      },
    });
  };

  // Get staking info
  const useStakingInfo = (stakingContract, userAddress) => {
    const { data: stakerInfo } = useReadContract({
      address: stakingContract,
      abi: ABIS.NFT_STAKING_ABI,
      functionName: 'stakers',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!stakingContract && !!userAddress,
        refetchInterval: 10000,
      },
    });

    const { data: earned } = useReadContract({
      address: stakingContract,
      abi: ABIS.NFT_STAKING_ABI,
      functionName: 'getTotalClaimableRewards',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!stakingContract && !!userAddress,
        refetchInterval: 10000,
      },
    });

    const { data: totalStaked } = useReadContract({
      address: stakingContract,
      abi: ABIS.NFT_STAKING_ABI,
      functionName: 'totalStaked',
      query: {
        enabled: !!stakingContract,
        refetchInterval: 30000,
      },
    });

    const { data: targetAmount } = useReadContract({
      address: stakingContract,
      abi: ABIS.NFT_STAKING_ABI,
      functionName: 'targetAmount',
      query: {
        enabled: !!stakingContract,
        refetchInterval: 60000,
      },
    });

    return {
      userBalance: stakerInfo ? stakerInfo[0] : 0n, // amount is first in tuple
      earnedRewards: earned,
      totalStaked,
      targetAmount,
      isLoading: false, // You can add individual loading states if needed
    };
  };

  return {
    // Token Balances
    lkusdBalance: lkusdBalance ? formatEther(lkusdBalance) : '0',
    lkstBalance: lkstBalance ? formatEther(lkstBalance) : '0',
    isBalanceLoading: isLkusdLoading || isLkstLoading,

    // Hooks for specific reads
    useNFTListing,
    useStakingInfo,

    // Utilities
    formatEther,
    parseEther,
  };
}
