"use client";

import React, { useState, useMemo, useEffect } from "react";
import "./Marketplace.css";
import {
  Search,
  Filter,
  ChevronDown,
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
  TrendingUp,
  Clock,
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
import {
  useUserActiveStakes,
  useNftAnalytics,
  useUserNftData,
} from "@/hooks/useDatabaseActions";
import marketplaceData from "../../../data/marketplace-listings.json";
// test
// import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useContractReads } from "@/hooks/useContractOperations";
// import { useDatabaseActions, , useNftAnalytics } from '@/hooks/useDatabaseActions';
import { NFT_STAKING_ABI, LANDKRYPT_STABLECOIN_ABI } from "@/contracts/abis";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import {
  parseContractError,
  handleTransactionError,
  validateStakingParams,
  formatTxHash,
  getEtherscanUrl,
  formatBalance as formatBalanceUtil,
} from "@/utils/errorHandling";

// Hook to get staking contract address for an NFT
const useStakingContractAddress = (tokenId) => {
  const { data: stakingContract } = useReadContract({
    address: CONTRACT_ADDRESSES.STAKING_FACTORY,
    abi: STAKING_FACTORY_ABI,
    functionName: "getStakingContractForNFT",
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
      refetchInterval: 30000,
    },
  });

  return stakingContract &&
    stakingContract !== "0x0000000000000000000000000000000000000000"
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

  // should delete
  const [stakeAmount, setStakeAmount] = useState("");

  const stakingContractAddress =
    process.env.NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS;

  // const [stakingStage, setStakingStage] = useState("input"); // 'input', 'approving', 'staking', 'success', 'error'
  // const [showSettings, setShowSettings] = useState(false);
  // const [maxSlippage, setMaxSlippage] = useState(1.0); // 1% default
  // const [deadline, setDeadline] = useState(20); // 20 minutes default
  // const [stakingError, setStakingError] = useState(null);
  // const [txHash, setTxHash] = useState(null);
  // const [currentStep, setCurrentStep] = useState(1); // 1: Approve, 2: Stake
  // const [approvalTxHash, setApprovalTxHash] = useState(null);

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
  // Read staking contract data
  const { data: totalStaked } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: "totalStaked",
    query: {
      refetchInterval: 10000,
    },
  });

  const { data: targetAmount } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: "targetAmount",
    query: {
      refetchInterval: 30000,
    },
  });

  const { data: stakerInfo } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: "stakers",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 10000,
    },
  });

  const { data: earnedRewards } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: "getTotalClaimableRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 10000,
    },
  });

  const { data: currentAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
    abi: LANDKRYPT_STABLECOIN_ABI,
    functionName: "allowance",
    args: address ? [address, stakingContractAddress] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 5000,
    },
  });

  // Calculate staking metrics
  const stakingMetrics = useMemo(() => {
    const totalStakedFormatted = totalStaked
      ? parseFloat(formatEther(totalStaked))
      : 0;
    const targetAmountFormatted = targetAmount
      ? parseFloat(formatEther(targetAmount))
      : 0;
    const userStakedFormatted = stakerInfo
      ? parseFloat(formatEther(stakerInfo[0]))
      : 0; // amount is first in tuple
    const earnedRewardsFormatted = earnedRewards
      ? parseFloat(formatEther(earnedRewards))
      : 0;
    const currentAllowanceFormatted = currentAllowance
      ? parseFloat(formatEther(currentAllowance))
      : 0;

    const progressPercentage =
      targetAmountFormatted > 0
        ? (totalStakedFormatted / targetAmountFormatted) * 100
        : 0;
    const remainingAmount = Math.max(
      0,
      targetAmountFormatted - totalStakedFormatted
    );

    // Calculate APR (0.05% daily = 18.25% annual)
    const dailyRate = 0.0005; // 0.05%
    const annualRate = dailyRate * 365 * 100; // Convert to percentage

    // Calculate potential rewards for entered amount
    const stakeAmountNum = parseFloat(stakeAmount) || 0;
    const dailyRewards = stakeAmountNum * dailyRate;
    const monthlyRewards = dailyRewards * 30;
    const annualRewards = stakeAmountNum * (annualRate / 100);

    // Calculate completion bonus (110% of staked amount)
    const completionBonus = stakeAmountNum * 1.1;

    return {
      totalStaked: totalStakedFormatted,
      targetAmount: targetAmountFormatted,
      userStaked: userStakedFormatted,
      earnedRewards: earnedRewardsFormatted,
      currentAllowance: currentAllowanceFormatted,
      progressPercentage: Math.min(progressPercentage, 100),
      remainingAmount,
      annualRate,
      dailyRewards,
      monthlyRewards,
      annualRewards,
      completionBonus,
      isCompleted: progressPercentage >= 100,
      needsApproval: currentAllowanceFormatted < stakeAmountNum,
    };
  }, [
    totalStaked,
    targetAmount,
    stakerInfo,
    earnedRewards,
    currentAllowance,
    stakeAmount,
  ]);
  const formatBalance = (amount) => {
    return formatBalanceUtil(amount);
  };

  // Load NFT data from database and process IPFS metadata
  const { processedItems, isProcessing } =
    useMarketplaceMetadata(marketplaceData);

  // Get user's active stakes
  const { stakes: userStakes } = useUserActiveStakes();

  // Format processed items for display with user stake information
  const nftItems = processedItems.map((item) => {
    // Find user's stake for this NFT
    const userStake = userStakes.find((stake) => stake.nft_id === item.id);

    return {
      ...item,
      // Use processed image URL from metadata or fallback to original image
      image: item.processedImageUrl || item.image,
      originalImageUrl: item.processedImageUrl || item.image,
      // Format price for display
      price: `${parseFloat(
        item.originalPrice || item.price || 0
      ).toLocaleString()} LKUSD target`,
      // Use the staking contract from data or resolve it dynamically
      stakingContract: item.stakingContract,
      // Add user stake information
      userStaked: userStake ? parseFloat(userStake.amount) : 0,
      hasUserStake: !!userStake,
      userStakeDate: userStake ? userStake.created_at : null,
      // Add token ID for contract resolution
      tokenId: item.tokenId || item.id,
    };
  });

  // Filter and search logic
  const filteredItems = useMemo(() => {
    if (!processedItems || processedItems.length === 0) return [];

    let filtered = nftItems;

    // Apply type filter - make sure this matches your data structure
    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.type && item.type.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title &&
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [activeFilter, searchQuery, nftItems, processedItems]);

  // Add loading state handling
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

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
    // Get the staking contract address for this specific NFT
    const dynamicStakingContract = useStakingContractAddress(item.tokenId);
    const stakingContractAddress =
      dynamicStakingContract || item.stakingContract;

    // Read staking contract data for THIS specific NFT
    const { data: totalStaked } = useReadContract({
      address: stakingContractAddress,
      abi: NFT_STAKING_ABI,
      functionName: "totalStaked",
      enabled: !!stakingContractAddress,
      query: { refetchInterval: 10000 },
    });

    const { data: targetAmount } = useReadContract({
      address: stakingContractAddress,
      abi: NFT_STAKING_ABI,
      functionName: "targetAmount",
      enabled: !!stakingContractAddress,
      query: { refetchInterval: 30000 },
    });

    // Calculate metrics for THIS NFT
    const stakingMetrics = useMemo(() => {
      if (!totalStaked || !targetAmount) return null;

      const totalStakedFormatted = parseFloat(formatEther(totalStaked));
      const targetAmountFormatted = parseFloat(formatEther(targetAmount));
      const remainingAmount = Math.max(
        0,
        targetAmountFormatted - totalStakedFormatted
      );
      const progressPercentage =
        targetAmountFormatted > 0
          ? (totalStakedFormatted / targetAmountFormatted) * 100
          : 0;

      return {
        totalStaked: totalStakedFormatted,
        targetAmount: targetAmountFormatted,
        remainingAmount,
        progressPercentage: Math.min(progressPercentage, 100),
        isCompleted: progressPercentage >= 100,
      };
    }, [totalStaked, targetAmount]);

    const { analytics } = useNftAnalytics(item.id);

    const handleButtonClick = (e, action) => {
      e.stopPropagation();

      if (action === "like") {
        toggleLike(item.id);
      } else if (action === "share") {
        const propertyUrl = `${window.location.origin}/marketplace/property/${item.id}`;
        navigator.clipboard
          .writeText(propertyUrl)
          .then(() => alert("Property link copied to clipboard!"))
          .catch(() => alert("Failed to copy link"));
      } else if (action === "stake") {
        if (!safeIsConnected) {
          const connector = safeConnectors[0];
          if (connector) {
            safeConnect({ connector });
          }
          return;
        }

        const propertyWithContract = {
          ...item,
          stakingContract: stakingContractAddress,
        };
        setSelectedProperty(propertyWithContract);
        setShowStakingModal(true);
      }
    };

    const getStakingStatusColor = () => {
      if (!stakingMetrics) return "text-gray-400";
      if (stakingMetrics.isCompleted) return "text-emerald-400";
      if (stakingMetrics.progressPercentage > 75) return "text-amber-400";
      if (stakingMetrics.progressPercentage > 50) return "text-blue-400";
      return "text-purple-400";
    };

    const getProgressBarColor = () => {
      if (!stakingMetrics) return "from-gray-500 to-gray-600";
      if (stakingMetrics.isCompleted) return "from-emerald-500 to-green-500";
      if (stakingMetrics.progressPercentage > 75)
        return "from-amber-500 to-orange-500";
      if (stakingMetrics.progressPercentage > 50)
        return "from-blue-500 to-cyan-500";
      return "from-purple-500 to-pink-500";
    };

    const getStakingPriority = () => {
      if (!stakingMetrics) return null;
      if (stakingMetrics.isCompleted) return "FUNDED";
      if (stakingMetrics.progressPercentage > 90) return "URGENT";
      if (stakingMetrics.progressPercentage > 75) return "PRIORITY";
      if (stakingMetrics.progressPercentage > 50) return "ACTIVE";
      return "EARLY STAGE";
    };

    const getPriorityBadgeStyle = () => {
      if (!stakingMetrics) return "bg-gray-600 text-gray-200";
      if (stakingMetrics.isCompleted) return "bg-emerald-600 text-emerald-100";
      if (stakingMetrics.progressPercentage > 90)
        return "bg-red-600 text-red-100 animate-pulse";
      if (stakingMetrics.progressPercentage > 75)
        return "bg-amber-600 text-amber-100";
      if (stakingMetrics.progressPercentage > 50)
        return "bg-blue-600 text-blue-100";
      return "bg-purple-600 text-purple-100";
    };

    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-orange-500/60 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 group cursor-pointer hover:scale-[1.02] transform">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <IpfsImage
            src={item.image}
            alt={item.title}
            className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 group-hover:scale-110 transition-transform duration-700"
            placeholder="/images/nft-placeholder.jpg"
            showLoadingSpinner={true}
          />

          {/* Enhanced Tag with Priority */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
              {item.tag}
            </span>
            {stakingMetrics && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${getPriorityBadgeStyle()}`}
              >
                {getStakingPriority()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={(e) => handleButtonClick(e, "like")}
              className={`p-2 rounded-full backdrop-blur-md transition-all  shadow-lg hover:scale-110 ${
                likedItems.has(item.id)
                  ? "bg-red-500/90 text-white"
                  : "bg-black/40 text-white hover:bg-red-500/90"
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleButtonClick(e, "share")}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-gray-700/90 transition-all  shadow-lg hover:scale-110"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h3 className="text-white font-bold text-xl mb-3 group-hover:text-orange-400 transition-colors line-clamp-1">
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>{item.location}</span>
          </div>

          {/* Enhanced Staking Status Overlay */}
          {stakingMetrics && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
              <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`text-sm font-bold ${getStakingStatusColor()}`}
                  >
                    {stakingMetrics.isCompleted ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                        <span>Fully Funded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            stakingMetrics.progressPercentage > 90
                              ? "bg-red-400 animate-pulse"
                              : stakingMetrics.progressPercentage > 75
                              ? "bg-amber-400"
                              : stakingMetrics.progressPercentage > 50
                              ? "bg-blue-400"
                              : "bg-purple-400"
                          }`}
                        ></div>
                        <span>
                          {formatBalance(stakingMetrics.remainingAmount)} LKUSD
                          needed
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-white/90 text-sm font-bold bg-white/20 px-2 py-1 rounded-full">
                    {stakingMetrics.progressPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${getProgressBarColor()} h-2 rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${stakingMetrics.progressPercentage}%` }}
                    />
                  </div>
                  {/* Progress milestones */}
                  <div className="absolute top-0 left-1/4 w-0.5 h-2 bg-white/30"></div>
                  <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-white/30"></div>
                  <div className="absolute top-0 left-3/4 w-0.5 h-2 bg-white/30"></div>
                </div>

                {/* Target vs Remaining Quick Stats */}
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-300">
                    Target:{" "}
                    <span className="text-white font-medium">
                      {formatBalance(stakingMetrics.targetAmount)}
                    </span>
                  </span>
                  {!stakingMetrics.isCompleted && (
                    <span className="text-orange-300">
                      Need:{" "}
                      <span className="text-orange-100 font-medium">
                        {formatBalance(stakingMetrics.remainingAmount)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Participants Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users className="w-4 h-4 text-blue-400" />
              <span>{analytics?.stakingStats?.totalStakers || 0} stakers</span>
            </div>
            {stakingMetrics?.isCompleted && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/30">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Funded</span>
              </div>
            )}
          </div>

          {/* User Stake Status */}
          {item.hasUserStake && (
            <div className="mb-4 p-3 bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-emerald-300 text-sm font-semibold">
                  Your Stake: {item.userStaked.toFixed(2)} LKUSD
                </span>
              </div>
              <div className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Earning daily rewards
              </div>
            </div>
          )}

          {/* Enhanced Staking Button */}
          <GradientButton
            onClick={(e) => handleButtonClick(e, "stake")}
            className=" relative group/btn"
            disabled={!stakingContractAddress || stakingMetrics?.isCompleted}
          >
            <div
              className={`relative overflow-hidden  font-semibold text-center transition-all duration-300 ${
                !stakingContractAddress
                  ? " cursor-not-allowed"
                  : stakingMetrics?.isCompleted
                  ? "cursor-not-allowed"
                  : "   group-hover/btn:scale-105 transform"
              }`}
            >
              {!stakingContractAddress ? (
                <span className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Contract Not Found
                </span>
              ) : stakingMetrics?.isCompleted ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Fully Funded
                </span>
              ) : !safeIsConnected ? (
                <span className="flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect & Stake
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Stake Now (
                  {formatBalance(stakingMetrics?.remainingAmount || 20000)}{" "}
                  needed)
                </span>
              )}

              {/* Button shine effect */}
              {!stakingMetrics?.isCompleted && stakingContractAddress && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              )}
            </div>
          </GradientButton>

          {/* Debug info for staking contract */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
              <div className="font-mono">
                Contract:{" "}
                {stakingContractAddress
                  ? `${stakingContractAddress.slice(
                      0,
                      8
                    )}...${stakingContractAddress.slice(-6)}`
                  : "Not deployed"}
              </div>
              {stakingMetrics && (
                <div className="mt-1 font-mono">
                  Progress: {stakingMetrics.progressPercentage.toFixed(2)}% |
                  Remaining: {formatBalance(stakingMetrics.remainingAmount)} |
                  Target: {formatBalance(stakingMetrics.targetAmount)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black overflow-x-hidden text-white relative">
      {/* Header */}
      <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 px-5 py-3 backdrop-blur-md bg-opacity-80">
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
                  Connected: {safeAddress?.slice(0, 6)}...
                  {safeAddress?.slice(-4)}
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:to-pink-500 text-white rounded-full shadow-lg transform transition-transform hover:-translate-y-1"
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
                  <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl  min-w-[150px]">
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
                  <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl ">
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
          {
            // filteredItems.length > 0 && (
            //   <div className="flex items-center justify-center gap-2">
            //     <button className="p-2 text-gray-400 hover:text-white transition-colors">
            //       <ChevronDown className="w-5 h-5 rotate-90" />
            //     </button>
            //     {/* {[1, 2, 3, 4, 5, 6].map((page) => (
            //       <button
            //         key={page}
            //         onClick={() => setCurrentPage(page)}
            //         className={`w-10 h-10 rounded-lg font-medium transition-all ${
            //           currentPage === page
            //             ? "bg-orange-500 text-white"
            //             : "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white"
            //         }`}
            //       >
            //         {page}
            //       </button>
            //     ))} */}
            //     <button className="p-2 text-gray-400 hover:text-white transition-colors">
            //       <ChevronDown className="w-5 h-5 -rotate-90" />
            //     </button>
            //   </div>
            // )
          }
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
    </main>
  );
};

export default NFTMarketplace;
