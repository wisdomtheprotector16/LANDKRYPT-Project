// Tier System React Hook
// Provides tier data, XP tracking, and reward management for React components

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useTierSystem() {
  const { address } = useAccount();
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xpHistory, setXpHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // ====== DATA FETCHING ======

  const fetchTierData = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch tier progress from API
      const response = await fetch(`/api/tier/user/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tier data');
      }

      const data = await response.json();
      setTierData(data);

    } catch (err) {
      console.error('Error fetching tier data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchXpHistory = useCallback(async (walletAddress) => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/tier/history/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setXpHistory(data);
      }
    } catch (err) {
      console.error('Error fetching XP history:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/tier/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, []);

  // ====== XP ACTIONS ======

  const awardXP = useCallback(async (activityKey, amount = null, metadata = {}) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/tier/award-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          activityKey,
          amount,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to award XP');
      }

      const result = await response.json();
      
      // Refresh tier data if XP was awarded
      if (result.success) {
        await fetchTierData(address);
        await fetchXpHistory(address);
      }

      return result;
    } catch (err) {
      console.error('Error awarding XP:', err);
      throw err;
    }
  }, [address, fetchTierData, fetchXpHistory]);

  const claimDailyReward = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/tier/daily-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to claim daily reward');
      }

      const result = await response.json();
      
      // Refresh tier data if reward was claimed
      if (result.success) {
        await fetchTierData(address);
        await fetchXpHistory(address);
      }

      return result;
    } catch (err) {
      console.error('Error claiming daily reward:', err);
      throw err;
    }
  }, [address, fetchTierData, fetchXpHistory]);

  // ====== REAL-TIME UPDATES ======

  useEffect(() => {
    if (!address) return;

    // Subscribe to tier progress changes
    const subscription = supabase
      .channel('tier-progress')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_tier_progress',
          filter: `wallet_address=eq.${address}`
        }, 
        (payload) => {
          console.log('Tier progress updated:', payload);
          fetchTierData(address);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [address, fetchTierData]);

  // ====== INITIAL LOAD ======

  useEffect(() => {
    if (address) {
      fetchTierData(address);
      fetchXpHistory(address);
    } else {
      setTierData(null);
      setXpHistory([]);
      setLoading(false);
    }
  }, [address, fetchTierData, fetchXpHistory]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ====== UTILITY FUNCTIONS ======

  const canClaimDailyReward = useCallback(() => {
    if (!tierData) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return tierData.last_daily_xp_claim !== today;
  }, [tierData]);

  const getTimeUntilNextClaim = useCallback(() => {
    if (!tierData?.last_daily_xp_claim) return 0;
    
    const lastClaim = new Date(tierData.last_daily_xp_claim + 'T00:00:00.000Z');
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    return Math.max(0, nextClaim.getTime() - now.getTime());
  }, [tierData]);

  const hasPrivilege = useCallback((privilegeKey) => {
    if (!tierData?.benefits?.privileges) return false;
    
    return tierData.benefits.privileges.some(p => p.key === privilegeKey);
  }, [tierData]);

  const getStakingMultiplier = useCallback(() => {
    return tierData?.currentTierInfo?.benefits?.stakingMultiplier || 1.0;
  }, [tierData]);

  const getMarketplaceFeeDiscount = useCallback(() => {
    return tierData?.currentTierInfo?.benefits?.marketplaceFeeDiscount || 0;
  }, [tierData]);

  const getVotingPower = useCallback(() => {
    return tierData?.currentTierInfo?.benefits?.votingPower || 1.0;
  }, [tierData]);

  const getUserRank = useCallback(() => {
    if (!address || !leaderboard.length) return null;
    
    const userEntry = leaderboard.find(entry => 
      entry.walletAddress.toLowerCase() === address.toLowerCase()
    );
    
    return userEntry?.rank || null;
  }, [address, leaderboard]);

  // ====== ACTIVITY HELPERS ======

  const trackActivity = useCallback(async (activityKey, metadata = {}) => {
    try {
      return await awardXP(activityKey, null, metadata);
    } catch (err) {
      console.error(`Error tracking activity ${activityKey}:`, err);
      return { success: false, error: err.message };
    }
  }, [awardXP]);

  const trackNFTMint = useCallback(async (tokenId, metadata = {}) => {
    return trackActivity('nftMint', { tokenId, ...metadata });
  }, [trackActivity]);

  const trackNFTPurchase = useCallback(async (tokenId, price, metadata = {}) => {
    return trackActivity('nftPurchase', { tokenId, price, ...metadata });
  }, [trackActivity]);

  const trackNFTSale = useCallback(async (tokenId, price, metadata = {}) => {
    return trackActivity('nftSale', { tokenId, price, ...metadata });
  }, [trackActivity]);

  const trackStaking = useCallback(async (amount, metadata = {}) => {
    return trackActivity('stakingDeposit', { amount, ...metadata });
  }, [trackActivity]);

  const trackDAOVoting = useCallback(async (proposalId, vote, metadata = {}) => {
    return trackActivity('daoVoting', { proposalId, vote, ...metadata });
  }, [trackActivity]);

  const trackReferral = useCallback(async (referredAddress, metadata = {}) => {
    return trackActivity('referralSuccess', { referredAddress, ...metadata });
  }, [trackActivity]);

  // ====== COMPUTED VALUES ======

  const isMaxTier = tierData?.nextTier?.isMaxTier || false;
  const currentTier = tierData?.currentTierInfo || null;
  const nextTier = tierData?.nextTier?.nextTier || null;
  const xpToNextTier = tierData?.nextTier?.xpNeeded || 0;
  const tierProgress = tierData?.progress?.progress || 0;
  const totalXP = tierData?.total_xp || 0;
  const userRank = getUserRank();

  return {
    // Data
    tierData,
    currentTier,
    nextTier,
    xpHistory,
    leaderboard,
    loading,
    error,

    // Computed values
    isMaxTier,
    xpToNextTier,
    tierProgress,
    totalXP,
    userRank,

    // Actions
    awardXP,
    claimDailyReward,
    fetchTierData: () => fetchTierData(address),
    fetchLeaderboard,

    // Activity tracking
    trackActivity,
    trackNFTMint,
    trackNFTPurchase,
    trackNFTSale,
    trackStaking,
    trackDAOVoting,
    trackReferral,

    // Utilities
    canClaimDailyReward,
    getTimeUntilNextClaim,
    hasPrivilege,
    getStakingMultiplier,
    getMarketplaceFeeDiscount,
    getVotingPower
  };
}
