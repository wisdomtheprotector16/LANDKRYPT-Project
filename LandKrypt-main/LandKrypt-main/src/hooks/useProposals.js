// React Hooks for Proposal and NFT Ownership Management
import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Hook for creating and managing proposals
export function useProposals() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new proposal
  const createProposal = useCallback(async ({
    nftId,
    title,
    description,
    ownershipPercentage,
    timeframe,
    votingDeadline,
    proposalContract,
    txHash,
    metadata = {}
  }) => {
    if (!address) throw new Error('Wallet not connected');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId,
          title,
          description,
          creatorAddress: address,
          ownershipPercentage,
          timeframe,
          votingDeadline,
          proposalContract,
          txHash,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }

      const result = await response.json();
      return result.proposal;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Update proposal status
  const updateProposalStatus = useCallback(async (proposalId, status, metadata = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId,
          status,
          metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update proposal');
      }

      const result = await response.json();
      return result.proposal;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update proposal vote counts
  const updateProposalVotes = useCallback(async (proposalId, yesVotes, noVotes, totalVotes) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proposals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId,
          yesVotes,
          noVotes,
          totalVotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update proposal votes');
      }

      const result = await response.json();
      return result.proposal;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createProposal,
    updateProposalStatus,
    updateProposalVotes,
    isLoading,
    error
  };
}

// Hook to fetch proposals
export function useProposalsList(status = null, nftId = null) {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (nftId) params.append('nftId', nftId.toString());

      const response = await fetch(`/api/proposals?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch proposals');
      }

      const result = await response.json();
      setProposals(result.proposals || []);
    } catch (err) {
      setError(err.message);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, nftId]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    refetch: fetchProposals
  };
}

// Hook for NFT ownership management
export function useNftOwnership() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Record NFT purchase by staking contract
  const recordNftPurchase = useCallback(async ({
    nftId,
    stakingContract,
    txHash,
    metadata = {}
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nft-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId,
          stakingContract,
          txHash,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record NFT purchase');
      }

      const result = await response.json();
      return result.ownership;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recordNftPurchase,
    isLoading,
    error
  };
}

// Hook to fetch NFTs ready for proposals
export function useNftsReadyForProposals() {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNfts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nft-ownership?readyForProposals=true');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch NFTs');
      }

      const result = await response.json();
      setNfts(result.nfts || []);
    } catch (err) {
      setError(err.message);
      setNfts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNfts();
  }, [fetchNfts]);

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchNfts
  };
}

// Hook to get NFT ownership details
export function useNftOwnershipDetails(nftId) {
  const [ownership, setOwnership] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOwnership = useCallback(async () => {
    if (!nftId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/nft-ownership?nftId=${nftId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch NFT ownership');
      }

      const result = await response.json();
      setOwnership(result.ownership);
    } catch (err) {
      setError(err.message);
      setOwnership(null);
    } finally {
      setIsLoading(false);
    }
  }, [nftId]);

  useEffect(() => {
    fetchOwnership();
  }, [fetchOwnership]);

  return {
    ownership,
    isLoading,
    error,
    refetch: fetchOwnership
  };
}

// Hook for development contract operations
export function useDevelopmentContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Record development contract minting and cleanup proposals
  const recordDevelopmentContractMint = useCallback(async ({
    nftId,
    developmentContract,
    txHash,
    metadata = {}
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/development-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId,
          developmentContract,
          txHash,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record development contract mint');
      }

      const result = await response.json();
      return result.result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if NFT has development contract
  const checkDevelopmentContractStatus = useCallback(async (nftId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/development-contract?nftId=${nftId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check development contract status');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recordDevelopmentContractMint,
    checkDevelopmentContractStatus,
    isLoading,
    error
  };
}
