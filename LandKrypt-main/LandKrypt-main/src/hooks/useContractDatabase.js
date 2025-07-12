// Contract-Database Integration Hook
// Handles real-time contract interactions and database synchronization

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { useMockData } from './useMockData';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export function useContractDatabase() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const {
    userNFTs,
    stakingData: mockStakingData,
    marketplaceListings: mockMarketplaceListings,
    mockContractInteraction,
    isLoading: mockLoading,
    refreshData
  } = useMockData();

  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [userActions, setUserActions] = useState([]);
  const [nftOwnership, setNftOwnership] = useState([]);
  const [stakingData, setStakingData] = useState([]);
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [governanceVotes, setGovernanceVotes] = useState([]);

  // Enhanced state with mock data integration
  const [nftBalance, setNftBalance] = useState(0);
  const [stakingBalance, setStakingBalance] = useState('0');
  const [totalEarnings, setTotalEarnings] = useState('0');

  // Store contract interaction in database
  const storeContractInteraction = useCallback(async (interactionData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/contract-interactions/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Transaction recorded successfully');
        // Refresh relevant data
        await refreshUserData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to store interaction');
      }
    } catch (error) {
      console.error('Error storing contract interaction:', error);
      toast.error('Failed to record transaction');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle NFT minting
  const handleNFTMint = useCallback(async (txHash, tokenId, to, metadataURI) => {
    const interactionData = {
      table: 'nft_ownership',
      action: 'INSERT',
      data: {
        user_address: to,
        nft_id: parseInt(tokenId),
        contract_address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
        previous_owner: null,
        tx_hash: txHash,
        action_type: 'MINT',
        timestamp: new Date().toISOString(),
        metadata: {
          token_uri: metadataURI,
          minted_by: address
        }
      }
    };

    await storeContractInteraction(interactionData);

    // Also record in user_actions
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: to,
        nft_id: parseInt(tokenId),
        action_type: 'MINT',
        tx_hash: txHash,
        timestamp: new Date().toISOString(),
        metadata: {
          token_uri: metadataURI
        }
      }
    };

    await storeContractInteraction(actionData);
  }, [address, storeContractInteraction]);

  // Handle NFT transfer
  const handleNFTTransfer = useCallback(async (txHash, tokenId, from, to) => {
    const interactionData = {
      table: 'nft_ownership',
      action: 'UPDATE',
      data: {
        user_address: to,
        previous_owner: from,
        tx_hash: txHash,
        action_type: 'TRANSFER',
        timestamp: new Date().toISOString()
      },
      where: {
        nft_id: parseInt(tokenId),
        user_address: from
      }
    };

    await storeContractInteraction(interactionData);

    // Record transfer action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: to,
        nft_id: parseInt(tokenId),
        action_type: 'TRANSFER',
        tx_hash: txHash,
        timestamp: new Date().toISOString(),
        metadata: {
          from_address: from,
          to_address: to
        }
      }
    };

    await storeContractInteraction(actionData);
  }, [storeContractInteraction]);

  // Handle NFT staking
  const handleNFTStaking = useCallback(async (txHash, tokenId, stakingPower) => {
    const interactionData = {
      table: 'nft_stakes',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: parseInt(tokenId),
        staking_contract: process.env.NEXT_PUBLIC_ADVANCED_STAKING,
        amount: stakingPower.toString(),
        tx_hash: txHash,
        is_active: true,
        start_timestamp: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(interactionData);

    // Record staking action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: parseInt(tokenId),
        action_type: 'STAKE',
        tx_hash: txHash,
        amount: stakingPower.toString(),
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(actionData);
  }, [address, storeContractInteraction]);

  // Handle NFT unstaking
  const handleNFTUnstaking = useCallback(async (txHash, tokenId, rewards) => {
    const interactionData = {
      table: 'nft_stakes',
      action: 'UPDATE',
      data: {
        is_active: false,
        end_timestamp: new Date().toISOString(),
        rewards_earned: rewards.toString(),
        unstake_tx_hash: txHash
      },
      where: {
        user_address: address,
        nft_id: parseInt(tokenId),
        is_active: true
      }
    };

    await storeContractInteraction(interactionData);

    // Record unstaking action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: parseInt(tokenId),
        action_type: 'UNSTAKE',
        tx_hash: txHash,
        amount: rewards.toString(),
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(actionData);
  }, [address, storeContractInteraction]);

  // Handle marketplace listing
  const handleMarketplaceListing = useCallback(async (txHash, tokenId, price) => {
    const interactionData = {
      table: 'marketplace_listings',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: parseInt(tokenId),
        contract_address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
        price: price.toString(),
        tx_hash: txHash,
        is_active: true,
        action_type: 'LIST',
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(interactionData);

    // Record listing action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: parseInt(tokenId),
        action_type: 'LIST',
        tx_hash: txHash,
        amount: price.toString(),
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(actionData);
  }, [address, storeContractInteraction]);

  // Handle marketplace purchase
  const handleMarketplacePurchase = useCallback(async (txHash, tokenId, seller, buyer, price) => {
    // Update listing as sold
    const listingUpdate = {
      table: 'marketplace_listings',
      action: 'UPDATE',
      data: {
        is_active: false,
        buyer_address: buyer,
        sold_price: price.toString(),
        sold_tx_hash: txHash,
        sold_timestamp: new Date().toISOString()
      },
      where: {
        nft_id: parseInt(tokenId),
        user_address: seller,
        is_active: true
      }
    };

    await storeContractInteraction(listingUpdate);

    // Record purchase action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: buyer,
        nft_id: parseInt(tokenId),
        action_type: 'PURCHASE',
        tx_hash: txHash,
        amount: price.toString(),
        timestamp: new Date().toISOString(),
        metadata: {
          seller_address: seller
        }
      }
    };

    await storeContractInteraction(actionData);
  }, [storeContractInteraction]);

  // Handle governance voting
  const handleGovernanceVote = useCallback(async (txHash, proposalId, support, votingPower) => {
    const interactionData = {
      table: 'nft_votes',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: 0, // Will be updated based on voting power source
        proposal_id: proposalId.toString(),
        vote_choice: support,
        voting_power: votingPower.toString(),
        tx_hash: txHash,
        timestamp: new Date().toISOString()
      }
    };

    await storeContractInteraction(interactionData);

    // Record voting action
    const actionData = {
      table: 'user_actions',
      action: 'INSERT',
      data: {
        user_address: address,
        nft_id: 0,
        action_type: 'VOTE',
        tx_hash: txHash,
        timestamp: new Date().toISOString(),
        metadata: {
          proposal_id: proposalId.toString(),
          vote_choice: support,
          voting_power: votingPower.toString()
        }
      }
    };

    await storeContractInteraction(actionData);
  }, [address, storeContractInteraction]);

  // Fetch user data from database
  const refreshUserData = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Fetch user actions
      const { data: actions } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_address', address)
        .order('timestamp', { ascending: false })
        .limit(50);

      setUserActions(actions || []);

      // Fetch NFT ownership
      const { data: ownership } = await supabase
        .from('nft_ownership')
        .select('*')
        .eq('user_address', address)
        .order('timestamp', { ascending: false });

      setNftOwnership(ownership || []);

      // Fetch staking data
      const { data: staking } = await supabase
        .from('nft_stakes')
        .select('*')
        .eq('user_address', address)
        .order('start_timestamp', { ascending: false });

      setStakingData(staking || []);

      // Fetch marketplace listings
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('user_address', address)
        .order('timestamp', { ascending: false });

      setMarketplaceListings(listings || []);

      // Fetch governance votes
      const { data: votes } = await supabase
        .from('nft_votes')
        .select('*')
        .eq('user_address', address)
        .order('timestamp', { ascending: false });

      setGovernanceVotes(votes || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!address) return;

    // Subscribe to user actions
    const actionsSubscription = supabase
      .channel('user_actions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_actions',
          filter: `user_address=eq.${address}`
        }, 
        (payload) => {
          console.log('User action change:', payload);
          refreshUserData();
        }
      )
      .subscribe();

    // Subscribe to NFT ownership changes
    const ownershipSubscription = supabase
      .channel('nft_ownership_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'nft_ownership',
          filter: `user_address=eq.${address}`
        }, 
        (payload) => {
          console.log('NFT ownership change:', payload);
          refreshUserData();
        }
      )
      .subscribe();

    // Subscribe to staking changes
    const stakingSubscription = supabase
      .channel('nft_stakes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'nft_stakes',
          filter: `user_address=eq.${address}`
        }, 
        (payload) => {
          console.log('Staking change:', payload);
          refreshUserData();
        }
      )
      .subscribe();

    return () => {
      actionsSubscription.unsubscribe();
      ownershipSubscription.unsubscribe();
      stakingSubscription.unsubscribe();
    };
  }, [address, refreshUserData]);

  // Load initial data when address changes
  useEffect(() => {
    if (address) {
      refreshUserData();
    } else {
      // Clear data when disconnected
      setUserActions([]);
      setNftOwnership([]);
      setStakingData([]);
      setMarketplaceListings([]);
      setGovernanceVotes([]);
    }
  }, [address, refreshUserData]);

  return {
    // Data
    transactions,
    userActions,
    nftOwnership,
    stakingData,
    marketplaceListings,
    governanceVotes,

    // Mock data integration
    userNFTs,
    mockStakingData,
    mockMarketplaceListings,
    nftBalance: userNFTs?.length || 0,
    stakingBalance: mockStakingData?.userStaked || '0',
    totalEarnings: mockStakingData?.rewards || '0',

    // State
    isLoading: isLoading || mockLoading,

    // Actions
    handleNFTMint,
    handleNFTTransfer,
    handleNFTStaking,
    handleNFTUnstaking,
    handleMarketplaceListing,
    handleMarketplacePurchase,
    handleGovernanceVote,
    refreshUserData,
    storeContractInteraction,
    mockContractInteraction,
    refreshData
  };
}
