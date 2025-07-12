// Mock Data Hook for Development and Testing
// Provides mock NFT data, marketplace listings, and contract interactions

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

// Mock NFT data
const mockNFTData = [
  {
    tokenId: 1,
    name: "Luxury Villa Property",
    description: "Beautiful luxury villa with ocean view",
    image: "/nftimages/property1.jpg",
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    price: "1.5",
    isListed: true,
    attributes: [
      { trait_type: "Property Type", value: "Villa" },
      { trait_type: "Location", value: "Lagos, Nigeria" },
      { trait_type: "Size", value: "500 sqm" },
      { trait_type: "Bedrooms", value: "5" },
      { trait_type: "Bathrooms", value: "4" }
    ]
  },
  {
    tokenId: 2,
    name: "Modern Apartment Complex",
    description: "Contemporary apartment in city center",
    image: "/nftimages/property2.jpg",
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    price: "0.8",
    isListed: true,
    attributes: [
      { trait_type: "Property Type", value: "Apartment" },
      { trait_type: "Location", value: "Abuja, Nigeria" },
      { trait_type: "Size", value: "150 sqm" },
      { trait_type: "Bedrooms", value: "3" },
      { trait_type: "Bathrooms", value: "2" }
    ]
  },
  {
    tokenId: 3,
    name: "Executive Villa Estate",
    description: "Premium villa in gated community",
    image: "/nftimages/villa1.jpg",
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    price: null,
    isListed: false,
    attributes: [
      { trait_type: "Property Type", value: "Villa" },
      { trait_type: "Location", value: "Port Harcourt, Nigeria" },
      { trait_type: "Size", value: "750 sqm" },
      { trait_type: "Bedrooms", value: "6" },
      { trait_type: "Bathrooms", value: "5" }
    ]
  },
  {
    tokenId: 4,
    name: "Downtown Apartment",
    description: "Stylish apartment in business district",
    image: "/nftimages/apartment1.jpg",
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    price: null,
    isListed: false,
    attributes: [
      { trait_type: "Property Type", value: "Apartment" },
      { trait_type: "Location", value: "Kano, Nigeria" },
      { trait_type: "Size", value: "120 sqm" },
      { trait_type: "Bedrooms", value: "2" },
      { trait_type: "Bathrooms", value: "2" }
    ]
  },
  {
    tokenId: 5,
    name: "Agricultural Land Plot",
    description: "Fertile agricultural land for farming",
    image: "/nftimages/land1.jpg",
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    price: null,
    isListed: false,
    attributes: [
      { trait_type: "Property Type", value: "Land" },
      { trait_type: "Location", value: "Kaduna, Nigeria" },
      { trait_type: "Size", value: "2000 sqm" },
      { trait_type: "Land Use", value: "Agricultural" },
      { trait_type: "Soil Type", value: "Fertile" }
    ]
  }
];

// Mock staking data
const mockStakingData = {
  totalStaked: "250.0",
  userStaked: "100.0",
  rewards: "15.5",
  apy: "12.5",
  stakingPools: [
    {
      id: 1,
      name: "NFT Staking Pool",
      totalStaked: "1000.0",
      apy: "15.0",
      userStaked: "50.0",
      rewards: "7.5"
    },
    {
      id: 2,
      name: "Token Staking Pool",
      totalStaked: "2500.0",
      apy: "10.0",
      userStaked: "50.0",
      rewards: "8.0"
    }
  ]
};

// Mock governance data
const mockGovernanceData = {
  totalProposals: 5,
  activeProposals: 2,
  userVotingPower: "125.5",
  proposals: [
    {
      id: 1,
      title: "Increase Staking Rewards",
      description: "Proposal to increase staking rewards by 2%",
      status: "active",
      votesFor: "1250.0",
      votesAgainst: "350.0",
      endTime: Date.now() + 86400000 * 5, // 5 days
      userVoted: false
    },
    {
      id: 2,
      title: "Add New NFT Collection",
      description: "Proposal to add support for new property types",
      status: "active",
      votesFor: "890.0",
      votesAgainst: "210.0",
      endTime: Date.now() + 86400000 * 3, // 3 days
      userVoted: true
    },
    {
      id: 3,
      title: "Platform Fee Adjustment",
      description: "Proposal to reduce platform fees to 2%",
      status: "passed",
      votesFor: "2100.0",
      votesAgainst: "450.0",
      endTime: Date.now() - 86400000 * 2, // 2 days ago
      userVoted: true
    }
  ]
};

export function useMockData() {
  const { address } = useAccount();
  const [nftData, setNftData] = useState(mockNFTData);
  const [stakingData, setStakingData] = useState(mockStakingData);
  const [governanceData, setGovernanceData] = useState(mockGovernanceData);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's NFTs
  const getUserNFTs = useCallback(() => {
    if (!address) return [];
    return nftData.filter(nft => nft.owner.toLowerCase() === address.toLowerCase());
  }, [address, nftData]);

  // Get marketplace listings
  const getMarketplaceListings = useCallback(() => {
    return nftData.filter(nft => nft.isListed);
  }, [nftData]);

  // Get user's staked NFTs
  const getStakedNFTs = useCallback(() => {
    if (!address) return [];
    // Mock: return first 2 NFTs as staked
    return nftData.slice(0, 2).map(nft => ({
      ...nft,
      stakedAmount: "50.0",
      rewards: "7.5",
      stakingDate: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
    }));
  }, [address, nftData]);

  // Mock contract interactions
  const mockContractInteraction = useCallback(async (action, params = {}) => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      switch (action) {
        case 'listNFT':
          setNftData(prev => prev.map(nft => 
            nft.tokenId === params.tokenId 
              ? { ...nft, isListed: true, price: params.price }
              : nft
          ));
          break;
          
        case 'unlistNFT':
          setNftData(prev => prev.map(nft => 
            nft.tokenId === params.tokenId 
              ? { ...nft, isListed: false, price: null }
              : nft
          ));
          break;
          
        case 'buyNFT':
          setNftData(prev => prev.map(nft => 
            nft.tokenId === params.tokenId 
              ? { ...nft, owner: address, isListed: false, price: null }
              : nft
          ));
          break;
          
        case 'stakeTokens':
          setStakingData(prev => ({
            ...prev,
            userStaked: (parseFloat(prev.userStaked) + parseFloat(params.amount)).toString(),
            totalStaked: (parseFloat(prev.totalStaked) + parseFloat(params.amount)).toString()
          }));
          break;
          
        case 'unstakeTokens':
          setStakingData(prev => ({
            ...prev,
            userStaked: Math.max(0, parseFloat(prev.userStaked) - parseFloat(params.amount)).toString(),
            totalStaked: Math.max(0, parseFloat(prev.totalStaked) - parseFloat(params.amount)).toString()
          }));
          break;
          
        case 'claimRewards':
          setStakingData(prev => ({
            ...prev,
            rewards: "0.0"
          }));
          break;
          
        case 'vote':
          setGovernanceData(prev => ({
            ...prev,
            proposals: prev.proposals.map(proposal => 
              proposal.id === params.proposalId 
                ? {
                    ...proposal,
                    votesFor: params.support 
                      ? (parseFloat(proposal.votesFor) + parseFloat(params.votingPower)).toString()
                      : proposal.votesFor,
                    votesAgainst: !params.support 
                      ? (parseFloat(proposal.votesAgainst) + parseFloat(params.votingPower)).toString()
                      : proposal.votesAgainst,
                    userVoted: true
                  }
                : proposal
            )
          }));
          break;
          
        case 'createProposal':
          const newProposal = {
            id: governanceData.proposals.length + 1,
            title: params.title,
            description: params.description,
            status: "active",
            votesFor: "0.0",
            votesAgainst: "0.0",
            endTime: Date.now() + 86400000 * 7, // 7 days
            userVoted: false
          };
          setGovernanceData(prev => ({
            ...prev,
            totalProposals: prev.totalProposals + 1,
            activeProposals: prev.activeProposals + 1,
            proposals: [newProposal, ...prev.proposals]
          }));
          break;
          
        default:
          console.log(`Mock action: ${action}`, params);
      }
      
      return { success: true, txHash: `0x${Math.random().toString(16).substring(2, 66)}` };
      
    } catch (error) {
      console.error('Mock contract interaction failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address, governanceData.proposals.length]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update rewards
    setStakingData(prev => ({
      ...prev,
      rewards: (parseFloat(prev.rewards) + Math.random() * 0.1).toFixed(2)
    }));
    
    setIsLoading(false);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    // Data
    nftData,
    stakingData,
    governanceData,
    isLoading,
    
    // Computed data
    userNFTs: getUserNFTs(),
    marketplaceListings: getMarketplaceListings(),
    stakedNFTs: getStakedNFTs(),
    
    // Actions
    mockContractInteraction,
    refreshData,
    
    // Utilities
    isUserNFT: (tokenId) => {
      const nft = nftData.find(n => n.tokenId === tokenId);
      return nft && nft.owner.toLowerCase() === address?.toLowerCase();
    },
    
    getNFTById: (tokenId) => {
      return nftData.find(n => n.tokenId === tokenId);
    },
    
    getProposalById: (proposalId) => {
      return governanceData.proposals.find(p => p.id === proposalId);
    }
  };
}

export default useMockData;
