// Real-time Transaction Monitor Component
// Monitors contract interactions and updates database in real-time

'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { useContractDatabase } from '../hooks/useContractDatabase';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Contract ABIs (simplified for events)
const NFT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'approved', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  }
];

const STAKING_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'stakingPower', type: 'uint256' }
    ],
    name: 'NFTStaked',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'rewards', type: 'uint256' }
    ],
    name: 'NFTUnstaked',
    type: 'event'
  }
];

const MARKETPLACE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' }
    ],
    name: 'ItemListed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' }
    ],
    name: 'ItemSold',
    type: 'event'
  }
];

const GOVERNANCE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'voter', type: 'address' },
      { indexed: false, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'support', type: 'bool' },
      { indexed: false, name: 'weight', type: 'uint256' }
    ],
    name: 'VoteCast',
    type: 'event'
  }
];

export default function TransactionMonitor() {
  const { address } = useAccount();
  const {
    handleNFTMint,
    handleNFTTransfer,
    handleNFTStaking,
    handleNFTUnstaking,
    handleMarketplaceListing,
    handleMarketplacePurchase,
    handleGovernanceVote
  } = useContractDatabase();

  const [monitoringStatus, setMonitoringStatus] = useState({
    nft: false,
    staking: false,
    marketplace: false,
    governance: false
  });

  const [recentEvents, setRecentEvents] = useState([]);

  // Add event to recent events list
  const addRecentEvent = (eventType, details) => {
    const event = {
      id: Date.now(),
      type: eventType,
      details,
      timestamp: new Date().toISOString(),
      status: 'processing'
    };
    
    setRecentEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    
    // Update status after processing
    setTimeout(() => {
      setRecentEvents(prev => 
        prev.map(e => e.id === event.id ? { ...e, status: 'completed' } : e)
      );
    }, 2000);
  };

  // NFT Transfer Event Monitoring
  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
    abi: NFT_ABI,
    eventName: 'Transfer',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { from, to, tokenId } = log.args;
          const txHash = log.transactionHash;
          
          console.log('NFT Transfer detected:', { from, to, tokenId, txHash });
          
          if (from === '0x0000000000000000000000000000000000000000') {
            // This is a mint
            await handleNFTMint(txHash, tokenId, to, '');
            addRecentEvent('NFT_MINT', { tokenId: tokenId.toString(), to });
            toast.success(`NFT #${tokenId} minted successfully!`);
          } else {
            // This is a transfer
            await handleNFTTransfer(txHash, tokenId, from, to);
            addRecentEvent('NFT_TRANSFER', { tokenId: tokenId.toString(), from, to });
            
            if (to.toLowerCase() === address?.toLowerCase()) {
              toast.success(`You received NFT #${tokenId}!`);
            } else if (from.toLowerCase() === address?.toLowerCase()) {
              toast.success(`NFT #${tokenId} transferred successfully!`);
            }
          }
          
          setMonitoringStatus(prev => ({ ...prev, nft: true }));
        } catch (error) {
          console.error('Error handling NFT Transfer event:', error);
          toast.error('Failed to record NFT transfer');
        }
      }
    }
  });

  // NFT Approval Event Monitoring
  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
    abi: NFT_ABI,
    eventName: 'Approval',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { owner, approved, tokenId } = log.args;
          const txHash = log.transactionHash;
          
          console.log('NFT Approval detected:', { owner, approved, tokenId, txHash });
          
          addRecentEvent('NFT_APPROVAL', { tokenId: tokenId.toString(), owner, approved });
          
          if (owner.toLowerCase() === address?.toLowerCase()) {
            toast.success(`NFT #${tokenId} approved for ${approved.slice(0, 6)}...`);
          }
        } catch (error) {
          console.error('Error handling NFT Approval event:', error);
        }
      }
    }
  });

  // Staking Events Monitoring
  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_ADVANCED_STAKING,
    abi: STAKING_ABI,
    eventName: 'NFTStaked',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { user, tokenId, stakingPower } = log.args;
          const txHash = log.transactionHash;
          
          console.log('NFT Staked detected:', { user, tokenId, stakingPower, txHash });
          
          await handleNFTStaking(txHash, tokenId, stakingPower);
          addRecentEvent('NFT_STAKED', { tokenId: tokenId.toString(), user, stakingPower: stakingPower.toString() });
          
          if (user.toLowerCase() === address?.toLowerCase()) {
            toast.success(`NFT #${tokenId} staked successfully!`);
          }
          
          setMonitoringStatus(prev => ({ ...prev, staking: true }));
        } catch (error) {
          console.error('Error handling NFT Staked event:', error);
          toast.error('Failed to record NFT staking');
        }
      }
    }
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_ADVANCED_STAKING,
    abi: STAKING_ABI,
    eventName: 'NFTUnstaked',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { user, tokenId, rewards } = log.args;
          const txHash = log.transactionHash;
          
          console.log('NFT Unstaked detected:', { user, tokenId, rewards, txHash });
          
          await handleNFTUnstaking(txHash, tokenId, rewards);
          addRecentEvent('NFT_UNSTAKED', { tokenId: tokenId.toString(), user, rewards: rewards.toString() });
          
          if (user.toLowerCase() === address?.toLowerCase()) {
            toast.success(`NFT #${tokenId} unstaked! Rewards: ${rewards.toString()}`);
          }
        } catch (error) {
          console.error('Error handling NFT Unstaked event:', error);
          toast.error('Failed to record NFT unstaking');
        }
      }
    }
  });

  // Marketplace Events Monitoring
  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
    abi: MARKETPLACE_ABI,
    eventName: 'ItemListed',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { seller, nftContract, tokenId, price } = log.args;
          const txHash = log.transactionHash;
          
          console.log('Item Listed detected:', { seller, nftContract, tokenId, price, txHash });
          
          await handleMarketplaceListing(txHash, tokenId, price);
          addRecentEvent('ITEM_LISTED', { tokenId: tokenId.toString(), seller, price: price.toString() });
          
          if (seller.toLowerCase() === address?.toLowerCase()) {
            toast.success(`NFT #${tokenId} listed for sale!`);
          }
          
          setMonitoringStatus(prev => ({ ...prev, marketplace: true }));
        } catch (error) {
          console.error('Error handling Item Listed event:', error);
          toast.error('Failed to record marketplace listing');
        }
      }
    }
  });

  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
    abi: MARKETPLACE_ABI,
    eventName: 'ItemSold',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { seller, buyer, nftContract, tokenId, price } = log.args;
          const txHash = log.transactionHash;
          
          console.log('Item Sold detected:', { seller, buyer, nftContract, tokenId, price, txHash });
          
          await handleMarketplacePurchase(txHash, tokenId, seller, buyer, price);
          addRecentEvent('ITEM_SOLD', { tokenId: tokenId.toString(), seller, buyer, price: price.toString() });
          
          if (buyer.toLowerCase() === address?.toLowerCase()) {
            toast.success(`You purchased NFT #${tokenId}!`);
          } else if (seller.toLowerCase() === address?.toLowerCase()) {
            toast.success(`Your NFT #${tokenId} was sold!`);
          }
        } catch (error) {
          console.error('Error handling Item Sold event:', error);
          toast.error('Failed to record marketplace sale');
        }
      }
    }
  });

  // Governance Events Monitoring
  useWatchContractEvent({
    address: process.env.NEXT_PUBLIC_QUADRATIC_GOVERNANCE,
    abi: GOVERNANCE_ABI,
    eventName: 'VoteCast',
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const { voter, proposalId, support, weight } = log.args;
          const txHash = log.transactionHash;
          
          console.log('Vote Cast detected:', { voter, proposalId, support, weight, txHash });
          
          await handleGovernanceVote(txHash, proposalId, support, weight);
          addRecentEvent('VOTE_CAST', { proposalId: proposalId.toString(), voter, support, weight: weight.toString() });
          
          if (voter.toLowerCase() === address?.toLowerCase()) {
            toast.success(`Vote cast on proposal #${proposalId}!`);
          }
          
          setMonitoringStatus(prev => ({ ...prev, governance: true }));
        } catch (error) {
          console.error('Error handling Vote Cast event:', error);
          toast.error('Failed to record governance vote');
        }
      }
    }
  });

  // Event type display names and colors
  const getEventDisplay = (type) => {
    const displays = {
      NFT_MINT: { name: 'NFT Minted', color: 'text-green-600', bg: 'bg-green-50' },
      NFT_TRANSFER: { name: 'NFT Transferred', color: 'text-blue-600', bg: 'bg-blue-50' },
      NFT_APPROVAL: { name: 'NFT Approved', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      NFT_STAKED: { name: 'NFT Staked', color: 'text-purple-600', bg: 'bg-purple-50' },
      NFT_UNSTAKED: { name: 'NFT Unstaked', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      ITEM_LISTED: { name: 'Item Listed', color: 'text-orange-600', bg: 'bg-orange-50' },
      ITEM_SOLD: { name: 'Item Sold', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      VOTE_CAST: { name: 'Vote Cast', color: 'text-pink-600', bg: 'bg-pink-50' }
    };
    return displays[type] || { name: type, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  if (!address) {
    return null; // Don't show monitor when wallet not connected
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Transaction Monitor
        </h3>
        <p className="text-sm text-gray-600">Real-time contract interaction tracking</p>
      </div>

      {/* Monitoring Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(monitoringStatus).map(([contract, active]) => (
            <div key={contract} className="flex items-center">
              {active ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 text-gray-400 mr-1" />
              )}
              <span className={active ? 'text-green-600' : 'text-gray-500'}>
                {contract.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="max-h-64 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No recent events
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {recentEvents.map((event) => {
              const display = getEventDisplay(event.type);
              return (
                <div
                  key={event.id}
                  className={`p-2 rounded-md ${display.bg} border border-gray-200`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${display.color}`}>
                      {display.name}
                    </span>
                    <div className="flex items-center">
                      {event.status === 'processing' ? (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
