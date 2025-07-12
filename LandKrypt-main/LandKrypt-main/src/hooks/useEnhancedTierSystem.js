// Enhanced Tier System Hook for LandKrypt Upgrades
// Integrates with upgraded contracts and provides comprehensive tier management

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractEvent } from 'wagmi';
import { TierSystemManager } from '../config/tier-system';
import { ENHANCED_CONTRACTS } from '../contracts/enhanced-abis';
import { toast } from 'react-hot-toast';

export const useEnhancedTierSystem = () => {
  const { address } = useAccount();
  
  const [tierData, setTierData] = useState({
    totalXP: 0,
    currentTier: 1,
    tierProgress: 0,
    lastLogin: null,
    showAnimation: false,
    newXP: 0,
    nftsOwned: 0,
    totalStaked: 0,
    marketplaceTransactions: 0,
    governanceParticipation: 0,
    consecutiveDays: 0,
    gasSaved: 0,
    milestoneProgress: {},
    tierBenefits: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contractEvents, setContractEvents] = useState([]);

  // Load tier data from database
  const loadTierData = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Try to load from database first
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('user_tier_progress')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const currentTier = TierSystemManager.calculateTier(data.total_xp);
        const tierProgress = TierSystemManager.calculateTierProgress(data.total_xp);
        const milestoneProgress = TierSystemManager.getMilestoneProgress({
          nftsOwned: data.nfts_owned || 0,
          totalStaked: data.total_staked || 0,
          marketplaceTransactions: data.marketplace_transactions || 0,
          governanceParticipation: data.governance_participation || 0,
          consecutiveStakingDays: data.consecutive_days || 0,
          gasSaved: data.gas_saved || 0,
        });

        setTierData({
          totalXP: data.total_xp,
          currentTier: currentTier.level,
          tierProgress,
          lastLogin: data.last_activity,
          nftsOwned: data.nfts_owned || 0,
          totalStaked: parseFloat(data.total_staked || 0),
          marketplaceTransactions: data.marketplace_transactions || 0,
          governanceParticipation: data.governance_participation || 0,
          consecutiveDays: data.consecutive_days || 0,
          gasSaved: data.gas_saved || 0,
          milestoneProgress,
          tierBenefits: TierSystemManager.getContractBenefits(currentTier.level),
          showAnimation: false,
          newXP: 0,
        });
      } else {
        // Initialize new user
        await initializeNewUser();
      }
    } catch (err) {
      console.error('Error loading tier data:', err);
      setError(err.message);
      // Fallback to local storage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Initialize new user
  const initializeNewUser = useCallback(async () => {
    if (!address) return;

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase
        .from('user_tier_progress')
        .insert({
          wallet_address: address.toLowerCase(),
          total_xp: 0,
          current_tier: 1,
          nfts_owned: 0,
          total_staked: 0,
          marketplace_transactions: 0,
          governance_participation: 0,
          consecutive_days: 0,
          gas_saved: 0,
          last_activity: new Date().toISOString(),
        });

      if (error) throw error;

      setTierData({
        totalXP: 0,
        currentTier: 1,
        tierProgress: 0,
        lastLogin: new Date().toISOString(),
        nftsOwned: 0,
        totalStaked: 0,
        marketplaceTransactions: 0,
        governanceParticipation: 0,
        consecutiveDays: 0,
        gasSaved: 0,
        milestoneProgress: {},
        tierBenefits: TierSystemManager.getContractBenefits(1),
        showAnimation: false,
        newXP: 0,
      });
    } catch (err) {
      console.error('Error initializing user:', err);
      setError(err.message);
    }
  }, [address]);

  // Update XP from contract events
  const updateXPFromEvent = useCallback(async (eventName, eventData) => {
    if (!address) return;

    try {
      const xpEarned = TierSystemManager.calculateXPFromContractEvent(
        eventName,
        eventData,
        tierData.currentTier
      );

      if (xpEarned > 0) {
        await updateXP(eventName, { 
          xpEarned, 
          eventData,
          txHash: eventData.transactionHash 
        });
      }
    } catch (err) {
      console.error('Error updating XP from event:', err);
    }
  }, [address, tierData.currentTier]);

  // Update XP and tier progress
  const updateXP = useCallback(async (activityType, data = {}) => {
    if (!address) return;

    try {
      const activity = TierSystemManager.xpActivities[activityType];
      if (!activity) return;

      const xpToAdd = data.xpEarned || TierSystemManager.calculateXPFromContractEvent(
        activity.contractEvent,
        data.eventData || {},
        tierData.currentTier
      );

      const newTotalXP = tierData.totalXP + xpToAdd;
      const newTier = TierSystemManager.calculateTier(newTotalXP);
      const newProgress = TierSystemManager.calculateTierProgress(newTotalXP);
      
      // Check for tier upgrade
      const tierUpgraded = newTier.level > tierData.currentTier;

      // Update database
      const { supabase } = await import('../lib/supabase');
      const updateData = {
        total_xp: newTotalXP,
        current_tier: newTier.level,
        last_activity: new Date().toISOString(),
      };

      // Update specific metrics based on activity
      switch (activityType) {
        case 'nftMint':
        case 'batchMint':
          updateData.nfts_owned = tierData.nftsOwned + (data.eventData?.tokenIds?.length || 1);
          break;
        case 'nftPurchase':
        case 'nftSale':
          updateData.marketplace_transactions = tierData.marketplaceTransactions + 1;
          break;
        case 'stakingDeposit':
        case 'nftStaking':
          updateData.total_staked = tierData.totalStaked + (data.eventData?.amount || 0);
          break;
        case 'daoVoting':
        case 'quadraticVoting':
          updateData.governance_participation = tierData.governanceParticipation + 1;
          break;
        case 'gasOptimization':
          updateData.gas_saved = tierData.gasSaved + (data.gasSaved || 0);
          break;
      }

      const { error } = await supabase
        .from('user_tier_progress')
        .update(updateData)
        .eq('wallet_address', address.toLowerCase());

      if (error) throw error;

      // Record XP activity
      await supabase
        .from('xp_activities')
        .insert({
          user_address: address.toLowerCase(),
          activity_type: activityType,
          xp_earned: xpToAdd,
          tier_multiplier: tierData.tierBenefits?.stakingMultiplier || 1.0,
          description: activity.description,
          tx_hash: data.txHash,
          metadata: data.eventData || {},
        });

      // Update local state
      setTierData(prev => ({
        ...prev,
        totalXP: newTotalXP,
        currentTier: newTier.level,
        tierProgress: newProgress,
        showAnimation: true,
        newXP: xpToAdd,
        ...updateData,
        tierBenefits: TierSystemManager.getContractBenefits(newTier.level),
      }));

      // Show notifications
      if (tierUpgraded) {
        toast.success(`🎉 Tier upgraded to ${newTier.name}!`, {
          duration: 5000,
          icon: '🏆',
        });
      } else {
        toast.success(`+${xpToAdd} XP earned!`, {
          duration: 2000,
          icon: '⭐',
        });
      }

      // Check for milestone achievements
      await checkMilestones(updateData);

    } catch (err) {
      console.error('Error updating XP:', err);
      setError(err.message);
    }
  }, [address, tierData]);

  // Check for milestone achievements
  const checkMilestones = useCallback(async (userData) => {
    try {
      const milestoneProgress = TierSystemManager.getMilestoneProgress(userData);
      
      for (const [key, milestone] of Object.entries(milestoneProgress)) {
        if (milestone.completed && !tierData.milestoneProgress[key]?.completed) {
          // New milestone achieved
          const { supabase } = await import('../lib/supabase');
          await supabase
            .from('tier_milestones')
            .insert({
              user_address: address.toLowerCase(),
              milestone_key: key,
              milestone_name: milestone.name,
              xp_reward: milestone.xpReward,
            });

          // Award milestone XP
          await updateXP('milestoneAchievement', {
            xpEarned: milestone.xpReward,
            milestone: milestone.name,
          });

          toast.success(`🏅 Milestone achieved: ${milestone.name}!`, {
            duration: 5000,
            icon: milestone.badge,
          });
        }
      }

      setTierData(prev => ({
        ...prev,
        milestoneProgress,
      }));
    } catch (err) {
      console.error('Error checking milestones:', err);
    }
  }, [address, tierData.milestoneProgress, updateXP]);

  // Contract event listeners
  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    eventName: 'PropertyMinted',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.to?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('PropertyMinted', {
            tokenId: log.args.tokenId,
            to: log.args.to,
            price: log.args.price,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.GAS_OPTIMIZED_NFT,
    abi: ENHANCED_CONTRACTS.abis.GAS_OPTIMIZED_NFT,
    eventName: 'BatchMinted',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.to?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('BatchMinted', {
            to: log.args.to,
            tokenIds: log.args.tokenIds,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    eventName: 'AuctionCreated',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.seller?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('AuctionCreated', {
            auctionId: log.args.auctionId,
            seller: log.args.seller,
            auctionType: 'dutch', // Determine from contract
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.ENHANCED_MARKETPLACE,
    abi: ENHANCED_CONTRACTS.abis.ENHANCED_MARKETPLACE,
    eventName: 'OfferMade',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.offerer?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('OfferMade', {
            offerer: log.args.offerer,
            amount: log.args.amount,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    eventName: 'Deposit',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('Deposit', {
            user: log.args.user,
            pid: log.args.pid,
            amount: log.args.amount,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    eventName: 'NFTStaked',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('NFTStaked', {
            user: log.args.user,
            poolId: log.args.poolId,
            tokenId: log.args.tokenId,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  useContractEvent({
    address: ENHANCED_CONTRACTS.addresses.ADVANCED_STAKING,
    abi: ENHANCED_CONTRACTS.abis.ADVANCED_STAKING,
    eventName: 'BoosterActivated',
    listener: (logs) => {
      logs.forEach(log => {
        if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
          updateXPFromEvent('BoosterActivated', {
            user: log.args.user,
            boosterId: log.args.boosterId,
            endTime: log.args.endTime,
            transactionHash: log.transactionHash,
          });
        }
      });
    },
  });

  // Load data on mount and address change
  useEffect(() => {
    if (address) {
      loadTierData();
    }
  }, [address, loadTierData]);

  // Hide animation after delay
  useEffect(() => {
    if (tierData.showAnimation) {
      const timer = setTimeout(() => {
        setTierData(prev => ({ ...prev, showAnimation: false, newXP: 0 }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [tierData.showAnimation]);

  // Fallback to local storage
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined' && address) {
      const stored = localStorage.getItem(`tierData_${address}`);
      if (stored) {
        const data = JSON.parse(stored);
        setTierData(prev => ({ ...prev, ...data }));
      }
    }
  }, [address]);

  // Save to local storage
  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== 'undefined' && address) {
      localStorage.setItem(`tierData_${address}`, JSON.stringify(tierData));
    }
  }, [address, tierData]);

  // Save to local storage when data changes
  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  return {
    // State
    ...tierData,
    loading,
    error,
    
    // Functions
    updateXP,
    loadTierData,
    
    // Tier system utilities
    getTierBenefits: (tier) => TierSystemManager.getContractBenefits(tier || tierData.currentTier),
    canAccessFeature: (feature) => TierSystemManager.canAccessFeature(tierData.currentTier, feature),
    getMarketplaceFeeDiscount: () => TierSystemManager.calculateMarketplaceFeeDiscount(tierData.currentTier),
    getStakingMultiplier: () => TierSystemManager.getStakingMultiplier(tierData.currentTier),
    getVotingPowerMultiplier: () => TierSystemManager.getVotingPowerMultiplier(tierData.currentTier),
    getMaxBatchSize: () => TierSystemManager.getMaxBatchSize(tierData.currentTier),
    
    // Contract integration
    contractEvents,
    isEnhanced: true,
  };
};
