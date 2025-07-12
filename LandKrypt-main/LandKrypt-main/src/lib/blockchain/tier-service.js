// Tier System Integration Service
// Manages user tier progression, XP tracking, and reward distribution

const { TierSystemManager } = require('../../../config/tier-system');
const supabaseConnection = require('../database/supabase-enhanced');

class TierService {
  constructor() {
    this.tierManager = TierSystemManager;
  }

  // ====== USER TIER MANAGEMENT ======

  async getUserTierData(walletAddress) {
    try {
      // Get user tier progress from database
      const tierProgress = await supabaseConnection.getTierProgress(walletAddress);
      
      if (!tierProgress) {
        // Initialize new user with tier 1
        const newTierData = {
          wallet_address: walletAddress,
          total_xp: 0,
          current_tier: 1,
          tier_progress: 0,
          last_daily_xp_claim: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await supabaseConnection.updateTierProgress(
          walletAddress,
          newTierData.total_xp,
          newTierData.current_tier,
          newTierData.tier_progress
        );
        
        return this.enrichTierData(newTierData);
      }
      
      return this.enrichTierData(tierProgress);
    } catch (error) {
      console.error('Error getting user tier data:', error);
      throw error;
    }
  }

  enrichTierData(tierProgress) {
    const currentTier = this.tierManager.getTierByLevel(tierProgress.current_tier);
    const tierByXP = this.tierManager.getTierByXP(tierProgress.total_xp);
    const nextTierInfo = this.tierManager.calculateXPToNextTier(tierProgress.total_xp);
    const progressInfo = this.tierManager.calculateTierProgress(tierProgress.total_xp);
    
    return {
      ...tierProgress,
      currentTierInfo: currentTier,
      actualTierByXP: tierByXP,
      nextTier: nextTierInfo,
      progress: progressInfo,
      benefits: this.tierManager.getTierBenefitsSummary(tierProgress.current_tier)
    };
  }

  // ====== XP MANAGEMENT ======

  async awardXP(walletAddress, activityKey, amount = null, metadata = {}) {
    try {
      const userTierData = await this.getUserTierData(walletAddress);
      const activity = this.tierManager.getAvailableActivities(userTierData.current_tier)
        .find(a => a.key === activityKey);
      
      if (!activity) {
        throw new Error(`Invalid activity: ${activityKey}`);
      }
      
      // Check daily limits
      const today = new Date().toISOString().split('T')[0];
      const todayActions = await this.getTodayActions(walletAddress, activityKey, today);
      
      if (todayActions >= activity.maxPerDay) {
        return {
          success: false,
          reason: 'Daily limit reached',
          limit: activity.maxPerDay,
          current: todayActions
        };
      }
      
      // Calculate XP reward
      const xpReward = amount || activity.xpReward;
      const bonusMultiplier = this.calculateBonusMultiplier(activityKey);
      const finalXP = Math.round(xpReward * bonusMultiplier);
      
      // Update user XP
      const newTotalXP = userTierData.total_xp + finalXP;
      const newTierByXP = this.tierManager.getTierByXP(newTotalXP);
      
      // Check for tier upgrade
      let tierUpgraded = false;
      let newTier = userTierData.current_tier;
      
      if (newTierByXP.level > userTierData.current_tier) {
        newTier = newTierByXP.level;
        tierUpgraded = true;
      }
      
      // Update database
      await supabaseConnection.updateTierProgress(
        walletAddress,
        newTotalXP,
        newTier,
        this.tierManager.calculateTierProgress(newTotalXP).progress
      );
      
      // Record the action
      await supabaseConnection.recordUserAction(
        walletAddress,
        `xp_${activityKey}`,
        null,
        {
          activity: activityKey,
          xpAwarded: finalXP,
          bonusMultiplier,
          tierUpgraded,
          newTier,
          ...metadata
        }
      );
      
      // Check for milestone achievements
      const userStats = await this.getUserStats(walletAddress);
      const newMilestones = this.tierManager.checkMilestoneEligibility(userStats);
      
      return {
        success: true,
        xpAwarded: finalXP,
        bonusMultiplier,
        newTotalXP,
        tierUpgraded,
        newTier: tierUpgraded ? newTierByXP : null,
        milestones: newMilestones,
        activity: activity.name
      };
      
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  async getTodayActions(walletAddress, activityKey, date) {
    try {
      const { data } = await supabaseConnection.safeQuery('user_actions', {
        type: 'select',
        columns: 'count',
        filters: [
          { method: 'eq', args: ['user_address', walletAddress] },
          { method: 'eq', args: ['action_type', `xp_${activityKey}`] },
          { method: 'gte', args: ['timestamp', `${date}T00:00:00.000Z`] },
          { method: 'lt', args: ['timestamp', `${date}T23:59:59.999Z`] }
        ]
      });
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting today actions:', error);
      return 0;
    }
  }

  calculateBonusMultiplier(activityKey) {
    let multiplier = 1.0;
    
    // Weekend bonus
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend) {
      multiplier *= 1.5;
    }
    
    // Activity-specific bonuses
    const activityBonuses = {
      dailyLogin: 1.0,
      nftMint: 1.2,
      stakingDeposit: 1.3,
      daoVoting: 1.4,
      referralSuccess: 2.0
    };
    
    multiplier *= activityBonuses[activityKey] || 1.0;
    
    return multiplier;
  }

  // ====== USER STATISTICS ======

  async getUserStats(walletAddress) {
    try {
      // Get NFTs owned
      const { data: nfts } = await supabaseConnection.getNFTsByOwner(walletAddress);
      
      // Get user actions for statistics
      const { data: actions } = await supabaseConnection.getUserActions(walletAddress, 1000);
      
      // Calculate statistics
      const marketplaceTransactions = actions.filter(a => 
        a.action_type.includes('marketplace') || a.action_type.includes('trade')
      ).length;
      
      const successfulReferrals = actions.filter(a => 
        a.action_type === 'xp_referralSuccess'
      ).length;
      
      // Calculate consecutive days (simplified)
      const loginActions = actions.filter(a => a.action_type === 'xp_dailyLogin')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      let consecutiveActiveDays = 0;
      let currentDate = new Date();
      
      for (const action of loginActions) {
        const actionDate = new Date(action.timestamp);
        const daysDiff = Math.floor((currentDate - actionDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === consecutiveActiveDays) {
          consecutiveActiveDays++;
          currentDate = actionDate;
        } else {
          break;
        }
      }
      
      return {
        nftsOwned: nfts.length,
        marketplaceTransactions,
        successfulReferrals,
        consecutiveActiveDays,
        consecutiveStakingDays: 0, // TODO: Implement staking tracking
        totalActions: actions.length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        nftsOwned: 0,
        marketplaceTransactions: 0,
        successfulReferrals: 0,
        consecutiveActiveDays: 0,
        consecutiveStakingDays: 0,
        totalActions: 0
      };
    }
  }

  // ====== DAILY REWARDS ======

  async claimDailyReward(walletAddress) {
    try {
      const userTierData = await this.getUserTierData(walletAddress);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already claimed today
      if (userTierData.last_daily_xp_claim === today) {
        return {
          success: false,
          reason: 'Already claimed today',
          nextClaimTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }
      
      // Award daily login XP
      const result = await this.awardXP(walletAddress, 'dailyLogin');
      
      if (result.success) {
        // Update last claim date
        await supabaseConnection.safeQuery('user_tier_progress', {
          type: 'update',
          data: { last_daily_xp_claim: today },
          filters: [
            { method: 'eq', args: ['wallet_address', walletAddress] }
          ]
        });
      }
      
      return {
        ...result,
        dailyReward: true,
        nextClaimTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      throw error;
    }
  }

  // ====== TIER BENEFITS ======

  async applyTierBenefits(walletAddress, operation, baseValue) {
    try {
      const userTierData = await this.getUserTierData(walletAddress);
      const tier = userTierData.currentTierInfo;
      
      switch (operation) {
        case 'stakingMultiplier':
          return baseValue * tier.benefits.stakingMultiplier;
          
        case 'marketplaceFee':
          const discount = tier.benefits.marketplaceFeeDiscount / 100;
          return baseValue * (1 - discount);
          
        case 'votingPower':
          return baseValue * tier.benefits.votingPower;
          
        case 'maxNFTsPerTransaction':
          return Math.min(baseValue, tier.benefits.maxNFTsPerTransaction);
          
        default:
          return baseValue;
      }
    } catch (error) {
      console.error('Error applying tier benefits:', error);
      return baseValue;
    }
  }

  // ====== LEADERBOARD ======

  async getLeaderboard(limit = 100) {
    try {
      const { data } = await supabaseConnection.safeQuery('user_tier_progress', {
        type: 'select',
        columns: 'wallet_address, total_xp, current_tier',
        order: { column: 'total_xp', options: { ascending: false } },
        limit
      });
      
      return data.map((user, index) => ({
        rank: index + 1,
        walletAddress: user.wallet_address,
        totalXP: user.total_xp,
        currentTier: user.current_tier,
        tierInfo: this.tierManager.getTierByLevel(user.current_tier)
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // ====== TIER ANALYTICS ======

  async getTierAnalytics() {
    try {
      const { data } = await supabaseConnection.safeQuery('user_tier_progress', {
        type: 'select',
        columns: 'current_tier, total_xp'
      });
      
      const tierDistribution = {};
      let totalUsers = 0;
      let totalXP = 0;
      
      data.forEach(user => {
        tierDistribution[user.current_tier] = (tierDistribution[user.current_tier] || 0) + 1;
        totalUsers++;
        totalXP += user.total_xp;
      });
      
      return {
        totalUsers,
        averageXP: totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0,
        tierDistribution,
        topTier: Math.max(...Object.keys(tierDistribution).map(Number)),
        mostPopularTier: Object.entries(tierDistribution)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 1
      };
    } catch (error) {
      console.error('Error getting tier analytics:', error);
      return {
        totalUsers: 0,
        averageXP: 0,
        tierDistribution: {},
        topTier: 1,
        mostPopularTier: 1
      };
    }
  }
}

// Export singleton instance
const tierService = new TierService();
module.exports = tierService;
