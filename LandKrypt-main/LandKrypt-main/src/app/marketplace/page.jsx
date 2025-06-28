"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Star,
  Share2,
  Heart,
  Eye,
  Users,
  Calendar,
  MapPin,
  Building,
  Home,
  Mountain,
  Wallet,
  Menu,
  X,
  ShieldQuestion,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";
import Link from "next/link";
import Header from "@/components/Header";
import SwapModal from "@/components/SwapModal";
import StakingModal from "@/components/StakingModal";
import { GradientButton } from "@/components/GradientButton";
import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { useContractOperations } from "@/hooks/useContractOperations";
import { CONTRACT_ADDRESSES, STAKING_FACTORY_ABI } from "@/contracts/abis";
import IpfsImage from "@/components/IpfsImage";
import { convertIpfsToHttp, fetchTokenMetadata } from "@/utils/ipfs";
import { useMarketplaceMetadata } from "@/hooks/useNftMetadata";
import { useUserActiveStakes, useNftAnalytics } from "@/hooks/useDatabaseActions";
import marketplaceData from "../../../data/marketplace-listings.json";

// Hook to get staking contract address for an NFT
const useStakingContractAddress = (tokenId) => {
  const { data: stakingContract } = useReadContract({
    address: CONTRACT_ADDRESSES.STAKING_FACTORY,
    abi: STAKING_FACTORY_ABI,
    functionName: 'getStakingContractForNFT',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
      refetchInterval: 30000,
    },
  });

  return stakingContract && stakingContract !== '0x0000000000000000000000000000000000000000' 
    ? stakingContract 
    : null;
};

const NFTMarketplace = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedItems, setLikedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Wallet and contract integration - always call hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Use mounted state to determine when to actually use the values
  const safeAddress = isMounted ? address : null;
  const safeIsConnected = isMounted ? isConnected : false;
  const safeConnect = isMounted ? connect : () => {};
  const safeConnectors = isMounted ? connectors : [];

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "rwa", label: "RWA" },
    { value: "digital asset", label: "Digital Asset" },
  ];

  // Load NFT data from database and process IPFS metadata
  const { processedItems, isProcessing } = useMarketplaceMetadata(marketplaceData);
  
  // Get user's active stakes
  const { stakes: userStakes } = useUserActiveStakes();
  
  // Format processed items for display with user stake information
  const nftItems = processedItems.map(item => {
    // Find user's stake for this NFT
    const userStake = userStakes.find(stake => stake.nft_id === item.id);
    
    return {
      ...item,
      // Use processed image URL from metadata or fallback to original image
      image: item.processedImageUrl || item.image,
      originalImageUrl: item.processedImageUrl || item.image,
      // Format price for display
      price: `${parseFloat(item.originalPrice || item.price || 0).toLocaleString()} LKUSD target`,
      // Use the staking contract from data or resolve it dynamically
      stakingContract: item.stakingContract,
      // Add user stake information
      userStaked: userStake ? parseFloat(userStake.amount) : 0,
      hasUserStake: !!userStake,
      userStakeDate: userStake ? userStake.created_at : null,
      // Add token ID for contract resolution
      tokenId: item.tokenId || item.id
    };
  });

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = nftItems;

    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [activeFilter, searchQuery]);

  const toggleLike = (id) => {
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedItems(newLiked);
  };

  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue);
    setIsFilterDropdownOpen(false);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const getCurrentFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === activeFilter);
    return option ? option.label : "All";
  };

  const NFTCard = ({ item }) => {
    // Always call hooks - use the safe values from parent component
    const { analytics } = useNftAnalytics(item.id);
    
    // Get the actual staking contract address from the factory
    const dynamicStakingContract = useStakingContractAddress(item.tokenId);
    
    // Use dynamic contract address if available, fallback to static data
    const stakingContractAddress = dynamicStakingContract || item.stakingContract;

    const handleButtonClick = (e, action) => {
      e.stopPropagation(); // Prevent the card click from firing
      if (action === "like") {
        toggleLike(item.id);
      } else if (action === "share") {
        // Handle share action - copy property link to clipboard
        const propertyUrl = `${window.location.origin}/marketplace/property/${item.id}`;
        navigator.clipboard.writeText(propertyUrl).then(() => {
          alert("Property link copied to clipboard!");
        }).catch(() => {
          alert("Failed to copy link");
        });
      } else if (action === "stake") {
        // Check wallet connection before showing modal
        if (!safeIsConnected) {
          // Auto-connect if not connected
          const connector = safeConnectors[0];
          if (connector) {
            safeConnect({ connector });
          }
          return;
        }
        // Set the selected property with the correct staking contract
        const propertyWithContract = {
          ...item,
          stakingContract: stakingContractAddress
        };
        setSelectedProperty(propertyWithContract);
        setShowStakingModal(true);
      }
    };

    return (
      <>
        <Link href={`/marketplace/property/${item.id}`} passHref legacyBehavior>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 group cursor-pointer">
            <div className="relative overflow-hidden">
              <IpfsImage
                src={item.image}
                alt={item.title}
                className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800"
                placeholder="/images/nft-placeholder.jpg"
                showLoadingSpinner={true}
              />
              <div className="absolute top-3 left-3">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {item.tag}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={(e) => handleButtonClick(e, "like")}
                  className={`p-1.5 rounded-full backdrop-blur-sm transition-all z-10 ${
                    likedItems.has(item.id)
                      ? "bg-red-500 text-white"
                      : "bg-black/30 text-white hover:bg-red-500"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleButtonClick(e, "share")}
                  className="p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-gray-700 transition-all z-10"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-5">
              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-orange-400 transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-orange-400 font-medium">{item.price}</div>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{analytics?.stakingStats?.totalStakers || 0} stakers</span>
                </div>
              </div>
              
              {/* User Stake Status */}
              {item.hasUserStake && (
                <div className="mb-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-sm font-medium">
                      You staked {item.userStaked.toFixed(2)} LKUSD
                    </span>
                  </div>
                  <div className="text-green-400 text-xs mt-1">
                    Earning daily rewards
                  </div>
                </div>
              )}
              
              {/* Staking Progress */}
              {analytics?.stakingStats && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Staking Progress</span>
                    <span>{analytics.stakingStats.totalStakers} participants</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full"
                      style={{ 
                        width: `${Math.min((analytics.stakingStats.totalStaked / 1000000) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analytics.stakingStats.totalStaked.toLocaleString()} LKUSD staked
                  </div>
                </div>
              )}
              <button
                onClick={(e) => handleButtonClick(e, "stake")}
                className="w-full z-10 relative"
                disabled={!stakingContractAddress}
              >
                <GradientButton>
                  {!stakingContractAddress 
                    ? "Staking Contract Not Found"
                    : !safeIsConnected 
                    ? "Connect & Stake" 
                    : "Start Staking"
                  }
                </GradientButton>
              </button>
              
              {/* Debug info for staking contract */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-1">
                  Contract: {stakingContractAddress ? 
                    `${stakingContractAddress.slice(0,8)}...${stakingContractAddress.slice(-6)}` : 
                    'Not deployed'
                  }
                </div>
              )}
            </div>
          </div>
        </Link>

      </>
    );
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#07000b] via-[#06000b] to-black overflow-x-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
        <Header />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-9 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
            NFT Marketplace
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Explore, buy, and stake on verified land NFTs
          </p>
          
          {/* Wallet Connection Status */}
          <div className="mb-8">
            {safeIsConnected ? (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Wallet className="w-5 h-5" />
                <span className="text-sm">
                  Connected: {safeAddress?.slice(0, 6)}...{safeAddress?.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  const connector = safeConnectors[0];
                  if (connector) {
                    safeConnect({ connector });
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet to Start Staking
              </button>
            )}
          </div>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, location, or description"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Filters & Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Filter Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-white">
              Latest Properties
              {filteredItems.length !== nftItems.length && (
                <span className="text-orange-400 text-lg ml-2">
                  ({filteredItems.length} results)
                </span>
              )}
            </h2>

            {/* Desktop Filter Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1">
                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-gray-400 text-sm">Filter:</span>
              </div>
              <div className="relative">
                <GradientButton
                  gradientFrom=""
                  gradientTo=""
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center gap-2 border border-amber-500"
                >
                  <span>{getCurrentFilterLabel()}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isFilterDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </GradientButton>

                {isFilterDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          activeFilter === option.value
                            ? "bg-orange-500 text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Filter Dropdown */}
            <div className="sm:hidden w-full">
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Filter: {getCurrentFilterLabel()}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isFilterDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          activeFilter === option.value
                            ? "bg-orange-500 text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredItems.map((item) => (
                <NFTCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                No properties found
              </div>
              <p className="text-gray-500">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : `No ${getCurrentFilterLabel().toLowerCase()} properties available`}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Highest Staking Volume Section - Only show if we have items and no search/filter */}
          {filteredItems.length > 0 &&
            !searchQuery &&
            activeFilter === "all" && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Highest Staking Volume
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nftItems.slice(0, 3).map((item) => (
                    <NFTCard key={`staking-${item.id}`} item={item} />
                  ))}
                </div>
              </div>
            )}

          {/* Pagination - Only show if we have items */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              {[1, 2, 3, 4, 5, 6].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Staking Modal */}
      {selectedProperty && (
        <StakingModal
          isOpen={showStakingModal}
          onClose={() => {
            setShowStakingModal(false);
            setSelectedProperty(null);
          }}
          property={selectedProperty}
          stakingContractAddress={selectedProperty.stakingContract}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NFTMarketplace;
