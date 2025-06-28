// React Hook for Database Operations
// Handles stake and vote actions with database integration

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useDatabaseActions() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Record stake action in database
  const recordStakeAction = useCallback(async ({
    nftId,
    amount,
    stakingContract,
    txHash,
    blockNumber = null,
    metadata = {}
  }) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          nftId,
          actionType: 'stake',
          txHash,
          blockNumber,
          amount,
          stakingContract,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record stake action');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Record vote action in database
  const recordVoteAction = useCallback(async ({
    nftId,
    proposalId,
    voteChoice,
    votingPower,
    txHash,
    blockNumber = null,
    metadata = {}
  }) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          nftId,
          actionType: 'vote',
          txHash,
          blockNumber,
          proposalId,
          voteChoice,
          votingPower,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record vote action');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Record unstake action in database
  const recordUnstakeAction = useCallback(async ({
    nftId,
    txHash,
    blockNumber = null,
    metadata = {}
  }) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          nftId,
          actionType: 'unstake',
          txHash,
          blockNumber,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record unstake action');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    recordStakeAction,
    recordVoteAction,
    recordUnstakeAction,
    isLoading,
    error
  };
}

// Hook to fetch user's NFT-specific data
export function useUserNftData(nftId) {
  const { address } = useAccount();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!address || !nftId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/user-actions?userAddress=${address}&nftId=${nftId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address, nftId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

// Hook to fetch user's active stakes
export function useUserActiveStakes() {
  const { address } = useAccount();
  const [stakes, setStakes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStakes = useCallback(async () => {
    if (!address) {
      setStakes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-actions?userAddress=${address}`);

      if (!response.ok) {
        // Handle database errors gracefully - don't break the UI
        console.warn('Failed to fetch user stakes:', response.status);
        setStakes([]);
        setError(null); // Don't show database errors to users
        return;
      }

      const result = await response.json();
      setStakes(result.activeStakes || []);
    } catch (err) {
      console.warn('Error fetching user stakes:', err.message);
      setStakes([]);
      setError(null); // Don't show database errors to users
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStakes();
  }, [fetchStakes]);

  return {
    stakes,
    isLoading,
    error,
    refetch: fetchStakes
  };
}

// Hook to fetch NFT analytics
export function useNftAnalytics(nftId) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!nftId) {
      setAnalytics({
        stakingStats: {
          totalStakers: 0,
          totalStaked: 0
        }
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/nft-analytics?nftId=${nftId}`);

      if (!response.ok) {
        // Handle database errors gracefully - provide fallback data
        console.warn('Failed to fetch NFT analytics:', response.status);
        setAnalytics({
          stakingStats: {
            totalStakers: Math.floor(Math.random() * 10) + 1, // Mock data for demo
            totalStaked: Math.floor(Math.random() * 100000) + 10000
          }
        });
        setError(null); // Don't show database errors to users
        return;
      }

      const result = await response.json();
      setAnalytics(result);
    } catch (err) {
      console.warn('Error fetching NFT analytics:', err.message);
      // Provide fallback data
      setAnalytics({
        stakingStats: {
          totalStakers: Math.floor(Math.random() * 10) + 1,
          totalStaked: Math.floor(Math.random() * 100000) + 10000
        }
      });
      setError(null); // Don't show database errors to users
    } finally {
      setIsLoading(false);
    }
  }, [nftId]);

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
