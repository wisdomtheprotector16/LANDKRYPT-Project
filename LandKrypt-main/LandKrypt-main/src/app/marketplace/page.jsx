"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { nftProperties } from "./nfts";
import Footer from "@/components/Footer";
import Link from "next/link";
import Header from "@/components/Header";
import SwapModal from "@/components/SwapModal";
import { GradientButton } from "@/components/GradientButton";

const VotingModal = ({
  isOpen,
  onClose,
  property,
  availableTokens = 36.61,
}) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent click from bubbling to overlay
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} // Close when clicking outside
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={handleModalClick}
      >
        <h3 className="text-white font-semibold text-xl mb-4">
          {property.title}
        </h3>
        <p className="text-gray-300 mb-6">
          Staking on this land NFT earns you governance tokens (LKST) and a
          share of future returns.
        </p>

        <div className="mb-6">
          <h4 className="text-white font-medium mb-2">Stake Amount (LKST)</h4>
          <input
            type="number"
            placeholder="Enter amount to stake"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mb-2"
          />
          <p className="text-gray-400 text-sm">
            Available: {availableTokens} LKST
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle vote submission
              alert(`Voted on ${property.title}`);
              onClose();
            }}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition"
          >
            Vote Now
          </button>
        </div>
        <div className="mt-8 flex gap-1 text-white bg-neutral-800/30 rounded-2xl p-3">
          <div>
            <ShieldQuestion className="" />
          </div>
          <div>
            {/* <h4 className="text font-medium mb-3">
            What documents are accepted?
          </h4> */}
            <p className="text-gray-400 text-sm">
              Staking rewards: <strong>7% APR</strong> in LKST tokens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NFTMarketplace = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedItems, setLikedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showVotingModal, setShowVotingModal] = useState(false);

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "rwa", label: "RWA" },
    { value: "digital asset", label: "Digital Asset" },
  ];

  const nftItems = [
    {
      id: 1,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "200,000 LKRYPT staked",
      shares: "22 Shares",
      image: "/nfts/nft1.jpg",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "rwa",
    },
    {
      id: 2,
      title: "Commercial Plot In Victoria Island",
      location: "Victoria Island, Lagos, Nigeria",
      price: "150,000 LKRYPT staked",
      shares: "18 Shares",
      image: "/nfts/nft2.jpg",
      tag: "COMMERCIAL",
      category: "commercial",
      staking: true,
      type: "digital asset",
    },
    {
      id: 3,
      title: "Residential Development Land",
      location: "Lekki, Lagos, Nigeria",
      price: "300,000 LKRYPT staked",
      shares: "35 Shares",
      image: "/nfts/nft3.jpg",
      tag: "RESIDENTIAL",
      category: "residential",
      staking: true,
      type: "rwa",
    },
    {
      id: 4,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "250,000 LKRYPT staked",
      shares: "28 Shares",
      image: "/nfts/nft4.jpg",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "rwa",
    },
    {
      id: 5,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "180,000 LKRYPT staked",
      shares: "25 Shares",
      image: "/nfts/nft5.jpg",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "digital asset",
    },
    {
      id: 6,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "320,000 LKRYPT staked",
      shares: "42 Shares",
      image: "/nfts/nft6.jpg",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "digital asset",
    },
    {
      id: 7,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "320,000 LKRYPT staked",
      shares: "42 Shares",
      image: "/nfts/nft7.png",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "rwa",
    },
    {
      id: 8,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "320,000 LKRYPT staked",
      shares: "42 Shares",
      image: "/nfts/nft8.png",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "digital asset",
    },
    {
      id: 9,
      title: "Luxury Villa In Banana Island",
      location: "Banana Island, Lagos, Nigeria",
      price: "320,000 LKRYPT staked",
      shares: "42 Shares",
      image: "/nfts/nft9.png",
      tag: "LUXURY VILLA",
      category: "residential",
      staking: true,
      type: "digital asset",
    },
  ];

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
    const [showVoteModal, setShowVoteModal] = useState(false);

    const handleButtonClick = (e, action) => {
      e.stopPropagation(); // Prevent the card click from firing
      if (action === "like") {
        toggleLike(item.id);
      } else if (action === "share") {
        // Handle share action
        alert("share pop up");
      } else if (action === "vote") {
        // Show the voting modal you uploaded
        // You'll need to implement this modal component
        // alert("modal pop up");
        setShowVoteModal(true);
      }
    };

    return (
      <>
        <Link href={`/marketplace/property/${item.id}`} passHref legacyBehavior>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 group cursor-pointer">
            <div className="relative overflow-hidden">
              <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
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
                  <span>{item.shares}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleButtonClick(e, "vote")}
                className="w-full z-10 relative"
              >
                <GradientButton>Start Staking</GradientButton>
              </button>
            </div>
          </div>
        </Link>

        <VotingModal
          isOpen={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          property={item}
        />
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
          <p className="text-xl text-gray-300 mb-8">
            Explore, buy, and stake on verified land NFTs
          </p>

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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NFTMarketplace;
