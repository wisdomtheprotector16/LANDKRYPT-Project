// Enhanced Daily Login Bonus Component
// Integrated with tier system for progressive rewards

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GiftIcon, 
  ClockIcon, 
  StarIcon,
  TrophyIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useTierSystem } from '../../hooks/useTierSystem';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Daily login streak rewards based on tier
const TIER_DAILY_REWARDS = {
  1: { baseXP: 10, bonusTokens: 5, streakMultiplier: 1.0 },
  2: { baseXP: 15, bonusTokens: 8, streakMultiplier: 1.2 },
  3: { baseXP: 20, bonusTokens: 12, streakMultiplier: 1.4 },
  4: { baseXP: 25, bonusTokens: 18, streakMultiplier: 1.6 },
  5: { baseXP: 30, bonusTokens: 25, streakMultiplier: 2.0 }
};

// Streak milestone rewards
const STREAK_MILESTONES = {
  7: { bonusXP: 50, bonusTokens: 25, title: "Week Warrior" },
  14: { bonusXP: 100, bonusTokens: 50, title: "Fortnight Fighter" },
  30: { bonusXP: 250, bonusTokens: 100, title: "Monthly Master" },
  60: { bonusXP: 500, bonusTokens: 200, title: "Dedication Legend" },
  100: { bonusXP: 1000, bonusTokens: 500, title: "Century Champion" }
};

export default function DailyLoginBonus() {
  const { address } = useAccount();
  const { 
    tierData, 
    claimDailyXP, 
    loading: tierLoading 
  } = useTierSystem();

  const [loginData, setLoginData] = useState({
    canClaim: false,
    lastClaim: null,
    streak: 0,
    nextClaimTime: null,
    totalClaimed: 0
  });
  const [claiming, setClaiming] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [lastReward, setLastReward] = useState(null);

  // Load login data from localStorage and API
  const loadLoginData = useCallback(async () => {
    if (!address) return;

    try {
      // Load from localStorage
      const stored = localStorage.getItem(`dailyLogin_${address}`);
      if (stored) {
        const data = JSON.parse(stored);
        setLoginData(data);
      }

      // Check if can claim (24 hours since last claim)
      const lastClaim = loginData.lastClaim ? new Date(loginData.lastClaim) : null;
      const now = new Date();
      const canClaim = !lastClaim || (now - lastClaim) >= 24 * 60 * 60 * 1000;
      
      setLoginData(prev => ({ ...prev, canClaim }));

    } catch (error) {
      console.error('Error loading login data:', error);
    }
  }, [address, loginData.lastClaim]);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      if (!loginData.lastClaim) {
        setTimeUntilNext('');
        return;
      }

      const lastClaim = new Date(loginData.lastClaim);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = nextClaim - now;

      if (diff <= 0) {
        setTimeUntilNext('');
        setLoginData(prev => ({ ...prev, canClaim: true }));
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [loginData.lastClaim]);

  // Load data on mount and address change
  useEffect(() => {
    loadLoginData();
  }, [loadLoginData]);

  // Calculate rewards based on tier and streak
  const calculateRewards = useCallback(() => {
    const currentTier = tierData?.currentTier || 1;
    const tierRewards = TIER_DAILY_REWARDS[currentTier];
    const streak = loginData.streak;

    let baseXP = tierRewards.baseXP;
    let bonusTokens = tierRewards.bonusTokens;
    let streakBonus = 0;

    // Apply streak multiplier
    if (streak > 0) {
      const streakMultiplier = Math.min(1 + (streak * 0.1), tierRewards.streakMultiplier);
      baseXP = Math.floor(baseXP * streakMultiplier);
      bonusTokens = Math.floor(bonusTokens * streakMultiplier);
    }

    // Check for streak milestone bonus
    const milestone = STREAK_MILESTONES[streak + 1];
    if (milestone) {
      streakBonus = milestone.bonusXP;
    }

    return {
      xp: baseXP,
      bonusXP: streakBonus,
      tokens: bonusTokens,
      totalXP: baseXP + streakBonus,
      milestone: milestone?.title
    };
  }, [tierData?.currentTier, loginData.streak]);

  // Handle daily login claim
  const handleClaimDaily = async () => {
    if (!address || claiming || !loginData.canClaim) return;

    setClaiming(true);
    
    try {
      // Calculate rewards
      const rewards = calculateRewards();
      
      // Claim XP through tier system
      const result = await claimDailyXP();
      
      if (result.success) {
        const now = new Date();
        const newStreak = loginData.streak + 1;
        
        // Update login data
        const newLoginData = {
          canClaim: false,
          lastClaim: now.toISOString(),
          streak: newStreak,
          nextClaimTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          totalClaimed: loginData.totalClaimed + 1
        };
        
        setLoginData(newLoginData);
        
        // Save to localStorage
        localStorage.setItem(`dailyLogin_${address}`, JSON.stringify(newLoginData));
        
        // Show reward animation
        setLastReward(rewards);
        setShowRewardAnimation(true);
        
        // Success toast
        toast.success(
          `Daily bonus claimed! +${rewards.totalXP} XP${rewards.milestone ? ` • ${rewards.milestone}!` : ''}`,
          { duration: 4000 }
        );
        
        // Hide animation after delay
        setTimeout(() => {
          setShowRewardAnimation(false);
        }, 3000);
        
      } else {
        toast.error(result.message || 'Failed to claim daily bonus');
      }
      
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      toast.error('Failed to claim daily bonus');
    } finally {
      setClaiming(false);
    }
  };

  // Get tier color
  const getTierColor = (tier) => {
    const colors = {
      1: 'text-gray-400',
      2: 'text-green-400', 
      3: 'text-blue-400',
      4: 'text-purple-400',
      5: 'text-yellow-400'
    };
    return colors[tier] || 'text-gray-400';
  };

  // Get tier icon
  const getTierIcon = (tier) => {
    if (tier >= 4) return TrophyIcon;
    if (tier >= 2) return StarIconSolid;
    return StarIcon;
  };

  const currentTier = tierData?.currentTier || 1;
  const rewards = calculateRewards();
  const TierIcon = getTierIcon(currentTier);

  if (!address) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Daily Login Bonus
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to claim daily rewards
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Reward Animation */}
      <AnimatePresence>
        {showRewardAnimation && lastReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm z-10 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: 2 }}
              >
                <GiftIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Reward Claimed!
              </h3>
              <p className="text-yellow-200">
                +{lastReward.totalXP} XP • +{lastReward.tokens} Tokens
              </p>
              {lastReward.milestone && (
                <Badge className="mt-2 bg-yellow-500 text-yellow-900">
                  {lastReward.milestone}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
            <GiftIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Login Bonus
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Claim your daily rewards
            </p>
          </div>
        </div>
        
        {/* Tier Badge */}
        <div className="flex items-center space-x-2">
          <TierIcon className={`w-5 h-5 ${getTierColor(currentTier)}`} />
          <span className={`text-sm font-medium ${getTierColor(currentTier)}`}>
            Tier {currentTier}
          </span>
        </div>
      </div>

      {/* Streak Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Login Streak
          </span>
          <span className="text-lg font-bold text-orange-500">
            {loginData.streak} days
          </span>
        </div>
        
        {/* Streak Progress */}
        <div className="flex space-x-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < (loginData.streak % 7) 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        {/* Next milestone */}
        {loginData.streak > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {Object.keys(STREAK_MILESTONES).find(m => m > loginData.streak) 
              ? `${Object.keys(STREAK_MILESTONES).find(m => m > loginData.streak) - loginData.streak} days to next milestone`
              : 'Maximum streak achieved!'
            }
          </p>
        )}
      </div>

      {/* Rewards Preview */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Today's Rewards
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-500">
              +{rewards.xp} XP
            </div>
            <div className="text-xs text-gray-500">Base Reward</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">
              +{rewards.tokens}
            </div>
            <div className="text-xs text-gray-500">Bonus Tokens</div>
          </div>
        </div>
        
        {rewards.bonusXP > 0 && (
          <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                Milestone Bonus: +{rewards.bonusXP} XP
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                {rewards.milestone}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claim Button */}
      <div className="space-y-3">
        {loginData.canClaim ? (
          <Button
            onClick={handleClaimDaily}
            disabled={claiming || tierLoading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-3"
          >
            {claiming ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Claiming...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <GiftIcon className="w-5 h-5" />
                <span>Claim Daily Bonus</span>
              </div>
            )}
          </Button>
        ) : (
          <div className="text-center">
            <Button disabled className="w-full mb-2">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Already Claimed Today
            </Button>
            {timeUntilNext && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Next claim in: {timeUntilNext}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total Claims: {loginData.totalClaimed}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Best Streak: {Math.max(loginData.streak, 0)}
          </span>
        </div>
      </div>
    </Card>
  );
}
