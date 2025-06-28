// Dashboard Hook for Database Integration
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { useContractReadData } from './useContractInteraction';
import { CONTRACT_ADDRESSES, LANDKRYPT_STAKING_TOKEN_ABI, LANDKRYPT_STABLECOIN_ABI } from '../contracts/abis';
import { isBrowser } from '../lib/ssr-polyfills';

// Hook for user dashboard data
export function useDashboardData() {
  const { address, isConnected } = useAccount();
  const [dashboardData, setDashboardData] = useState({
    userActions: [],
    stakedNfts: [],
    proposals: [],
    nftOwnership: [],
    analytics: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get token balances from contracts
  const { data: lkstBalance } = useContractReadData(
    CONTRACT_ADDRESSES.LANDKRYPT_STAKING_TOKEN,
    LANDKRYPT_STAKING_TOKEN_ABI,
    'balanceOf',
    [address]
  );

  const { data: lkusdBalance } = useContractReadData(
    CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
    LANDKRYPT_STABLECOIN_ABI,
    'balanceOf',
    [address]
  );

  // Get ETH balance
  const { data: ethBalance } = useBalance({ address });

  // Fetch user dashboard data from APIs
  const fetchDashboardData = useCallback(async () => {
    if (!address || !isConnected || !isBrowser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user actions
      const actionsResponse = await fetch(`/api/user-actions?userAddress=${address}`);
      const actionsData = actionsResponse.ok ? await actionsResponse.json() : { actions: [] };

      // Fetch user's staked NFTs
      const stakesResponse = await fetch(`/api/nft-analytics?userAddress=${address}`);
      const stakesData = stakesResponse.ok ? await stakesResponse.json() : { stakes: [] };

      // Fetch user's proposals
      const proposalsResponse = await fetch(`/api/proposals?creatorAddress=${address}`);
      const proposalsData = proposalsResponse.ok ? await proposalsResponse.json() : { proposals: [] };

      // Fetch NFT ownership data
      const ownershipResponse = await fetch(`/api/nft-ownership?userAddress=${address}`);
      const ownershipData = ownershipResponse.ok ? await ownershipResponse.json() : { nfts: [] };

      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/nft-analytics?userAddress=${address}&detailed=true`);
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : { analytics: null };

      setDashboardData({
        userActions: actionsData.actions || [],
        stakedNfts: stakesData.stakes || [],
        proposals: proposalsData.proposals || [],
        nftOwnership: ownershipData.nfts || [],
        analytics: analyticsData.analytics
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Computed dashboard statistics
  const dashboardStats = useMemo(() => {
    const { userActions, stakedNfts, proposals, analytics } = dashboardData;

    // Calculate total staked amount
    const totalStaked = stakedNfts.reduce((sum, stake) => {
      return sum + (parseFloat(stake.amount) || 0);
    }, 0);

    // Calculate total rewards
    const totalRewards = stakedNfts.reduce((sum, stake) => {
      return sum + (parseFloat(stake.rewards_earned) || 0);
    }, 0);

    // Get unique NFTs staked
    const uniqueNfts = new Set(stakedNfts.map(stake => stake.nft_id)).size;

    // Calculate monthly returns data for charts
    const monthlyReturns = userActions
      .filter(action => action.action_type === 'stake' || action.action_type === 'reward')
      .reduce((acc, action) => {
        const month = new Date(action.timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        const amount = parseFloat(action.amount) || 0;
        
        acc[month] = (acc[month] || 0) + amount;
        return acc;
      }, {});

    const returnsData = Object.entries(monthlyReturns)
      .map(([month, value]) => ({
        month: month.split(' ')[0],
        value: Math.round(value),
        date: month
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-9); // Last 9 months

    // Calculate APY (simplified calculation)
    const apy = totalStaked > 0 ? ((totalRewards / totalStaked) * 100).toFixed(2) : '0.00';

    // Recent activity
    const recentActivity = userActions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(action => ({
        ...action,
        formattedDate: new Date(action.timestamp).toLocaleDateString(),
        formattedAmount: parseFloat(action.amount || 0).toLocaleString()
      }));

    return {
      balances: {
        lkst: lkstBalance ? parseFloat(formatEther(lkstBalance)).toFixed(2) : '0.00',
        lkusd: lkusdBalance ? parseFloat(formatEther(lkusdBalance)).toFixed(2) : '0.00',
        eth: ethBalance ? parseFloat(ethBalance.formatted).toFixed(4) : '0.0000'
      },
      staking: {
        totalStaked: totalStaked.toLocaleString(),
        totalRewards: totalRewards.toFixed(2),
        uniqueNfts,
        apy
      },
      proposals: {
        total: proposals.length,
        active: proposals.filter(p => p.status === 'active').length,
        completed: proposals.filter(p => p.status === 'completed').length
      },
      activity: {
        totalActions: userActions.length,
        recentActivity,
        returnsData
      }
    };
  }, [dashboardData, lkstBalance, lkusdBalance, ethBalance]);

  // Auto-fetch data when address changes
  useEffect(() => {
    if (address && isConnected) {
      fetchDashboardData();
    }
  }, [address, isConnected, fetchDashboardData]);

  return {
    dashboardData,
    dashboardStats,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}

// Hook for portfolio analytics
export function usePortfolioAnalytics(userAddress) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/nft-analytics?userAddress=${userAddress}&portfolio=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio analytics');
      }

      const data = await response.json();
      setAnalytics(data.portfolio);

    } catch (err) {
      console.error('Error fetching portfolio analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
}

// Hook for staking performance
export function useStakingPerformance(userAddress) {
  const [performance, setPerformance] = useState({
    dailyRewards: [],
    totalEarned: 0,
    bestPerformingNft: null,
    stakingTrend: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPerformance = useCallback(async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-actions?userAddress=${userAddress}&actionType=stake&detailed=true`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Process staking performance data
        const stakingActions = data.actions || [];
        
        // Calculate daily rewards (mock calculation for demo)
        const dailyRewards = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            rewards: Math.random() * 50 + 10 // Mock daily rewards
          };
        }).reverse();

        // Calculate total earned
        const totalEarned = stakingActions
          .filter(action => action.metadata?.type === 'reward')
          .reduce((sum, action) => sum + (parseFloat(action.amount) || 0), 0);

        setPerformance({
          dailyRewards,
          totalEarned,
          bestPerformingNft: stakingActions[0] || null,
          stakingTrend: dailyRewards.slice(-7) // Last 7 days
        });
      }

    } catch (err) {
      console.error('Error fetching staking performance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    isLoading,
    error,
    refetch: fetchPerformance
  };
}

export default useDashboardData;
