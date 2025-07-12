import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

// XP earning rates based on requirements
const XP_RATES = {
  DAILY_LOGIN: 30,
  STAKING: (amount) => Math.floor(amount * 0.1), // 10% of staked amount
  VOTING: (voteWeight) => Math.floor(voteWeight * 0.03), // 3% of vote weight
};

// Tier thresholds
const TIER_THRESHOLDS = {
  1: { name: 'Territory Trainee', requiredXP: 0 },
  2: { name: 'Plot Pioneer', requiredXP: 5000 },
  3: { name: 'Estate Architect', requiredXP: 10000 },
  4: { name: 'Dominion Magnate', requiredXP: 15000 },
  5: { name: 'Realm Sovereign', requiredXP: 20000 },
};

export const useTierSystem = () => {
  const { address } = useAccount();
  
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  const [tierData, setTierData] = useState({
    totalXP: 0,
    currentTier: 1,
    tierProgress: 0,
    lastLogin: null,
    showAnimation: false,
    newXP: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);
  
  // Check if Supabase is available
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Dynamically import supabase to avoid top-level await
        const { supabase } = await import('../lib/supabase');
        if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setIsSupabaseAvailable(true);
        } else {
          console.warn('Supabase not configured or available');
          setIsSupabaseAvailable(false);
        }
      } catch (err) {
        console.warn('Supabase check failed:', err);
        setIsSupabaseAvailable(false);
      }
    };
    
    checkSupabase();
  }, []);

  // Calculate tier from total XP
  const calculateTier = useCallback((totalXP) => {
    let currentTier = 1;
    let tierProgress = totalXP;

    for (let tier = 5; tier >= 1; tier--) {
      if (totalXP >= TIER_THRESHOLDS[tier].requiredXP) {
        currentTier = tier;
        if (tier < 5) {
          tierProgress = totalXP - TIER_THRESHOLDS[tier].requiredXP;
        } else {
          tierProgress = 5000; // Max tier progress
        }
        break;
      }
    }

    return { currentTier, tierProgress };
  }, []);

  // Initialize or fetch user tier data
  const initializeTierData = useCallback(async () => {
    if (!address) return;
    
    // Check if Supabase is available
    if (!isSupabaseAvailable) {
      console.warn('Supabase not available, using local fallback');
      // Use local storage as fallback
      if (isBrowser) {
        try {
          const localData = localStorage.getItem(`tier_data_${address}`);
          if (localData) {
            const parsed = JSON.parse(localData);
            setTierData(parsed);
          }
        } catch (err) {
          console.warn('Local storage fallback failed:', err);
        }
      }
      return;
    }

    setLoading(true);
    try {
      // Dynamically import supabase for actual database operations
      const { supabase } = await import('../lib/supabase');
      
      // Check if user exists in tier progress table
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_tier_progress')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        // User exists, update state
        const { currentTier, tierProgress } = calculateTier(existingUser.total_xp);
        setTierData({
          totalXP: existingUser.total_xp,
          currentTier,
          tierProgress,
          lastLogin: existingUser.last_login,
          showAnimation: false,
          newXP: 0,
        });
      } else {
        // New user, create entry
        const { error: insertError } = await supabase
          .from('user_tier_progress')
          .insert({
            wallet_address: address,
            total_xp: 0,
            tier_progress: 0,
            current_tier: 1,
            last_login: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        setTierData({
          totalXP: 0,
          currentTier: 1,
          tierProgress: 0,
          lastLogin: new Date().toISOString(),
          showAnimation: false,
          newXP: 0,
        });
      }
    } catch (err) {
      console.error('Error initializing tier data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address, calculateTier, isSupabaseAvailable, isBrowser]);

  // Save to localStorage as fallback
  const saveToLocalStorage = useCallback((data) => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(`tier_data_${address}`, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save tier data to localStorage:', err);
    }
  }, [address, isBrowser]);
  
  // Award XP for various actions
  const awardXP = useCallback(async (actionType, actionData = {}) => {
    if (!address) return;

    let xpToAward = 0;
    
    // If Supabase is not available, use localStorage fallback
    if (!isSupabaseAvailable) {
      console.warn('Supabase not available, using localStorage for XP award');
      
      // Get current XP from localStorage or default
      const currentTotalXP = tierData.totalXP || 0;
      
      // Calculate XP to award
      switch (actionType) {
        case 'DAILY_LOGIN':
          // Simple daily check using localStorage
          if (isBrowser) {
            const lastClaim = localStorage.getItem(`last_daily_claim_${address}`);
            const now = Date.now();
            if (!lastClaim || now - parseInt(lastClaim) >= 24 * 60 * 60 * 1000) {
              xpToAward = actionData?.customXP || XP_RATES.DAILY_LOGIN;
              localStorage.setItem(`last_daily_claim_${address}`, now.toString());
            } else {
              return { success: false, message: 'Daily XP already claimed' };
            }
          } else {
            xpToAward = actionData?.customXP || XP_RATES.DAILY_LOGIN; // Always allow on server
          }
          break;
        case 'STAKING':
          xpToAward = XP_RATES.STAKING(actionData.amount || 0);
          break;
        case 'VOTING':
          xpToAward = XP_RATES.VOTING(actionData.voteWeight || 0);
          break;
        default:
          return { success: false, message: 'Invalid action type' };
      }
      
      if (xpToAward <= 0) {
        return { success: false, message: 'No XP to award' };
      }
      
      const newTotalXP = currentTotalXP + xpToAward;
      const { currentTier, tierProgress } = calculateTier(newTotalXP);
      
      const newTierData = {
        totalXP: newTotalXP,
        currentTier,
        tierProgress,
        lastLogin: new Date().toISOString(),
        showAnimation: true,
        newXP: xpToAward,
      };
      
      setTierData(newTierData);
      saveToLocalStorage(newTierData);
      
      // Reset animation
      setTimeout(() => {
        setTierData(prev => ({ ...prev, showAnimation: false, newXP: 0 }));
      }, 3000);
      
      return { 
        success: true, 
        xpAwarded: xpToAward, 
        newTotalXP, 
        currentTier,
        tierUp: false // Can't determine from localStorage easily
      };
    }

    try {
      // Dynamically import supabase for database operations
      const { supabase } = await import('../lib/supabase');
      
      switch (actionType) {
        case 'DAILY_LOGIN':
          // Check if user has already claimed daily XP
          const { data: userData } = await supabase
            .from('user_tier_progress')
            .select('last_daily_xp_claim')
            .eq('wallet_address', address)
            .single();

          const lastClaim = userData?.last_daily_xp_claim;
          const now = new Date();
          const lastClaimDate = lastClaim ? new Date(lastClaim) : null;

          // Check if 24 hours have passed
          if (!lastClaimDate || now - lastClaimDate >= 24 * 60 * 60 * 1000) {
            xpToAward = XP_RATES.DAILY_LOGIN;
          } else {
            return { success: false, message: 'Daily XP already claimed' };
          }
          break;

        case 'STAKING':
          xpToAward = XP_RATES.STAKING(actionData.amount || 0);
          break;

        case 'VOTING':
          xpToAward = XP_RATES.VOTING(actionData.voteWeight || 0);
          break;

        default:
          return { success: false, message: 'Invalid action type' };
      }

      if (xpToAward <= 0) {
        return { success: false, message: 'No XP to award' };
      }

      // Get current user data
      const { data: currentData, error: fetchError } = await supabase
        .from('user_tier_progress')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (fetchError) throw fetchError;

      const newTotalXP = currentData.total_xp + xpToAward;
      const { currentTier, tierProgress } = calculateTier(newTotalXP);

      // Update database
      const updateData = {
        total_xp: newTotalXP,
        tier_progress: tierProgress,
        current_tier: currentTier,
        updated_at: new Date().toISOString(),
      };

      if (actionType === 'DAILY_LOGIN') {
        updateData.last_daily_xp_claim = new Date().toISOString();
        updateData.last_login = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('user_tier_progress')
        .update(updateData)
        .eq('wallet_address', address);

      if (updateError) throw updateError;

      // Update local state with animation
      setTierData(prev => ({
        ...prev,
        totalXP: newTotalXP,
        currentTier,
        tierProgress,
        showAnimation: true,
        newXP: xpToAward,
      }));

      // Reset animation after delay
      setTimeout(() => {
        setTierData(prev => ({
          ...prev,
          showAnimation: false,
          newXP: 0,
        }));
      }, 3000);

      return { 
        success: true, 
        xpAwarded: xpToAward, 
        newTotalXP, 
        currentTier,
        tierUp: currentTier > currentData.current_tier 
      };

    } catch (err) {
      console.error('Error awarding XP:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, [address, calculateTier, isSupabaseAvailable, tierData.totalXP, isBrowser, saveToLocalStorage]);

  // Check for daily login XP with enhanced rewards
  const claimDailyXP = useCallback(async () => {
    if (!address) return { success: false, message: 'Wallet not connected' };

    try {
      // Check if already claimed today
      const lastClaim = localStorage.getItem(`lastDailyClaim_${address}`);
      const today = new Date().toDateString();

      if (lastClaim === today) {
        return { success: false, message: 'Already claimed today' };
      }

      // Get login streak data
      const loginData = JSON.parse(localStorage.getItem(`dailyLogin_${address}`) || '{}');
      const streak = loginData.streak || 0;

      // Get current tier rewards
      const currentTier = tierData.currentTier;
      const tierConfig = TIER_CONFIG[currentTier];
      const baseXP = tierConfig?.rewards?.dailyXP || 10;
      const dailyTokens = tierConfig?.rewards?.dailyTokens || 5;
      const streakMultiplier = tierConfig?.rewards?.streakMultiplier || 1.0;

      // Calculate streak bonus
      let finalXP = baseXP;

      if (streak > 0) {
        const multiplier = Math.min(1 + (streak * 0.1), streakMultiplier);
        finalXP = Math.floor(baseXP * multiplier);
      }

      // Award XP through the existing system
      const result = await awardXP('DAILY_LOGIN', { customXP: finalXP });

      if (result.success) {
        // Store claim date
        localStorage.setItem(`lastDailyClaim_${address}`, today);

        return {
          ...result,
          tokensGained: dailyTokens,
          streak: streak + 1,
          message: `Claimed ${finalXP} XP and ${dailyTokens} tokens!`
        };
      }

      return result;

    } catch (error) {
      console.error('Error claiming daily XP:', error);
      return { success: false, message: 'Failed to claim daily XP' };
    }
  }, [awardXP, address, tierData.currentTier]);

  // Award staking XP
  const awardStakingXP = useCallback(async (amount) => {
    return await awardXP('STAKING', { amount });
  }, [awardXP]);

  // Award voting XP
  const awardVotingXP = useCallback(async (voteWeight) => {
    return await awardXP('VOTING', { voteWeight });
  }, [awardXP]);

  // Get tier name and info
  const getTierInfo = useCallback((tier = tierData.currentTier) => {
    return TIER_THRESHOLDS[tier] || TIER_THRESHOLDS[1];
  }, [tierData.currentTier]);

  // Get XP needed for next tier
  const getXPToNextTier = useCallback(() => {
    if (tierData.currentTier >= 5) return 0;
    return 5000 - tierData.tierProgress;
  }, [tierData.currentTier, tierData.tierProgress]);

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    if (tierData.currentTier >= 5) return 100;
    return (tierData.tierProgress / 5000) * 100;
  }, [tierData.currentTier, tierData.tierProgress]);

  // Initialize on wallet connection
  useEffect(() => {
    if (address) {
      initializeTierData();
    } else {
      // Reset data when wallet disconnected
      setTierData({
        totalXP: 0,
        currentTier: 1,
        tierProgress: 0,
        lastLogin: null,
        showAnimation: false,
        newXP: 0,
      });
    }
  }, [address, initializeTierData]);

  return {
    tierData,
    loading,
    error,
    claimDailyXP,
    awardStakingXP,
    awardVotingXP,
    getTierInfo,
    getXPToNextTier,
    getProgressPercentage,
    initializeTierData,
  };
};

export default useTierSystem;
