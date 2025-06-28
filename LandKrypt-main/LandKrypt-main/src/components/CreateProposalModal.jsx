// Create Proposal Modal Component
"use client";

import React, { useState } from 'react';
import { X, Building2, Users, Calendar, FileText, Target, Clock } from 'lucide-react';
import { GradientButton } from '@/components/GradientButton';
import { useProposals } from '@/hooks/useProposals';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { convertIpfsToHttp } from '@/utils/ipfs';
import marketplaceData from '../../data/marketplace-listings.json';

export default function CreateProposalModal({ 
  isOpen, 
  onClose, 
  nft, 
  nftDetails,
  onSuccess 
}) {
  const { address, isConnected } = useAccount();
  const { createProposal, isLoading } = useProposals();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ownershipPercentage: '',
    timeframe: '',
    votingDeadline: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.ownershipPercentage || 
        isNaN(formData.ownershipPercentage) || 
        formData.ownershipPercentage < 1 || 
        formData.ownershipPercentage > 100) {
      newErrors.ownershipPercentage = 'Ownership percentage must be between 1-100';
    }

    if (!formData.timeframe.trim()) {
      newErrors.timeframe = 'Timeframe is required';
    }

    if (!formData.votingDeadline) {
      newErrors.votingDeadline = 'Voting deadline is required';
    } else {
      const deadlineDate = new Date(formData.votingDeadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.votingDeadline = 'Voting deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      // In a real implementation, you would create a blockchain transaction first
      // For now, we'll use a mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Get NFT image URI from metadata or processed image
      let nftImageUri = null;
      if (nftDetails?.processedImageUrl) {
        nftImageUri = nftDetails.processedImageUrl;
      } else if (nftDetails?.tokenURI) {
        // Try to convert IPFS URI
        nftImageUri = convertIpfsToHttp(nftDetails.tokenURI);
      } else if (nftDetails?.image) {
        nftImageUri = nftDetails.image;
      }

      // Enhanced proposal creation with full NFT details
      const proposal = await createProposal({
        nftId: nft.nft_id,
        title: formData.title,
        description: formData.description,
        ownershipPercentage: parseFloat(formData.ownershipPercentage),
        timeframe: formData.timeframe,
        votingDeadline: formData.votingDeadline,
        txHash: mockTxHash,
        nftImageUri: nftImageUri,
        nftTitle: nftDetails?.title,
        nftLocation: nftDetails?.location,
        stakingContract: nft.staking_contract,
        metadata: {
          nftDetails: {
            id: nft.nft_id,
            title: nftDetails?.title,
            location: nftDetails?.location,
            category: nftDetails?.category,
            tag: nftDetails?.tag,
            description: nftDetails?.description,
            originalPrice: nftDetails?.originalPrice,
            tokenURI: nftDetails?.tokenURI,
            tokenUrl: nftDetails?.tokenUrl,
            image: nftDetails?.image,
            processedImageUrl: nftDetails?.processedImageUrl
          },
          proposalDetails: {
            title: formData.title,
            description: formData.description,
            ownershipPercentage: parseFloat(formData.ownershipPercentage),
            timeframe: formData.timeframe,
            votingDeadline: formData.votingDeadline
          },
          stakingInfo: {
            stakingContract: nft.staking_contract,
            purchaseTimestamp: nft.purchase_timestamp,
            purchaseTxHash: nft.purchase_tx_hash
          },
          createdVia: 'dao-interface',
          timestamp: new Date().toISOString()
        }
      });

      toast.success('Proposal created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        ownershipPercentage: '',
        timeframe: '',
        votingDeadline: ''
      });
      
      if (onSuccess) {
        onSuccess(proposal);
      }
      
      onClose();

    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error(error.message || 'Failed to create proposal');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ownershipPercentage: '',
      timeframe: '',
      votingDeadline: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !nft) return null;

  // Get minimum date for voting deadline (at least 24 hours from now)
  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDeadlineString = minDeadline.toISOString().slice(0, 16);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Proposal</h2>
                <p className="text-gray-400 text-sm">NFT #{nft.nft_id} - {nftDetails?.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* NFT Info Card */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">NFT Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">NFT ID:</span>
                <span className="text-white ml-2">#{nft.nft_id}</span>
              </div>
              <div>
                <span className="text-gray-400">Staking Contract:</span>
                <span className="text-white ml-2 font-mono text-xs">
                  {nft.staking_contract?.slice(0, 6)}...{nft.staking_contract?.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Proposal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Sustainable Development for Property #1"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.title 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                }`}
                maxLength={200}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your proposal in detail. Include goals, implementation plan, and expected outcomes..."
                rows={4}
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                  errors.description 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                }`}
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Ownership Percentage */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Requested Ownership Percentage *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.ownershipPercentage}
                  onChange={(e) => handleInputChange('ownershipPercentage', e.target.value)}
                  placeholder="25"
                  min="1"
                  max="100"
                  className={`w-full bg-gray-800 border rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.ownershipPercentage 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              {errors.ownershipPercentage && (
                <p className="text-red-400 text-sm mt-1">{errors.ownershipPercentage}</p>
              )}
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Project Timeframe *
              </label>
              <input
                type="text"
                value={formData.timeframe}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
                placeholder="e.g., 6 months, Q2 2025, 180 days"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.timeframe 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                }`}
              />
              {errors.timeframe && (
                <p className="text-red-400 text-sm mt-1">{errors.timeframe}</p>
              )}
            </div>

            {/* Voting Deadline */}
            <div>
              <label className="block text-white font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Voting Deadline *
              </label>
              <input
                type="datetime-local"
                value={formData.votingDeadline}
                onChange={(e) => handleInputChange('votingDeadline', e.target.value)}
                min={minDeadlineString}
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.votingDeadline 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                }`}
              />
              {errors.votingDeadline && (
                <p className="text-red-400 text-sm mt-1">{errors.votingDeadline}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <GradientButton
                type="submit"
                className="flex-1"
                disabled={isLoading || !isConnected}
              >
                {isLoading ? 'Creating...' : 'Create Proposal'}
              </GradientButton>
            </div>
          </form>

          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Please connect your wallet to create proposals.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
