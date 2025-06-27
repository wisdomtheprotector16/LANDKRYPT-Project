"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CheckCircle } from "lucide-react";
import { GradientButton } from "@/components/GradientButton";
import { useContractWrite, useContractReadData, useWallet } from "../../../hooks/useContractInteraction";
import { NFTDAO_ABI, LANDKRYPT_STAKING_TOKEN_ABI, CONTRACT_ADDRESSES } from "../../../contracts/abis";
import { toast } from "react-hot-toast";
import { parseAmount } from "../../../hooks/useContractInteraction";

const ProposalsSection = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [voteAmounts, setVoteAmounts] = useState({});
  const [showVoteModal, setShowVoteModal] = useState(null);
  
  // Wagmi hooks
  const { address, isConnected } = useWallet();
  
  // Get user's token balance for voting
  const { data: tokenBalance } = useContractReadData(
    CONTRACT_ADDRESSES.LANDKRYPT_STAKING_TOKEN,
    LANDKRYPT_STAKING_TOKEN_ABI,
    'balanceOf',
    [address]
  );
  
  // Vote transaction
  const { write: voteOnProposal, isLoading: isVoting } = useContractWrite(
    CONTRACT_ADDRESSES.NFT_DAO,
    NFTDAO_ABI,
    'vote',
    showVoteModal ? [showVoteModal.id, parseAmount(voteAmounts[showVoteModal.id] || '0')] : []
  );

  const activeProposals = [
    {
      id: 1,
      title: "Eco-friendly Development for Lekki Plot",
      tokenId: "201",
      description:
        "Premium waterfront property in Lagos' most exclusive neighborhood. Features private beach access and...",
      ownership: "40%",
      timeframe: "90 days (July 1-September 29, 2025)",
      status: "Active",
    },
    {
      id: 2,
      title: "Luxury Apartment Complex in Ikoyi",
      tokenId: "201",
      description:
        "Premium waterfront property in Lagos' most exclusive neighborhood. Features private beach access and...",
      ownership: "40%",
      timeframe: "90 days (July 1-September 29, 2025)",
      status: "Active",
    },
    {
      id: 3,
      title: "Smart City Integration in Banana Island",
      tokenId: "201",
      description:
        "Premium waterfront property in Lagos' most exclusive neighborhood. Features private beach access and...",
      ownership: "40%",
      timeframe: "90 days (July 1-September 29, 2025)",
      status: "Active",
    },
  ];

  const allProposals = [
    ...activeProposals,
    {
      id: 4,
      title: "Residential Complex in Victoria Island",
      tokenId: "198",
      description:
        "High-end residential development with modern amenities and ocean views...",
      ownership: "65%",
      timeframe: "Completed (March 1-May 31, 2025)",
      status: "Completed",
    },
    {
      id: 5,
      title: "Commercial Hub in Abuja CBD",
      tokenId: "195",
      description:
        "Mixed-use development featuring office spaces and retail outlets...",
      ownership: "55%",
      timeframe: "Completed (January 15-April 15, 2025)",
      status: "Completed",
    },
    {
      id: 6,
      title: "Affordable Housing Project in Surulere",
      tokenId: "192",
      description:
        "Community-focused development aimed at providing quality affordable housing...",
      ownership: "30%",
      timeframe: "Rejected (February 1-March 30, 2025)",
      status: "Rejected",
    },
  ];

  const currentProposals =
    activeTab === "active" ? activeProposals : allProposals;

  const tabVariants = {
    inactive: {
      color: "#9CA3AF",
      borderBottomColor: "transparent",
      borderBottomWidth: 0,
    },
    active: {
      color: "#FB923C",
      borderBottomColor: "#FB923C",
      borderBottomWidth: 2,
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-blue-600";
      case "Completed":
        return "bg-green-600";
      case "Rejected":
        return "bg-red-600";
      default:
        return "bg-blue-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={12} />;
      default:
        return null;
    }
  };
  
  const handleVote = async (proposalId) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const voteAmount = voteAmounts[proposalId];
    if (!voteAmount || parseFloat(voteAmount) <= 0) {
      toast.error('Please enter a valid vote amount');
      return;
    }
    
    try {
      await voteOnProposal?.();
      
      // Record vote in database
      await fetch('/api/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          actionType: 'vote',
          txHash: 'pending',
        }),
      });
      
      setShowVoteModal(null);
      setVoteAmounts(prev => ({ ...prev, [proposalId]: '' }));
      
    } catch (error) {
      console.error('Voting failed:', error);
      toast.error('Voting failed. Please try again.');
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className=" mx-auto">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-8 mb-8">
          <motion.button
            variants={tabVariants}
            animate={activeTab === "active" ? "active" : "inactive"}
            onClick={() => setActiveTab("active")}
            className="pb-2 font-semibold border-b-2 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Active Proposals
          </motion.button>
          <motion.button
            variants={tabVariants}
            animate={activeTab === "all" ? "active" : "inactive"}
            onClick={() => setActiveTab("all")}
            className="pb-2 font-semibold border-b-2 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            All Proposals
          </motion.button>
        </div>

        {/* Proposals Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {currentProposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`${getStatusColor(
                      proposal.status
                    )} px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}
                  >
                    {getStatusIcon(proposal.status)}
                    <span>{proposal.status}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 text-white">
                  {proposal.title}
                </h3>

                {/* Token ID */}
                <div className="text-sm text-gray-400 mb-3">
                  Token ID:{" "}
                  <span className="text-white">{proposal.tokenId}</span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {proposal.description}
                  <span className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors">
                    Read More
                  </span>
                </p>

                {/* Ownership */}
                <div className="flex items-center space-x-2 mb-3 text-sm">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-gray-400">Requested Ownership:</span>
                  <span className="text-white font-semibold">
                    {proposal.ownership}
                  </span>
                </div>

                {/* Timeframe */}
                <div className="flex items-center space-x-2 mb-6 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-400">Project Timeframe:</span>
                  <span className="text-white text-xs">
                    {proposal.timeframe}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <GradientButton>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className=" flex items-center justify-center space-x-2"
                      disabled={proposal.status !== "Active"}
                    >
                      {/* <CheckCircle size={16} /> */}
                      <svg
                        width="18"
                        height="16"
                        viewBox="0 0 18 16"
                        fill="none"
                        size={16}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17 1.5L6 14.5L1 8.59091"
                          stroke="white"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>

                      <span>
                        {proposal.status === "Active"
                          ? "Vote"
                          : "Voting Closed"}
                      </span>
                    </motion.button>
                  </GradientButton>
                  <GradientButton 
                  className="border border-amber-500 "
                  gradientFrom = ""
                   gradientTo = "" >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className=""
                    >
                      View 3D Model
                    </motion.button>
                  </GradientButton>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <motion.div
          className="w-full bg-gray-700 rounded-full h-2 mb-4"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.div
            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: "30%" }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          >
            <div className="absolute left-0 w-8 h-8 bg-white rounded-full -top-3 flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProposalsSection;
