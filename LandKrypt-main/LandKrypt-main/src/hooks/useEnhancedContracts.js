// Enhanced Contract Hooks for LandKrypt Upgrades
// Provides hooks for interacting with upgraded smart contracts

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ENHANCED_CONTRACTS } from '../contracts/enhanced-abis';
import { useTierSystem } from './useTierSystem';
import { toast } from 'react-hot-toast';

// Gas Optimized NFT Hook
export function useGasOptimizedNFT() {
  const { address } = useAccount();
  const { currentTier, updateXP } = useTierSystem();
  const [isLoading, setIsLoading] = useState(false);

  // Read Functions
  const { data: balance } = useContractRead({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  const { data: totalSupply } = useContractRead({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    functionName: 'totalSupply',
  });

  // Single Mint
  const { config: mintConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    functionName: 'mint',
  });

  const { write: mintNFT, isLoading: isMinting } = useContractWrite({
    ...mintConfig,
    onSuccess: (data) => {
      toast.success('NFT minted successfully!');
      updateXP('nftMint', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to mint NFT');
      console.error('Mint error:', error);
    },
  });

  // Batch Mint
  const { config: batchMintConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    functionName: 'batchMint',
  });

  const { write: batchMintNFTs, isLoading: isBatchMinting } = useContractWrite({
    ...batchMintConfig,
    onSuccess: (data) => {
      toast.success('Batch mint successful!');
      updateXP('batchMint', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to batch mint NFTs');
      console.error('Batch mint error:', error);
    },
  });

  // Get Property Data
  const getPropertyData = useCallback(async (tokenId) => {
    try {
      const data = await useContractRead({
        address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
        abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
        functionName: 'getPropertyData',
        args: [tokenId],
      });
      return data;
    } catch (error) {
      console.error('Error getting property data:', error);
      return null;
    }
  }, []);

  // Batch Property Data
  const getBatchPropertyData = useCallback(async (tokenIds) => {
    try {
      const data = await useContractRead({
        address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
        abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
        functionName: 'getBatchPropertyData',
        args: [tokenIds],
      });
      return data;
    } catch (error) {
      console.error('Error getting batch property data:', error);
      return null;
    }
  }, []);

  // Mint with tier benefits
  const mintWithTierBenefits = useCallback((to, uri, propertyData, royaltyFee) => {
    const maxBatchSize = currentTier?.benefits?.maxNFTsPerTransaction || 1;
    
    if (maxBatchSize === 1) {
      mintNFT?.({
        args: [to, uri, propertyData, royaltyFee]
      });
    } else {
      // User can batch mint
      const batchData = [{
        to,
        uri,
        propertyData,
        royaltyFee
      }];
      batchMintNFTs?.({
        args: [batchData]
      });
    }
  }, [currentTier, mintNFT, batchMintNFTs]);

  return {
    // State
    balance: balance ? Number(balance) : 0,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    isLoading: isLoading || isMinting || isBatchMinting,
    
    // Functions
    mintNFT: mintWithTierBenefits,
    batchMintNFTs,
    getPropertyData,
    getBatchPropertyData,
    
    // Capabilities based on tier
    canBatchMint: (currentTier?.level || 1) >= 2,
    maxBatchSize: currentTier?.benefits?.maxNFTsPerTransaction || 1,
  };
}

// Enhanced Marketplace Hook
export function useEnhancedMarketplace() {
  const { address } = useAccount();
  const { currentTier, updateXP } = useTierSystem();
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);

  // Create Fixed Price Listing
  const { config: createListingConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    functionName: 'createListing',
  });

  const { write: createListing, isLoading: isCreatingListing } = useContractWrite({
    ...createListingConfig,
    onSuccess: (data) => {
      toast.success('Listing created successfully!');
      updateXP('nftSale', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to create listing');
      console.error('Create listing error:', error);
    },
  });

  // Create Dutch Auction
  const { config: createDutchAuctionConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    functionName: 'createDutchAuction',
  });

  const { write: createDutchAuction, isLoading: isCreatingAuction } = useContractWrite({
    ...createDutchAuctionConfig,
    onSuccess: (data) => {
      toast.success('Dutch auction created!');
      updateXP('dutchAuction', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to create auction');
      console.error('Create auction error:', error);
    },
  });

  // Purchase
  const { config: purchaseConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    functionName: 'purchase',
  });

  const { write: purchaseNFT, isLoading: isPurchasing } = useContractWrite({
    ...purchaseConfig,
    onSuccess: (data) => {
      toast.success('Purchase successful!');
      updateXP('nftPurchase', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to purchase NFT');
      console.error('Purchase error:', error);
    },
  });

  // Make Offer
  const { config: makeOfferConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    functionName: 'makeOffer',
  });

  const { write: makeOffer, isLoading: isMakingOffer } = useContractWrite({
    ...makeOfferConfig,
    onSuccess: (data) => {
      toast.success('Offer made successfully!');
      updateXP('makeOffer', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to make offer');
      console.error('Make offer error:', error);
    },
  });

  // Accept Offer
  const { config: acceptOfferConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    functionName: 'acceptOffer',
  });

  const { write: acceptOffer, isLoading: isAcceptingOffer } = useContractWrite({
    ...acceptOfferConfig,
    onSuccess: (data) => {
      toast.success('Offer accepted!');
      updateXP('acceptOffer', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to accept offer');
      console.error('Accept offer error:', error);
    },
  });

  // Get Current Dutch Price
  const getCurrentDutchPrice = useCallback(async (auctionId) => {
    try {
      const price = await useContractRead({
        address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
        abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
        functionName: 'getCurrentDutchPrice',
        args: [auctionId],
      });
      return price;
    } catch (error) {
      console.error('Error getting Dutch price:', error);
      return null;
    }
  }, []);

  // Calculate tier-based fee discount
  const calculateFeeWithDiscount = useCallback((basePrice) => {
    const discount = currentTier?.benefits?.marketplaceFeeDiscount || 0;
    const platformFee = basePrice * 0.025; // 2.5% base fee
    const discountedFee = platformFee * (1 - discount / 100);
    return {
      originalFee: platformFee,
      discountedFee,
      savings: platformFee - discountedFee,
      discountPercentage: discount
    };
  }, [currentTier]);

  return {
    // State
    listings,
    offers,
    isLoading: isCreatingListing || isCreatingAuction || isPurchasing || isMakingOffer || isAcceptingOffer,
    
    // Functions
    createListing,
    createDutchAuction,
    purchaseNFT,
    makeOffer,
    acceptOffer,
    getCurrentDutchPrice,
    calculateFeeWithDiscount,
    
    // Capabilities based on tier
    canCreateAuctions: (currentTier?.level || 1) >= 3,
    canMakeOffers: (currentTier?.level || 1) >= 2,
    feeDiscount: currentTier?.benefits?.marketplaceFeeDiscount || 0,
    maxListingsPerDay: (currentTier?.benefits?.maxNFTsPerTransaction || 1) * 2,
  };
}

// Advanced Staking Hook
export function useAdvancedStaking() {
  const { address } = useAccount();
  const { currentTier, updateXP } = useTierSystem();
  const [userStakes, setUserStakes] = useState([]);
  const [pools, setPools] = useState([]);

  // Deposit (Token Staking)
  const { config: depositConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    functionName: 'deposit',
  });

  const { write: depositTokens, isLoading: isDepositing } = useContractWrite({
    ...depositConfig,
    onSuccess: (data) => {
      toast.success('Tokens staked successfully!');
      updateXP('stakingDeposit', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to stake tokens');
      console.error('Deposit error:', error);
    },
  });

  // NFT Staking
  const { config: stakeNFTConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    functionName: 'stakeNFT',
  });

  const { write: stakeNFT, isLoading: isStakingNFT } = useContractWrite({
    ...stakeNFTConfig,
    onSuccess: (data) => {
      toast.success('NFT staked successfully!');
      updateXP('nftStaking', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to stake NFT');
      console.error('NFT staking error:', error);
    },
  });

  // Activate Booster
  const { config: activateBoosterConfig } = usePrepareContractWrite({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    functionName: 'activateBooster',
  });

  const { write: activateBooster, isLoading: isActivatingBooster } = useContractWrite({
    ...activateBoosterConfig,
    onSuccess: (data) => {
      toast.success('Booster activated!');
      updateXP('boosterActivation', { txHash: data.hash });
    },
    onError: (error) => {
      toast.error('Failed to activate booster');
      console.error('Booster activation error:', error);
    },
  });

  // Get Pending Rewards
  const getPendingRewards = useCallback(async (pid) => {
    try {
      const rewards = await useContractRead({
        address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
        abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
        functionName: 'pendingReward',
        args: [pid, address],
      });
      return rewards;
    } catch (error) {
      console.error('Error getting pending rewards:', error);
      return 0;
    }
  }, [address]);

  // Calculate staking multiplier with tier benefits
  const calculateStakingMultiplier = useCallback((baseMultiplier = 1.0) => {
    const tierMultiplier = currentTier?.benefits?.stakingMultiplier || 1.0;
    return baseMultiplier * tierMultiplier;
  }, [currentTier]);

  return {
    // State
    userStakes,
    pools,
    isLoading: isDepositing || isStakingNFT || isActivatingBooster,
    
    // Functions
    depositTokens,
    stakeNFT,
    activateBooster,
    getPendingRewards,
    calculateStakingMultiplier,
    
    // Capabilities based on tier
    canStakeNFTs: (currentTier?.level || 1) >= 2,
    canUseBoosters: (currentTier?.level || 1) >= 4,
    stakingMultiplier: currentTier?.benefits?.stakingMultiplier || 1.0,
    maxStakingPools: Math.min((currentTier?.level || 1) * 2, 10),
  };
}

// Combined hook for all enhanced contracts
export function useEnhancedLandKrypt() {
  const nft = useGasOptimizedNFT();
  const marketplace = useEnhancedMarketplace();
  const staking = useAdvancedStaking();
  const { currentTier } = useTierSystem();

  return {
    nft,
    marketplace,
    staking,
    tier: currentTier,
    
    // Combined loading state
    isLoading: nft.isLoading || marketplace.isLoading || staking.isLoading,
    
    // Combined capabilities
    capabilities: {
      batchMinting: nft.canBatchMint,
      auctions: marketplace.canCreateAuctions,
      offers: marketplace.canMakeOffers,
      nftStaking: staking.canStakeNFTs,
      boosters: staking.canUseBoosters,
      feeDiscount: marketplace.feeDiscount,
      stakingMultiplier: staking.stakingMultiplier,
    }
  };
}
