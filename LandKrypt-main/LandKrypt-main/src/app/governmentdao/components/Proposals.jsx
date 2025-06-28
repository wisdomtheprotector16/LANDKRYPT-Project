"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clock, CheckCircle, Plus, Building2, FileText } from "lucide-react";
import { GradientButton } from "@/components/GradientButton";
import { useContractWriteCustom, useContractReadData, useWallet } from "../../../hooks/useContractInteraction";
import { NFTDAO_ABI, LANDKRYPT_STAKING_TOKEN_ABI, CONTRACT_ADDRESSES } from "../../../contracts/abis";
import { useProposalsList, useNftsReadyForProposals, useProposals } from "@/hooks/useProposals";
import { useDatabaseActions } from "@/hooks/useDatabaseActions";
import { toast } from "react-hot-toast";
import { parseAmount } from "../../../hooks/useContractInteraction";
import marketplaceData from "../../../../data/marketplace-listings.json";
import CreateProposalModal from "@/components/CreateProposalModal";

const ProposalsSection = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [voteAmounts, setVoteAmounts] = useState({});
  const [showVoteModal, setShowVoteModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(null);
  
  // Wagmi hooks
  const { address, isConnected } = useWallet();
  
  // Database hooks
  const { proposals: activeProposals, isLoading: loadingActive, refetch: refetchActive } = useProposalsList('active');
  const { proposals: allProposals, isLoading: loadingAll, refetch: refetchAll } = useProposalsList();
  const { nfts: nftsReadyForProposals, isLoading: loadingNfts, refetch: refetchNfts } = useNftsReadyForProposals();
  const { createProposal } = useProposals();
  const { recordVoteAction } = useDatabaseActions();
  
  // Get user's token balance for voting
  const { data: tokenBalance } = useContractReadData(
    CONTRACT_ADDRESSES.LANDKRYPT_STAKING_TOKEN,
    LANDKRYPT_STAKING_TOKEN_ABI,
    'balanceOf',
    [address]
  );
  
  // Vote transaction
  const { write: voteOnProposal, isLoading: isVoting } = useContractWriteCustom(
    CONTRACT_ADDRESSES.NFT_DAO,
    NFTDAO_ABI,
    'vote',
    showVoteModal ? [showVoteModal.id, parseAmount(voteAmounts[showVoteModal.id] || '0')] : []
  );

  // Get NFT details for display
  const getNftDetails = (nftId) => {
    return marketplaceData.find(item => item.id === nftId) || {
      id: nftId,
      title: `NFT Property #${nftId}`,
      description: 'Property details not available',
      image: '/images/nft-placeholder.jpg'
    };
  };

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

        {/* NFTs Ready for Proposals Section */}
        {nftsReadyForProposals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-6 h-6 text-orange-400" />
                NFTs Ready for Proposals
              </h3>
              <div className="text-sm text-gray-400">
                {nftsReadyForProposals.length} properties available
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nftsReadyForProposals.map((nft, index) => {
                const nftDetails = getNftDetails(nft.nft_id);
                return (
                  <motion.div
                    key={nft.nft_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all duration-300"
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">Owned by Staking Contract</span>
                      </div>
                      <h4 className="text-white font-semibold text-lg">{nftDetails.title}</h4>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">NFT ID:</span>
                        <span className="text-white font-medium">#{nft.nft_id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Staking Contract:</span>
                        <span className="text-white font-mono text-xs">
                          {nft.staking_contract?.slice(0, 6)}...{nft.staking_contract?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Purchased:</span>
                        <span className="text-white">
                          {new Date(nft.purchase_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <GradientButton
                      onClick={() => setShowCreateModal(nft)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Create Proposal</span>
                      </div>
                    </GradientButton>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* No NFTs Ready Message */}
        {!loadingNfts && nftsReadyForProposals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 p-8 bg-gray-800/50 rounded-xl border border-gray-700 text-center"
          >
            <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs Ready for Proposals</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              NFTs need to be purchased by staking contracts before proposals can be created. 
              Check back later or help fund existing properties to make them proposal-ready.
            </p>
          </motion.div>
        )}
        
        {/* Create Proposal Modal */}
        <CreateProposalModal
          isOpen={!!showCreateModal}
          onClose={() => setShowCreateModal(null)}
          nft={showCreateModal}
          nftDetails={showCreateModal ? getNftDetails(showCreateModal.nft_id) : null}
          onSuccess={(proposal) => {
            // Refresh proposals and NFTs ready for proposals
            refetchActive();
            refetchAll();
            refetchNfts();
            toast.success('Proposal created successfully!');
          }}
        />
      </div>
    </div>
  );
};

export default ProposalsSection;
