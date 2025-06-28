// // utils/nftDataService.js
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// export const fetchAllNFTs = async () => {
//   const { data, error } = await supabase
//     .from('nfts')
//     .select('*')
//     .order('created_at', { ascending: false });
  
//   if (error) {
//     console.error('Error fetching NFTs:', error);
//     return [];
//   }
  
//   return data;
// };

// export const fetchNFTById = async (id) => {
//   const { data, error } = await supabase
//     .from('nfts')
//     .select('*')
//     .eq('id', id)
//     .single();
  
//   if (error) {
//     console.error('Error fetching NFT:', error);
//     return null;
//   }
  
//   return data;
// };

// export const fetchUserStakes = async (userId) => {
//   if (!userId) return [];
  
//   const { data, error } = await supabase
//     .from('stakes')
//     .select('*')
//     .eq('user_id', userId);
  
//   if (error) {
//     console.error('Error fetching user stakes:', error);
//     return [];
//   }
  
//   return data;
// };

// export const fetchNFTStakingStats = async (nftId) => {
//   const { data, error } = await supabase
//     .from('staking_stats')
//     .select('*')
//     .eq('nft_id', nftId)
//     .single();
  
//   if (error) {
//     console.error('Error fetching staking stats:', error);
//     return {
//       totalStakers: 0,
//       totalStaked: 0
//     };
//   }
  
//   return data;
// };

// utils/nftDataService.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const fetchAllNFTs = async (userId = null) => {
  try {
    // Base query for NFTs
    let query = supabase
      .from('nfts')
      .select(`
        *,
        staking_stats:staking_stats_view(
          total_stakers,
          total_staked
        )
      `)
      .order('created_at', { ascending: false });

    // Fetch user stakes if userId is provided
    let userStakes = [];
    if (userId) {
      const { data: stakesData } = await supabase
        .from('stakes')
        .select('*')
        .eq('user_id', userId);
      userStakes = stakesData || [];
    }

    const { data: nfts, error } = await query;

    if (error) throw error;

    // Combine NFT data with user stakes
    return nfts.map(nft => ({
      ...nft,
      image: convertIpfsToHttp(nft.image), // Ensure IPFS URLs are converted
      userStake: userStakes.find(stake => stake.nft_id === nft.id),
      stakingStats: nft.staking_stats[0] || {
        totalStakers: 0,
        totalStaked: 0
      }
    }));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
};

export const fetchNFTById = async (id, userId = null) => {
  try {
    // Base query for single NFT
    let query = supabase
      .from('nfts')
      .select(`
        *,
        staking_stats:staking_stats_view(
          total_stakers,
          total_staked
        )
      `)
      .eq('id', id)
      .single();

    // Fetch user stake if userId is provided
    let userStake = null;
    if (userId) {
      const { data: stakeData } = await supabase
        .from('stakes')
        .select('*')
        .eq('nft_id', id)
        .eq('user_id', userId)
        .single();
      userStake = stakeData || null;
    }

    const { data: nft, error } = await query;

    if (error) throw error;

    return {
      ...nft,
      image: convertIpfsToHttp(nft.image), // Ensure IPFS URLs are converted
      userStake,
      stakingStats: nft.staking_stats[0] || {
        totalStakers: 0,
        totalStaked: 0
      }
    };
  } catch (error) {
    console.error('Error fetching NFT:', error);
    return null;
  }
};

// Helper function to convert IPFS URLs
const convertIpfsToHttp = (ipfsUrl) => {
  if (!ipfsUrl) return '/images/nft-placeholder.jpg';
  if (ipfsUrl.startsWith('http')) return ipfsUrl;
  if (ipfsUrl.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${ipfsUrl.split('ipfs://')[1]}`;
  }
  return ipfsUrl;
};