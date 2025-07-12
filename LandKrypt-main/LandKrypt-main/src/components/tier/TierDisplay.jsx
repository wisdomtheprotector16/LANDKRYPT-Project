// Tier System Display Component
// Shows user's current tier, progress, and benefits

import React, { useState } from 'react';
import { 
  StarIcon, 
  TrophyIcon, 
  GiftIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

import { Card, ActionButton } from '../ui/ResponsiveCard';
import { useTierSystem } from '../../hooks/blockchain/useTierSystem';
import { useResponsive } from '../layout/ResponsiveLayout';

function TierBadge({ tier, size = 'default' }) {
  const { isMobile } = useResponsive();
  
  const sizes = {
    sm: isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm',
    default: isMobile ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-base',
    lg: isMobile ? 'w-16 h-16 text-base' : 'w-20 h-20 text-lg'
  };

  if (!tier) return null;

  return (
    <div 
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center font-bold text-white
        shadow-lg border-2 border-white
      `}
      style={{ backgroundColor: tier.color }}
    >
      <span className="text-center">
        {tier.icon}
      </span>
    </div>
  );
}

function ProgressBar({ progress, color = '#3B82F6', height = 8 }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ 
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color,
          height: `${height}px`
        }}
      />
    </div>
  );
}

function TierProgress({ tierData, loading }) {
  const { isMobile } = useResponsive();
  
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!tierData) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Connect your wallet to view tier progress
          </p>
        </div>
      </Card>
    );
  }

  const { currentTierInfo, nextTier, progress, total_xp } = tierData;

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`
            font-semibold text-gray-900 dark:text-white
            ${isMobile ? 'text-base' : 'text-lg'}
          `}>
            Your Tier Progress
          </h3>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {total_xp.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Current Tier */}
        <div className="flex items-center space-x-4">
          <TierBadge tier={currentTierInfo} size={isMobile ? 'default' : 'lg'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`
                font-bold text-gray-900 dark:text-white
                ${isMobile ? 'text-lg' : 'text-xl'}
              `}>
                {currentTierInfo?.name}
              </h4>
              <span className={`
                text-gray-500 dark:text-gray-400
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                Tier {tierData.current_tier}
              </span>
            </div>
            <p className={`
              text-gray-600 dark:text-gray-300
              ${isMobile ? 'text-sm' : 'text-base'}
            `}>
              {currentTierInfo?.description}
            </p>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {!nextTier?.isMaxTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`
                font-medium text-gray-700 dark:text-gray-300
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                Progress to {nextTier?.nextTier?.name}
              </span>
              <span className={`
                font-semibold text-gray-900 dark:text-white
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                {progress?.progress || 0}%
              </span>
            </div>
            
            <ProgressBar 
              progress={progress?.progress || 0} 
              color={nextTier?.nextTier?.color}
              height={isMobile ? 6 : 8}
            />
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{(progress?.progressXP || 0).toLocaleString()} XP</span>
              <span>{nextTier?.xpNeeded?.toLocaleString()} XP needed</span>
            </div>
          </div>
        )}

        {/* Max Tier Message */}
        {nextTier?.isMaxTier && (
          <div className="text-center py-4">
            <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white">
              Maximum Tier Reached!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've achieved the highest tier in LandKrypt
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function TierBenefits({ tierData, loading }) {
  const { isMobile } = useResponsive();
  
  if (loading || !tierData?.benefits) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const { currentTierInfo, benefits } = tierData;

  return (
    <Card>
      <div className="space-y-4">
        <h3 className={`
          font-semibold text-gray-900 dark:text-white
          ${isMobile ? 'text-base' : 'text-lg'}
        `}>
          Tier Benefits
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Staking Multiplier */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <StarIconSolid className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Staking Multiplier
              </span>
            </div>
            <span className="font-bold text-blue-600">
              {currentTierInfo?.benefits?.stakingMultiplier}x
            </span>
          </div>

          {/* Marketplace Fee Discount */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <GiftIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Fee Discount
              </span>
            </div>
            <span className="font-bold text-green-600">
              {currentTierInfo?.benefits?.marketplaceFeeDiscount}%
            </span>
          </div>

          {/* Voting Power */}
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrophyIcon className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Voting Power
              </span>
            </div>
            <span className="font-bold text-purple-600">
              {currentTierInfo?.benefits?.votingPower}x
            </span>
          </div>

          {/* Max NFTs per Transaction */}
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                Max NFTs/Transaction
              </span>
            </div>
            <span className="font-bold text-amber-600">
              {currentTierInfo?.benefits?.maxNFTsPerTransaction}
            </span>
          </div>
        </div>

        {/* Privileges */}
        {benefits?.privileges?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Special Privileges
            </h4>
            <div className="space-y-1">
              {benefits.privileges.map((privilege, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {privilege.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function DailyReward() {
  const { 
    canClaimDailyReward, 
    claimDailyReward, 
    getTimeUntilNextClaim,
    loading 
  } = useTierSystem();
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  const handleClaimReward = async () => {
    setClaiming(true);
    setMessage('');
    
    try {
      const result = await claimDailyReward();
      
      if (result.success) {
        setMessage(`🎉 Claimed ${result.xpAwarded} XP!`);
      } else {
        setMessage(result.reason || 'Failed to claim reward');
      }
    } catch (error) {
      setMessage('Error claiming reward');
    } finally {
      setClaiming(false);
    }
  };

  const timeUntilNext = getTimeUntilNextClaim();
  const hoursUntilNext = Math.ceil(timeUntilNext / (1000 * 60 * 60));

  if (loading) return null;

  return (
    <Card>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <GiftIcon className="h-8 w-8 text-blue-600" />
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Daily Reward
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Claim your daily XP bonus
          </p>
        </div>

        {canClaimDailyReward() ? (
          <ActionButton
            variant="primary"
            onClick={handleClaimReward}
            loading={claiming}
            disabled={claiming}
          >
            <GiftIcon className="h-4 w-4 mr-2" />
            Claim Reward
          </ActionButton>
        ) : (
          <div className="space-y-2">
            <ActionButton variant="secondary" disabled>
              <ClockIcon className="h-4 w-4 mr-2" />
              Already Claimed
            </ActionButton>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Next claim in {hoursUntilNext}h
            </p>
          </div>
        )}

        {message && (
          <p className={`
            text-sm font-medium
            ${message.includes('🎉') ? 'text-green-600' : 'text-red-600'}
          `}>
            {message}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function TierDisplay() {
  const { tierData, loading } = useTierSystem();
  const { isMobile } = useResponsive();

  return (
    <div className="space-y-6">
      {/* Tier Progress */}
      <TierProgress tierData={tierData} loading={loading} />

      {/* Benefits and Daily Reward */}
      <div className={`
        grid gap-6
        ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}
      `}>
        <TierBenefits tierData={tierData} loading={loading} />
        <DailyReward />
      </div>
    </div>
  );
}
