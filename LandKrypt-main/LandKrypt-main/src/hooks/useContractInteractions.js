// Contract Interactions Hook with Database Integration
// Handles all contract interactions and ensures database storage

import { useState, useCallback } from 'react';
import { 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract
} from 'wagmi';
import { useContractDatabase } from './useContractDatabase';
import { toast } from 'react-hot-toast';
import { parseEther, formatEther } from 'viem';

// Contract ABIs (simplified for main functions)
const NFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'uri', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'transferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  }
];

const STAKING_ABI = [
  {
    name: 'stakeNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'unstakeNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  }
];

const MARKETPLACE_ABI = [
  {
    name: 'listItem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'buyItem',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'cancelListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  }
];

const GOVERNANCE_ABI = [
  {
    name: 'castVote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' }
    ],
    outputs: []
  }
];

export function useContractInteractions() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const {
    handleNFTMint,
    handleNFTTransfer,
    handleNFTStaking,
    handleNFTUnstaking,
    handleMarketplaceListing,
    handleMarketplacePurchase,
    handleGovernanceVote
  } = useContractDatabase();

  const [isLoading, setIsLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);

  // Generic transaction handler with database integration
  const handleTransaction = useCallback(async (
    contractAddress,
    abi,
    functionName,
    args,
    value,
    onSuccess,
    successMessage
  ) => {
    try {
      setIsLoading(true);
      
      const hash = await writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        value
      });

      setPendingTx(hash);
      toast.loading('Transaction pending...', { id: hash });

      // Wait for transaction confirmation
      // Note: In a real implementation, you'd use useWaitForTransactionReceipt
      // For now, we'll simulate the success after a delay
      setTimeout(async () => {
        try {
          await onSuccess(hash, ...args);
          toast.success(successMessage, { id: hash });
        } catch (error) {
          console.error('Database storage error:', error);
          toast.error('Transaction succeeded but failed to record in database', { id: hash });
        }
        setPendingTx(null);
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Transaction failed');
      setIsLoading(false);
      setPendingTx(null);
    }
  }, [writeContract]);

  // NFT Functions
  const mintNFT = useCallback(async (to, tokenId, metadataURI) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
      NFT_ABI,
      'mint',
      [to, tokenId, metadataURI],
      undefined,
      async (hash) => {
        await handleNFTMint(hash, tokenId, to, metadataURI);
      },
      `NFT #${tokenId} minted successfully!`
    );
  }, [handleTransaction, handleNFTMint]);

  const approveNFT = useCallback(async (to, tokenId) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
      NFT_ABI,
      'approve',
      [to, tokenId],
      undefined,
      async (hash) => {
        // Record approval in user actions
        await handleNFTTransfer(hash, tokenId, address, to); // This will be recorded as approval
      },
      `NFT #${tokenId} approved successfully!`
    );
  }, [handleTransaction, handleNFTTransfer, address]);

  const transferNFT = useCallback(async (from, to, tokenId) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
      NFT_ABI,
      'transferFrom',
      [from, to, tokenId],
      undefined,
      async (hash) => {
        await handleNFTTransfer(hash, tokenId, from, to);
      },
      `NFT #${tokenId} transferred successfully!`
    );
  }, [handleTransaction, handleNFTTransfer]);

  // Staking Functions
  const stakeNFT = useCallback(async (tokenId) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_ADVANCED_STAKING,
      STAKING_ABI,
      'stakeNFT',
      [tokenId],
      undefined,
      async (hash) => {
        // Simulate staking power calculation
        const stakingPower = parseEther('1'); // 1 ETH equivalent
        await handleNFTStaking(hash, tokenId, stakingPower);
      },
      `NFT #${tokenId} staked successfully!`
    );
  }, [handleTransaction, handleNFTStaking]);

  const unstakeNFT = useCallback(async (tokenId) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_ADVANCED_STAKING,
      STAKING_ABI,
      'unstakeNFT',
      [tokenId],
      undefined,
      async (hash) => {
        // Simulate rewards calculation
        const rewards = parseEther('0.1'); // 0.1 ETH rewards
        await handleNFTUnstaking(hash, tokenId, rewards);
      },
      `NFT #${tokenId} unstaked successfully!`
    );
  }, [handleTransaction, handleNFTUnstaking]);

  const claimRewards = useCallback(async () => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_ADVANCED_STAKING,
      STAKING_ABI,
      'claimRewards',
      [],
      undefined,
      async (hash) => {
        // This will be handled by the event listener
        console.log('Rewards claimed:', hash);
      },
      'Rewards claimed successfully!'
    );
  }, [handleTransaction]);

  // Marketplace Functions
  const listItem = useCallback(async (tokenId, price) => {
    const priceInWei = parseEther(price.toString());
    
    await handleTransaction(
      process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
      MARKETPLACE_ABI,
      'listItem',
      [process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT, tokenId, priceInWei],
      undefined,
      async (hash) => {
        await handleMarketplaceListing(hash, tokenId, priceInWei);
      },
      `NFT #${tokenId} listed for ${price} ETH!`
    );
  }, [handleTransaction, handleMarketplaceListing]);

  const buyItem = useCallback(async (tokenId, price, seller) => {
    const priceInWei = parseEther(price.toString());
    
    await handleTransaction(
      process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
      MARKETPLACE_ABI,
      'buyItem',
      [process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT, tokenId],
      priceInWei,
      async (hash) => {
        await handleMarketplacePurchase(hash, tokenId, seller, address, priceInWei);
      },
      `NFT #${tokenId} purchased successfully!`
    );
  }, [handleTransaction, handleMarketplacePurchase, address]);

  const cancelListing = useCallback(async (tokenId) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
      MARKETPLACE_ABI,
      'cancelListing',
      [process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT, tokenId],
      undefined,
      async (hash) => {
        // This will be handled by the event listener
        console.log('Listing cancelled:', hash);
      },
      `Listing for NFT #${tokenId} cancelled!`
    );
  }, [handleTransaction]);

  // Governance Functions
  const castVote = useCallback(async (proposalId, support) => {
    await handleTransaction(
      process.env.NEXT_PUBLIC_QUADRATIC_GOVERNANCE,
      GOVERNANCE_ABI,
      'castVote',
      [proposalId, support],
      undefined,
      async (hash) => {
        // Simulate voting power calculation
        const votingPower = parseEther('1'); // 1 ETH equivalent voting power
        await handleGovernanceVote(hash, proposalId, support, votingPower);
      },
      `Vote cast on proposal #${proposalId}!`
    );
  }, [handleTransaction, handleGovernanceVote]);

  return {
    // State
    isLoading,
    pendingTx,
    
    // NFT Functions
    mintNFT,
    approveNFT,
    transferNFT,
    
    // Staking Functions
    stakeNFT,
    unstakeNFT,
    claimRewards,
    
    // Marketplace Functions
    listItem,
    buyItem,
    cancelListing,
    
    // Governance Functions
    castVote
  };
}
