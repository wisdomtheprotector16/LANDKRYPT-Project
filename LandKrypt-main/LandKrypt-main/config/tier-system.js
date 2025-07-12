// LandKrypt Tier System Configuration
// Comprehensive tier-based rewards and privileges system

const TIER_SYSTEM = {
  // Tier definitions with requirements and benefits
  tiers: {
    1: {
      name: "Explorer",
      description: "New to the LandKrypt ecosystem",
      color: "#6B7280", // Gray
      icon: "🌱",
      requirements: {
        xp: 0,
        nftsOwned: 0,
        stakingAmount: 0,
        daysActive: 0
      },
      benefits: {
        stakingMultiplier: 1.0,
        marketplaceFeeDiscount: 0,
        earlyAccess: false,
        exclusiveNFTs: false,
        votingPower: 1,
        maxNFTsPerTransaction: 1,
        prioritySupport: false,
        customProfile: false
      },
      rewards: {
        dailyXP: 10,
        loginBonus: 5,
        dailyTokens: 5,
        streakMultiplier: 1.0,
        firstNFTBonus: 100,
        referralBonus: 50
      }
    },
    2: {
      name: "Settler",
      description: "Getting familiar with real estate NFTs",
      color: "#10B981", // Green
      icon: "🏠",
      requirements: {
        xp: 500,
        nftsOwned: 1,
        stakingAmount: 1000,
        daysActive: 7
      },
      benefits: {
        stakingMultiplier: 1.1,
        marketplaceFeeDiscount: 5,
        earlyAccess: false,
        exclusiveNFTs: false,
        votingPower: 1.2,
        maxNFTsPerTransaction: 3,
        prioritySupport: false,
        customProfile: true
      },
      rewards: {
        dailyXP: 15,
        loginBonus: 8,
        dailyTokens: 8,
        streakMultiplier: 1.2,
        nftMintBonus: 25,
        stakingBonus: 10,
        referralBonus: 75
      }
    },
    3: {
      name: "Investor",
      description: "Active participant in the ecosystem",
      color: "#3B82F6", // Blue
      icon: "💼",
      requirements: {
        xp: 2000,
        nftsOwned: 3,
        stakingAmount: 5000,
        daysActive: 30
      },
      benefits: {
        stakingMultiplier: 1.25,
        marketplaceFeeDiscount: 10,
        earlyAccess: true,
        exclusiveNFTs: false,
        votingPower: 1.5,
        maxNFTsPerTransaction: 5,
        prioritySupport: true,
        customProfile: true
      },
      rewards: {
        dailyXP: 25,
        loginBonus: 12,
        dailyTokens: 12,
        streakMultiplier: 1.4,
        nftMintBonus: 50,
        stakingBonus: 25,
        tradingBonus: 15,
        referralBonus: 100
      }
    },
    4: {
      name: "Developer",
      description: "Serious real estate portfolio builder",
      color: "#8B5CF6", // Purple
      icon: "🏗️",
      requirements: {
        xp: 5000,
        nftsOwned: 10,
        stakingAmount: 25000,
        daysActive: 90
      },
      benefits: {
        stakingMultiplier: 1.5,
        marketplaceFeeDiscount: 20,
        earlyAccess: true,
        exclusiveNFTs: true,
        votingPower: 2.0,
        maxNFTsPerTransaction: 10,
        prioritySupport: true,
        customProfile: true
      },
      rewards: {
        dailyXP: 40,
        loginBonus: 20,
        dailyTokens: 18,
        streakMultiplier: 1.6,
        nftMintBonus: 100,
        stakingBonus: 50,
        tradingBonus: 30,
        developmentBonus: 75,
        referralBonus: 150
      }
    },
    5: {
      name: "Mogul",
      description: "Elite real estate magnate",
      color: "#F59E0B", // Amber
      icon: "👑",
      requirements: {
        xp: 15000,
        nftsOwned: 25,
        stakingAmount: 100000,
        daysActive: 180
      },
      benefits: {
        stakingMultiplier: 2.0,
        marketplaceFeeDiscount: 35,
        earlyAccess: true,
        exclusiveNFTs: true,
        votingPower: 3.0,
        maxNFTsPerTransaction: 20,
        prioritySupport: true,
        customProfile: true
      },
      rewards: {
        dailyXP: 60,
        loginBonus: 30,
        dailyTokens: 25,
        streakMultiplier: 2.0,
        nftMintBonus: 200,
        stakingBonus: 100,
        tradingBonus: 60,
        developmentBonus: 150,
        exclusiveDrops: true,
        referralBonus: 250
      }
    },
    6: {
      name: "Legend",
      description: "Legendary status in the LandKrypt ecosystem",
      color: "#EF4444", // Red
      icon: "🌟",
      requirements: {
        xp: 50000,
        nftsOwned: 50,
        stakingAmount: 500000,
        daysActive: 365
      },
      benefits: {
        stakingMultiplier: 3.0,
        marketplaceFeeDiscount: 50,
        earlyAccess: true,
        exclusiveNFTs: true,
        votingPower: 5.0,
        maxNFTsPerTransaction: 50,
        prioritySupport: true,
        customProfile: true
      },
      rewards: {
        dailyXP: 100,
        loginBonus: 50,
        nftMintBonus: 500,
        stakingBonus: 250,
        tradingBonus: 150,
        developmentBonus: 300,
        exclusiveDrops: true,
        legendaryPerks: true,
        referralBonus: 500
      }
    }
  },

  // XP earning activities (Enhanced for upgraded contracts)
  xpActivities: {
    dailyLogin: {
      name: "Daily Login",
      baseXP: 10,
      maxPerDay: 1,
      description: "Log in to the platform daily",
      contractEvent: null
    },
    nftMint: {
      name: "NFT Minting",
      baseXP: 100,
      maxPerDay: 5,
      description: "Mint new NFTs",
      contractEvent: "PropertyMinted"
    },
    batchMint: {
      name: "Batch NFT Minting",
      baseXP: 200,
      maxPerDay: 3,
      description: "Use batch minting for efficiency",
      contractEvent: "BatchMinted"
    },
    nftPurchase: {
      name: "NFT Purchase",
      baseXP: 75,
      maxPerDay: 10,
      description: "Purchase NFTs from marketplace",
      contractEvent: "ListingSold"
    },
    nftSale: {
      name: "NFT Sale",
      baseXP: 50,
      maxPerDay: 10,
      description: "Successfully sell NFTs",
      contractEvent: "ListingSold"
    },
    dutchAuction: {
      name: "Dutch Auction Creation",
      baseXP: 125,
      maxPerDay: 5,
      description: "Create Dutch auctions",
      contractEvent: "AuctionCreated"
    },
    englishAuction: {
      name: "English Auction Participation",
      baseXP: 100,
      maxPerDay: 10,
      description: "Participate in English auctions",
      contractEvent: "BidPlaced"
    },
    makeOffer: {
      name: "Make Offer",
      baseXP: 40,
      maxPerDay: 15,
      description: "Make offers on NFTs",
      contractEvent: "OfferMade"
    },
    acceptOffer: {
      name: "Accept Offer",
      baseXP: 60,
      maxPerDay: 10,
      description: "Accept offers on your NFTs",
      contractEvent: "OfferAccepted"
    },
    stakingDeposit: {
      name: "Token Staking",
      baseXP: 25,
      maxPerDay: 3,
      description: "Stake tokens in pools",
      contractEvent: "Deposit"
    },
    nftStaking: {
      name: "NFT Staking",
      baseXP: 75,
      maxPerDay: 5,
      description: "Stake NFTs for rewards",
      contractEvent: "NFTStaked"
    },
    boosterActivation: {
      name: "Booster Activation",
      baseXP: 50,
      maxPerDay: 2,
      description: "Activate staking boosters",
      contractEvent: "BoosterActivated"
    },
    daoVoting: {
      name: "DAO Participation",
      baseXP: 30,
      maxPerDay: 5,
      description: "Vote on DAO proposals",
      contractEvent: "VoteCast"
    },
    quadraticVoting: {
      name: "Quadratic Voting",
      baseXP: 50,
      maxPerDay: 5,
      description: "Participate in quadratic voting",
      contractEvent: "VoteCast"
    },
    voteDelegation: {
      name: "Vote Delegation",
      baseXP: 35,
      maxPerDay: 2,
      description: "Delegate voting power",
      contractEvent: "DelegateChanged"
    },
    proposalCreation: {
      name: "Proposal Creation",
      baseXP: 150,
      maxPerDay: 2,
      description: "Create governance proposals",
      contractEvent: "ProposalCreated"
    },
    referralSuccess: {
      name: "Successful Referral",
      baseXP: 200,
      maxPerDay: 3,
      description: "Refer new users who complete onboarding",
      contractEvent: null
    },
    profileCompletion: {
      name: "Profile Completion",
      baseXP: 150,
      maxPerDay: 1,
      description: "Complete profile information",
      contractEvent: null
    },
    socialSharing: {
      name: "Social Media Sharing",
      baseXP: 15,
      maxPerDay: 3,
      description: "Share LandKrypt content on social media",
      contractEvent: null
    },
    feedbackSubmission: {
      name: "Feedback Submission",
      baseXP: 25,
      maxPerDay: 1,
      description: "Submit valuable feedback or bug reports",
      contractEvent: null
    },
    gasOptimization: {
      name: "Gas Optimization",
      baseXP: 20,
      maxPerDay: 10,
      description: "Use gas-optimized features",
      contractEvent: null
    }
  },

  // Tier progression milestones (Enhanced for upgraded contracts)
  milestones: {
    firstNFT: {
      name: "First NFT Owner",
      description: "Own your first NFT",
      xpReward: 100,
      badge: "🎯",
      contractEvent: "PropertyMinted"
    },
    portfolioBuilder: {
      name: "Portfolio Builder",
      description: "Own 5 NFTs",
      xpReward: 250,
      badge: "📈",
      contractEvent: null
    },
    batchMinter: {
      name: "Batch Minter",
      description: "Use batch minting feature",
      xpReward: 200,
      badge: "⚡",
      contractEvent: "BatchMinted"
    },
    auctioneer: {
      name: "Auctioneer",
      description: "Create your first auction",
      xpReward: 150,
      badge: "🔨",
      contractEvent: "AuctionCreated"
    },
    bidder: {
      name: "Active Bidder",
      description: "Place 10 auction bids",
      xpReward: 200,
      badge: "💰",
      contractEvent: "BidPlaced"
    },
    offerMaker: {
      name: "Offer Maker",
      description: "Make 5 successful offers",
      xpReward: 175,
      badge: "🤝",
      contractEvent: "OfferMade"
    },
    stakingChampion: {
      name: "Staking Champion",
      description: "Stake for 30 consecutive days",
      xpReward: 500,
      badge: "⚡",
      contractEvent: "Deposit"
    },
    nftStaker: {
      name: "NFT Staker",
      description: "Stake your first NFT",
      xpReward: 300,
      badge: "🔒",
      contractEvent: "NFTStaked"
    },
    boosterUser: {
      name: "Booster User",
      description: "Activate staking boosters",
      xpReward: 150,
      badge: "🚀",
      contractEvent: "BoosterActivated"
    },
    marketMaker: {
      name: "Market Maker",
      description: "Complete 10 marketplace transactions",
      xpReward: 300,
      badge: "🏪",
      contractEvent: "ListingSold"
    },
    governanceParticipant: {
      name: "Governance Participant",
      description: "Vote on 5 proposals",
      xpReward: 250,
      badge: "🗳️",
      contractEvent: "VoteCast"
    },
    proposalCreator: {
      name: "Proposal Creator",
      description: "Create your first proposal",
      xpReward: 400,
      badge: "📝",
      contractEvent: "ProposalCreated"
    },
    delegator: {
      name: "Vote Delegator",
      description: "Delegate voting power",
      xpReward: 100,
      badge: "🤲",
      contractEvent: "DelegateChanged"
    },
    gasOptimizer: {
      name: "Gas Optimizer",
      description: "Save 1000+ gas through optimizations",
      xpReward: 200,
      badge: "⛽",
      contractEvent: null
    },
    communityLeader: {
      name: "Community Leader",
      description: "Refer 5 successful users",
      xpReward: 750,
      badge: "👥",
      contractEvent: null
    },
    loyalMember: {
      name: "Loyal Member",
      description: "Active for 100 consecutive days",
      xpReward: 1000,
      badge: "🏆",
      contractEvent: null
    },
    quadraticVoter: {
      name: "Quadratic Voter",
      description: "Participate in quadratic voting",
      xpReward: 300,
      badge: "⚖️",
      contractEvent: "VoteCast"
    },
    royaltyEarner: {
      name: "Royalty Earner",
      description: "Earn royalties from NFT sales",
      xpReward: 250,
      badge: "💎",
      contractEvent: null
    }
  },

  // Special events and seasonal bonuses
  events: {
    weekendBonus: {
      name: "Weekend Warrior",
      description: "Double XP on weekends",
      multiplier: 2.0,
      active: true,
      schedule: "weekends"
    },
    monthlyChallenge: {
      name: "Monthly Challenge",
      description: "Special monthly objectives",
      bonusXP: 1000,
      active: true,
      schedule: "monthly"
    },
    seasonalEvent: {
      name: "Seasonal Event",
      description: "Limited-time seasonal bonuses",
      multiplier: 1.5,
      active: false,
      schedule: "seasonal"
    }
  },

  // Tier-specific privileges
  privileges: {
    earlyAccess: {
      name: "Early Access",
      description: "Get early access to new features and NFT drops",
      requiredTier: 3
    },
    exclusiveNFTs: {
      name: "Exclusive NFTs",
      description: "Access to tier-exclusive NFT collections",
      requiredTier: 4
    },
    prioritySupport: {
      name: "Priority Support",
      description: "Faster customer support response times",
      requiredTier: 3
    },
    customProfile: {
      name: "Custom Profile",
      description: "Customize profile with special themes and badges",
      requiredTier: 2
    },
    advancedAnalytics: {
      name: "Advanced Analytics",
      description: "Detailed portfolio and market analytics",
      requiredTier: 4
    },
    betaFeatures: {
      name: "Beta Features",
      description: "Test new features before public release",
      requiredTier: 5
    }
  }
};

// Utility functions for tier system
class TierSystemManager {
  static getTierByLevel(level) {
    return TIER_SYSTEM.tiers[level] || null;
  }

  static getTierByXP(xp) {
    const tiers = Object.entries(TIER_SYSTEM.tiers)
      .sort(([a], [b]) => parseInt(b) - parseInt(a)); // Sort descending
    
    for (const [level, tier] of tiers) {
      if (xp >= tier.requirements.xp) {
        return { level: parseInt(level), ...tier };
      }
    }
    
    return { level: 1, ...TIER_SYSTEM.tiers[1] };
  }

  static calculateXPToNextTier(currentXP) {
    const currentTier = this.getTierByXP(currentXP);
    const nextTierLevel = currentTier.level + 1;
    const nextTier = TIER_SYSTEM.tiers[nextTierLevel];
    
    if (!nextTier) {
      return { isMaxTier: true, xpNeeded: 0 };
    }
    
    return {
      isMaxTier: false,
      xpNeeded: nextTier.requirements.xp - currentXP,
      nextTier: { level: nextTierLevel, ...nextTier }
    };
  }

  static calculateTierProgress(currentXP) {
    const currentTier = this.getTierByXP(currentXP);
    const nextTierInfo = this.calculateXPToNextTier(currentXP);
    
    if (nextTierInfo.isMaxTier) {
      return { progress: 100, isMaxTier: true };
    }
    
    const currentTierXP = currentTier.requirements?.xp || 0;
    const nextTierXP = nextTierInfo.nextTier.requirements.xp;
    const progressXP = currentXP - currentTierXP;
    const totalXPNeeded = nextTierXP - currentTierXP;
    
    return {
      progress: Math.round((progressXP / totalXPNeeded) * 100),
      isMaxTier: false,
      currentTierXP,
      nextTierXP,
      progressXP,
      totalXPNeeded
    };
  }

  static getAvailableActivities(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    if (!tier) return [];
    
    return Object.entries(TIER_SYSTEM.xpActivities).map(([key, activity]) => ({
      key,
      ...activity,
      xpReward: Math.round(activity.baseXP * tier.benefits.stakingMultiplier)
    }));
  }

  static checkMilestoneEligibility(userStats) {
    const eligibleMilestones = [];
    
    Object.entries(TIER_SYSTEM.milestones).forEach(([key, milestone]) => {
      let isEligible = false;
      
      switch (key) {
        case 'firstNFT':
          isEligible = userStats.nftsOwned >= 1;
          break;
        case 'portfolioBuilder':
          isEligible = userStats.nftsOwned >= 5;
          break;
        case 'stakingChampion':
          isEligible = userStats.consecutiveStakingDays >= 30;
          break;
        case 'marketMaker':
          isEligible = userStats.marketplaceTransactions >= 10;
          break;
        case 'communityLeader':
          isEligible = userStats.successfulReferrals >= 5;
          break;
        case 'loyalMember':
          isEligible = userStats.consecutiveActiveDays >= 100;
          break;
      }
      
      if (isEligible) {
        eligibleMilestones.push({ key, ...milestone });
      }
    });
    
    return eligibleMilestones;
  }

  static calculateStakingMultiplier(tierLevel, baseMultiplier = 1.0) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    return tier ? baseMultiplier * tier.benefits.stakingMultiplier : baseMultiplier;
  }

  static calculateMarketplaceFee(tierLevel, baseFee) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    if (!tier) return baseFee;
    
    const discount = tier.benefits.marketplaceFeeDiscount / 100;
    return baseFee * (1 - discount);
  }

  static hasPrivilege(tierLevel, privilegeKey) {
    const privilege = TIER_SYSTEM.privileges[privilegeKey];
    return privilege ? tierLevel >= privilege.requiredTier : false;
  }

  static getTierBenefitsSummary(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    if (!tier) return null;

    return {
      tier: { level: tierLevel, ...tier },
      privileges: Object.entries(TIER_SYSTEM.privileges)
        .filter(([_, privilege]) => tierLevel >= privilege.requiredTier)
        .map(([key, privilege]) => ({ key, ...privilege })),
      activities: this.getAvailableActivities(tierLevel)
    };
  }

  // Enhanced methods for upgraded contracts
  static calculateMarketplaceFeeDiscount(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    return tier ? tier.benefits.marketplaceFeeDiscount : 0;
  }

  static getStakingMultiplier(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    return tier ? tier.benefits.stakingMultiplier : 1.0;
  }

  static getVotingPowerMultiplier(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    return tier ? tier.benefits.votingPower : 1.0;
  }

  static getMaxBatchSize(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    return tier ? tier.benefits.maxNFTsPerTransaction : 1;
  }

  static canAccessFeature(tierLevel, feature) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    if (!tier) return false;

    switch (feature) {
      case 'earlyAccess':
        return tier.benefits.earlyAccess;
      case 'exclusiveNFTs':
        return tier.benefits.exclusiveNFTs;
      case 'prioritySupport':
        return tier.benefits.prioritySupport;
      case 'customProfile':
        return tier.benefits.customProfile;
      case 'batchMinting':
        return tierLevel >= 2;
      case 'dutchAuctions':
        return tierLevel >= 3;
      case 'englishAuctions':
        return tierLevel >= 3;
      case 'nftStaking':
        return tierLevel >= 2;
      case 'boosters':
        return tierLevel >= 4;
      case 'quadraticVoting':
        return tierLevel >= 1; // Available to all
      case 'voteDelegation':
        return tierLevel >= 3;
      case 'proposalCreation':
        return tierLevel >= 4;
      default:
        return false;
    }
  }

  static getContractBenefits(tierLevel) {
    const tier = TIER_SYSTEM.tiers[tierLevel];
    if (!tier) return null;

    return {
      // Marketplace benefits
      marketplaceFeeDiscount: tier.benefits.marketplaceFeeDiscount,
      maxListingsPerDay: tier.benefits.maxNFTsPerTransaction * 2,
      canCreateAuctions: tierLevel >= 3,
      canMakeOffers: tierLevel >= 2,

      // Staking benefits
      stakingMultiplier: tier.benefits.stakingMultiplier,
      canStakeNFTs: tierLevel >= 2,
      canUseBoosters: tierLevel >= 4,
      maxStakingPools: Math.min(tierLevel * 2, 10),

      // Governance benefits
      votingPowerMultiplier: tier.benefits.votingPower,
      canDelegate: tierLevel >= 3,
      canCreateProposals: tierLevel >= 4,
      proposalThresholdReduction: Math.max(0, (tierLevel - 1) * 10), // % reduction

      // NFT benefits
      maxBatchMintSize: tier.benefits.maxNFTsPerTransaction,
      royaltyBonus: tierLevel >= 4 ? 0.5 : 0, // Additional 0.5% royalty
      canAccessExclusiveDrops: tier.benefits.exclusiveNFTs,

      // General benefits
      gasRefundPercentage: Math.min(tierLevel * 5, 25), // Up to 25% gas refund
      priorityProcessing: tier.benefits.prioritySupport,
      earlyFeatureAccess: tier.benefits.earlyAccess
    };
  }

  static calculateXPFromContractEvent(eventName, eventData, userTierLevel) {
    const activity = Object.values(TIER_SYSTEM.xpActivities)
      .find(act => act.contractEvent === eventName);

    if (!activity) return 0;

    const tier = TIER_SYSTEM.tiers[userTierLevel];
    const baseXP = activity.baseXP;
    const multiplier = tier ? tier.benefits.stakingMultiplier : 1.0;

    // Additional bonuses based on event data
    let bonus = 0;
    switch (eventName) {
      case 'BatchMinted':
        bonus = (eventData.tokenIds?.length || 1) * 10; // Bonus for batch size
        break;
      case 'AuctionCreated':
        bonus = eventData.auctionType === 'dutch' ? 25 : 50; // More for English auctions
        break;
      case 'BidPlaced':
        bonus = Math.min(eventData.bidAmount / 1000000000000000000, 50); // Bonus based on bid amount
        break;
      case 'VoteCast':
        bonus = eventData.isQuadratic ? 20 : 0; // Bonus for quadratic voting
        break;
      case 'BoosterActivated':
        bonus = eventData.boosterMultiplier * 10; // Bonus based on booster strength
        break;
    }

    return Math.round((baseXP + bonus) * multiplier);
  }

  static getMilestoneProgress(userStats) {
    const progress = {};

    Object.entries(TIER_SYSTEM.milestones).forEach(([key, milestone]) => {
      let current = 0;
      let target = 1;
      let completed = false;

      switch (key) {
        case 'firstNFT':
          current = userStats.nftsOwned;
          target = 1;
          completed = current >= target;
          break;
        case 'portfolioBuilder':
          current = userStats.nftsOwned;
          target = 5;
          completed = current >= target;
          break;
        case 'batchMinter':
          current = userStats.batchMints || 0;
          target = 1;
          completed = current >= target;
          break;
        case 'auctioneer':
          current = userStats.auctionsCreated || 0;
          target = 1;
          completed = current >= target;
          break;
        case 'bidder':
          current = userStats.bidsPlaced || 0;
          target = 10;
          completed = current >= target;
          break;
        case 'stakingChampion':
          current = userStats.consecutiveStakingDays || 0;
          target = 30;
          completed = current >= target;
          break;
        case 'marketMaker':
          current = userStats.marketplaceTransactions || 0;
          target = 10;
          completed = current >= target;
          break;
        case 'governanceParticipant':
          current = userStats.proposalsVoted || 0;
          target = 5;
          completed = current >= target;
          break;
        case 'gasOptimizer':
          current = userStats.gasSaved || 0;
          target = 1000;
          completed = current >= target;
          break;
      }

      progress[key] = {
        ...milestone,
        current,
        target,
        completed,
        progress: Math.min((current / target) * 100, 100)
      };
    });

    return progress;
  }
}

module.exports = {
  TIER_SYSTEM,
  TierSystemManager
};
