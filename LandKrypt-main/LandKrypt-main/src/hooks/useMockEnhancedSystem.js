// Mock Enhanced System Hook for Demo Mode
// Provides mock data and functionality when contracts aren't deployed

import { useState, useEffect } from 'react';
import mockData from '../data/mockData.json';

export function useMockEnhancedTierSystem() {
  const [tierData, setTierData] = useState({
    totalXP: 2750,
    currentTier: 3,
    tierProgress: 75,
    lastLogin: new Date().toISOString(),
    showAnimation: false,
    newXP: 0,
    nftsOwned: 5,
    totalStaked: 2500,
    marketplaceTransactions: 12,
    governanceParticipation: 6,
    consecutiveDays: 45,
    gasSaved: 15420,
    milestoneProgress: {
      firstNFT: { completed: true, progress: 100, current: 5, target: 1, name: 'First NFT Owner', badge: '🎯', xpReward: 100 },
      portfolioBuilder: { completed: true, progress: 100, current: 5, target: 5, name: 'Portfolio Builder', badge: '📈', xpReward: 250 },
      batchMinter: { completed: true, progress: 100, current: 3, target: 1, name: 'Batch Minter', badge: '⚡', xpReward: 200 },
      auctioneer: { completed: true, progress: 100, current: 2, target: 1, name: 'Auctioneer', badge: '🔨', xpReward: 150 },
      stakingChampion: { completed: true, progress: 100, current: 45, target: 30, name: 'Staking Champion', badge: '⚡', xpReward: 500 },
      marketMaker: { completed: true, progress: 100, current: 12, target: 10, name: 'Market Maker', badge: '🏪', xpReward: 300 },
      gasOptimizer: { completed: true, progress: 100, current: 15420, target: 1000, name: 'Gas Optimizer', badge: '⛽', xpReward: 200 },
    },
    tierBenefits: {
      marketplaceFeeDiscount: 15,
      maxBatchMintSize: 30,
      canAccessExclusiveDrops: true,
      stakingMultiplier: 1.3,
      votingPowerMultiplier: 1.3,
      priorityProcessing: true,
      gasRefundPercentage: 15,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateXP = (activityType, data = {}) => {
    const xpToAdd = data.xpEarned || 50; // Default XP
    
    setTierData(prev => ({
      ...prev,
      totalXP: prev.totalXP + xpToAdd,
      showAnimation: true,
      newXP: xpToAdd,
    }));

    // Hide animation after delay
    setTimeout(() => {
      setTierData(prev => ({ ...prev, showAnimation: false, newXP: 0 }));
    }, 3000);
  };

  const getTierBenefits = (tier) => tierData.tierBenefits;
  const canAccessFeature = (feature) => true; // All features available in demo
  const getMarketplaceFeeDiscount = () => tierData.tierBenefits.marketplaceFeeDiscount;
  const getStakingMultiplier = () => tierData.tierBenefits.stakingMultiplier;
  const getVotingPowerMultiplier = () => tierData.tierBenefits.votingPowerMultiplier;
  const getMaxBatchSize = () => tierData.tierBenefits.maxBatchMintSize;

  return {
    ...tierData,
    loading,
    error,
    updateXP,
    getTierBenefits,
    canAccessFeature,
    getMarketplaceFeeDiscount,
    getStakingMultiplier,
    getVotingPowerMultiplier,
    getMaxBatchSize,
    isEnhanced: true,
  };
}

export function useMockGasOptimizedNFT() {
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(5);
  const [totalSupply, setTotalSupply] = useState(1247);

  const mintNFT = async (to, uri, propertyData, royaltyFee) => {
    setIsLoading(true);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBalance(prev => prev + 1);
    setTotalSupply(prev => prev + 1);
    setIsLoading(false);
    
    return { tokenId: totalSupply + 1, txHash: '0x123...', gasUsed: 120000 };
  };

  const batchMintNFTs = async (mintData) => {
    setIsLoading(true);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const count = mintData.length;
    setBalance(prev => prev + count);
    setTotalSupply(prev => prev + count);
    setIsLoading(false);
    
    const tokenIds = Array.from({ length: count }, (_, i) => totalSupply + i + 1);
    return { tokenIds, txHash: '0x456...', gasUsed: 800000 };
  };

  const getPropertyData = async (tokenId) => {
    return {
      price: '2.5',
      propertyType: 1,
      location: 1,
      rarity: 3,
      attributes: 0x1234,
      timestamp: new Date(),
    };
  };

  return {
    balance,
    totalSupply,
    isLoading,
    mintNFT,
    batchMintNFTs,
    getPropertyData,
    canBatchMint: true,
    maxBatchSize: 30,
  };
}

export function useMockEnhancedMarketplace() {
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState(mockData.nfts || []);

  const createListing = async (nftContract, tokenId, price, currency, duration) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    return { listingId: Date.now(), txHash: '0x789...' };
  };

  const createDutchAuction = async (nftContract, tokenId, startPrice, endPrice, duration) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    return { auctionId: Date.now(), txHash: '0xabc...' };
  };

  const makeOffer = async (nftContract, tokenId, amount, currency, expiry) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    return { txHash: '0xdef...' };
  };

  const purchaseNFT = async (listingId, nftContract, tokenId, currency) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsLoading(false);
    return { txHash: '0xghi...' };
  };

  const calculateFeeWithDiscount = (basePrice) => {
    const discount = 15; // 15% discount
    const platformFee = basePrice * 0.025;
    const discountedFee = platformFee * (1 - discount / 100);
    return {
      originalFee: platformFee,
      discountedFee,
      savings: platformFee - discountedFee,
      discountPercentage: discount
    };
  };

  return {
    listings,
    isLoading,
    createListing,
    createDutchAuction,
    makeOffer,
    purchaseNFT,
    calculateFeeWithDiscount,
    canCreateAuctions: true,
    canMakeOffers: true,
    feeDiscount: 15,
    maxListingsPerDay: 20,
  };
}

export function useMockAdvancedStaking() {
  const [isLoading, setIsLoading] = useState(false);
  const [userStakes, setUserStakes] = useState([
    { poolId: 0, amount: '1000', rewards: '75', lockEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    { poolId: 1, amount: '1500', rewards: '100', lockEndTime: Date.now() + 14 * 24 * 60 * 60 * 1000 },
  ]);

  const depositTokens = async (poolId, amount) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    return { txHash: '0xjkl...' };
  };

  const stakeNFT = async (poolId, tokenId) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    return { txHash: '0xmno...' };
  };

  const activateBooster = async (poolId, boosterId) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    return { txHash: '0xpqr...' };
  };

  const getPendingRewards = async (poolId) => {
    return '125.5'; // Mock pending rewards
  };

  const calculateStakingMultiplier = (baseMultiplier = 1.0) => {
    return baseMultiplier * 1.3; // Tier 3 multiplier
  };

  return {
    userStakes,
    isLoading,
    depositTokens,
    stakeNFT,
    activateBooster,
    getPendingRewards,
    calculateStakingMultiplier,
    canStakeNFTs: true,
    canUseBoosters: true,
    stakingMultiplier: 1.3,
    maxStakingPools: 6,
  };
}

export function useMockEnhancedLandKrypt() {
  const nft = useMockGasOptimizedNFT();
  const marketplace = useMockEnhancedMarketplace();
  const staking = useMockAdvancedStaking();
  const tier = useMockEnhancedTierSystem();

  return {
    nft,
    marketplace,
    staking,
    tier,
    isLoading: nft.isLoading || marketplace.isLoading || staking.isLoading,
    capabilities: {
      batchMinting: true,
      auctions: true,
      offers: true,
      nftStaking: true,
      boosters: true,
      feeDiscount: 15,
      stakingMultiplier: 1.3,
    }
  };
}
