// Real-time NFT Data Synchronization Hook
// Automatically syncs NFT data between blockchain, database, and frontend

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useNFTSync() {
  const { address } = useAccount();
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // ====== DATA FETCHING ======

  const fetchNFTs = useCallback(async (ownerAddress = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('nfts')
        .select(`
          *,
          marketplace_listings (
            id,
            price,
            currency,
            status,
            created_at
          )
        `)
        .order('token_id', { ascending: true });

      if (ownerAddress) {
        query = query.eq('owner_address', ownerAddress);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Enrich NFT data with computed properties
      const enrichedNFTs = data.map(nft => ({
        ...nft,
        isListed: nft.marketplace_listings && nft.marketplace_listings.length > 0,
        currentListing: nft.marketplace_listings?.[0] || null,
        stakingMultiplier: nft.metadata?.properties?.stakingMultiplier || 1,
        estimatedValue: nft.metadata?.properties?.estimatedValue || 0,
        rarity: nft.metadata?.attributes?.find(attr => attr.trait_type === 'Rarity')?.value || 'Common',
        location: nft.metadata?.attributes?.find(attr => attr.trait_type === 'Location')?.value || 'Unknown',
        propertyType: nft.metadata?.attributes?.find(attr => attr.trait_type === 'Property Type')?.value || 'Unknown'
      }));

      setNFTs(enrichedNFTs);
      setLastSync(new Date());

    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ====== REAL-TIME SUBSCRIPTIONS ======

  useEffect(() => {
    // Subscribe to NFT changes
    const nftSubscription = supabase
      .channel('nft-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'nfts' 
        }, 
        (payload) => {
          console.log('NFT change detected:', payload);
          handleNFTChange(payload);
        }
      )
      .subscribe();

    // Subscribe to marketplace listing changes
    const listingSubscription = supabase
      .channel('listing-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'marketplace_listings' 
        }, 
        (payload) => {
          console.log('Listing change detected:', payload);
          handleListingChange(payload);
        }
      )
      .subscribe();

    return () => {
      nftSubscription.unsubscribe();
      listingSubscription.unsubscribe();
    };
  }, []);

  // ====== CHANGE HANDLERS ======

  const handleNFTChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setNFTs(currentNFTs => {
      switch (eventType) {
        case 'INSERT':
          // Add new NFT
          return [...currentNFTs, {
            ...newRecord,
            isListed: false,
            currentListing: null,
            stakingMultiplier: newRecord.metadata?.properties?.stakingMultiplier || 1,
            estimatedValue: newRecord.metadata?.properties?.estimatedValue || 0,
            rarity: newRecord.metadata?.attributes?.find(attr => attr.trait_type === 'Rarity')?.value || 'Common',
            location: newRecord.metadata?.attributes?.find(attr => attr.trait_type === 'Location')?.value || 'Unknown',
            propertyType: newRecord.metadata?.attributes?.find(attr => attr.trait_type === 'Property Type')?.value || 'Unknown'
          }].sort((a, b) => a.token_id - b.token_id);

        case 'UPDATE':
          // Update existing NFT
          return currentNFTs.map(nft => 
            nft.token_id === newRecord.token_id 
              ? { 
                  ...nft, 
                  ...newRecord,
                  stakingMultiplier: newRecord.metadata?.properties?.stakingMultiplier || nft.stakingMultiplier,
                  estimatedValue: newRecord.metadata?.properties?.estimatedValue || nft.estimatedValue
                }
              : nft
          );

        case 'DELETE':
          // Remove deleted NFT
          return currentNFTs.filter(nft => nft.token_id !== oldRecord.token_id);

        default:
          return currentNFTs;
      }
    });

    setLastSync(new Date());
  }, []);

  const handleListingChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setNFTs(currentNFTs => {
      return currentNFTs.map(nft => {
        if (nft.token_id === (newRecord?.token_id || oldRecord?.token_id)) {
          switch (eventType) {
            case 'INSERT':
              return {
                ...nft,
                isListed: true,
                currentListing: newRecord,
                marketplace_listings: [newRecord]
              };

            case 'UPDATE':
              return {
                ...nft,
                currentListing: newRecord,
                marketplace_listings: [newRecord]
              };

            case 'DELETE':
              return {
                ...nft,
                isListed: false,
                currentListing: null,
                marketplace_listings: []
              };

            default:
              return nft;
          }
        }
        return nft;
      });
    });

    setLastSync(new Date());
  }, []);

  // ====== MANUAL SYNC FUNCTIONS ======

  const syncUserNFTs = useCallback(async (userAddress = address) => {
    if (!userAddress) return;
    await fetchNFTs(userAddress);
  }, [address, fetchNFTs]);

  const syncAllNFTs = useCallback(async () => {
    await fetchNFTs();
  }, [fetchNFTs]);

  const refreshNFT = useCallback(async (tokenId) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select(`
          *,
          marketplace_listings (
            id,
            price,
            currency,
            status,
            created_at
          )
        `)
        .eq('token_id', tokenId)
        .single();

      if (error) throw error;

      const enrichedNFT = {
        ...data,
        isListed: data.marketplace_listings && data.marketplace_listings.length > 0,
        currentListing: data.marketplace_listings?.[0] || null,
        stakingMultiplier: data.metadata?.properties?.stakingMultiplier || 1,
        estimatedValue: data.metadata?.properties?.estimatedValue || 0,
        rarity: data.metadata?.attributes?.find(attr => attr.trait_type === 'Rarity')?.value || 'Common',
        location: data.metadata?.attributes?.find(attr => attr.trait_type === 'Location')?.value || 'Unknown',
        propertyType: data.metadata?.attributes?.find(attr => attr.trait_type === 'Property Type')?.value || 'Unknown'
      };

      setNFTs(currentNFTs => 
        currentNFTs.map(nft => 
          nft.token_id === tokenId ? enrichedNFT : nft
        )
      );

      setLastSync(new Date());
      return enrichedNFT;

    } catch (err) {
      console.error('Error refreshing NFT:', err);
      throw err;
    }
  }, []);

  // ====== FILTERING AND SORTING ======

  const filterNFTs = useCallback((filters) => {
    return nfts.filter(nft => {
      if (filters.owner && nft.owner_address !== filters.owner) return false;
      if (filters.rarity && nft.rarity !== filters.rarity) return false;
      if (filters.location && nft.location !== filters.location) return false;
      if (filters.propertyType && nft.propertyType !== filters.propertyType) return false;
      if (filters.isListed !== undefined && nft.isListed !== filters.isListed) return false;
      if (filters.minValue && nft.estimatedValue < filters.minValue) return false;
      if (filters.maxValue && nft.estimatedValue > filters.maxValue) return false;
      return true;
    });
  }, [nfts]);

  const sortNFTs = useCallback((sortBy, sortOrder = 'asc') => {
    return [...nfts].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'tokenId':
          aValue = a.token_id;
          bValue = b.token_id;
          break;
        case 'value':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        case 'rarity':
          const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
          aValue = rarityOrder[a.rarity] || 0;
          bValue = rarityOrder[b.rarity] || 0;
          break;
        case 'created':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });
  }, [nfts]);

  // ====== STATISTICS ======

  const getStats = useCallback(() => {
    const stats = {
      total: nfts.length,
      listed: nfts.filter(nft => nft.isListed).length,
      totalValue: nfts.reduce((sum, nft) => sum + (nft.estimatedValue || 0), 0),
      averageValue: nfts.length > 0 ? nfts.reduce((sum, nft) => sum + (nft.estimatedValue || 0), 0) / nfts.length : 0,
      byRarity: nfts.reduce((acc, nft) => {
        acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
        return acc;
      }, {}),
      byLocation: nfts.reduce((acc, nft) => {
        acc[nft.location] = (acc[nft.location] || 0) + 1;
        return acc;
      }, {}),
      byPropertyType: nfts.reduce((acc, nft) => {
        acc[nft.propertyType] = (acc[nft.propertyType] || 0) + 1;
        return acc;
      }, {})
    };

    return stats;
  }, [nfts]);

  // ====== INITIAL LOAD ======

  useEffect(() => {
    if (address) {
      syncUserNFTs(address);
    } else {
      syncAllNFTs();
    }
  }, [address, syncUserNFTs, syncAllNFTs]);

  return {
    // Data
    nfts,
    loading,
    error,
    lastSync,

    // Actions
    syncUserNFTs,
    syncAllNFTs,
    refreshNFT,

    // Utilities
    filterNFTs,
    sortNFTs,
    getStats
  };
}
