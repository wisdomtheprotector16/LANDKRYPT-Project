"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, Users, Activity, Clock, ExternalLink,
  Building2, Award, Target, BarChart3, DollarSign, Zap,
  ArrowUpRight, ArrowDownRight, Calendar, MapPin, Eye
} from 'lucide-react';

// Balance Cards Component
export function BalanceCards({ balances, staking, isLoading }) {
  const cards = [
    {
      title: "LKST BALANCE",
      value: balances?.lkst || "0.00",
      icon: Wallet,
      gradient: "from-blue-500 to-blue-600",
      description: "Governance tokens for voting on proposals"
    },
    {
      title: "LKUSD BALANCE", 
      value: balances?.lkusd || "0.00",
      icon: DollarSign,
      gradient: "from-orange-400 to-orange-500",
      description: "Available for staking and transactions"
    },
    {
      title: "TOTAL STAKED",
      value: `${staking?.totalStaked || "0"} LKUSD`,
      icon: Target,
      gradient: "from-pink-500 to-pink-600",
      description: `Across ${staking?.uniqueNfts || 0} different land NFTs`
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-2xl animate-pulse">
            <div className="h-10 w-10 bg-gray-700 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-700 rounded mb-3"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium opacity-80 mb-1 tracking-wide">
              {card.title}
            </div>
            <div className="text-4xl font-bold mb-3">{card.value}</div>
            <div className="text-xs opacity-70 leading-tight">
              {card.description}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        </motion.div>
      ))}
    </div>
  );
}

// Account Summary Component
export function AccountSummary({ address, staking, proposals, activity, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl">
        <div className="h-6 bg-gray-700 rounded mb-4 w-32"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const summaryItems = [
    { label: "Account", value: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected" },
    { label: "Total Staked", value: `${staking?.totalStaked || "0"} LKUSD` },
    { label: "Total Rewards", value: `${staking?.totalRewards || "0"} LKUSD` },
    { label: "Staked NFTs", value: staking?.uniqueNfts || "0" },
    { label: "Annual Yield", value: `${staking?.apy || "0.00"}%` },
    { label: "Proposals Created", value: proposals?.total || "0" },
    { label: "Total Actions", value: activity?.totalActions || "0" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-800 p-6 rounded-xl border border-gray-700"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-orange-400" />
        Account Summary
      </h3>

      <div className="space-y-4">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-b-0"
          >
            <span className="text-gray-400">{item.label}</span>
            <span className="text-white font-medium">{item.value}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 py-3 px-4 rounded-lg font-medium mt-6 transition-all duration-300"
      >
        View All NFTs
      </motion.button>
    </motion.div>
  );
}

// Recent Activity Component
export function RecentActivity({ activity, isLoading }) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl">
        <div className="h-6 bg-gray-700 rounded mb-4 w-32"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentActivity = activity?.recentActivity || [];
  const displayActivity = showAll ? recentActivity : recentActivity.slice(0, 5);

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'stake':
        return { icon: Zap, color: 'text-green-400', bg: 'bg-green-400/20' };
      case 'unstake':
        return { icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-400/20' };
      case 'vote':
        return { icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/20' };
      case 'proposal_create':
        return { icon: Building2, color: 'text-purple-400', bg: 'bg-purple-400/20' };
      default:
        return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-400/20' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 p-6 rounded-xl border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          Recent Activity
        </h3>
        {recentActivity.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            {showAll ? 'Show Less' : `View All (${recentActivity.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayActivity.map((action, index) => {
            const { icon: Icon, color, bg } = getActionIcon(action.action_type);
            
            return (
              <motion.div
                key={action.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium capitalize">
                    {action.action_type.replace('_', ' ')}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    NFT #{action.nft_id} • {action.formattedDate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {action.formattedAmount} LKUSD
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(action.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {recentActivity.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No recent activity</p>
          <p className="text-gray-500 text-sm">Start staking to see your activity here</p>
        </div>
      )}
    </motion.div>
  );
}

// Staked NFTs Component
export function StakedNFTs({ stakedNfts, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl">
        <div className="h-6 bg-gray-700 rounded mb-4 w-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-700 p-4 rounded-lg">
              <div className="h-32 bg-gray-600 rounded mb-3"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 p-6 rounded-xl border border-gray-700"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-orange-400" />
        Staked NFTs ({stakedNfts?.length || 0})
      </h3>

      {stakedNfts && stakedNfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakedNfts.slice(0, 4).map((nft, index) => (
            <motion.div
              key={nft.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">NFT #{nft.nft_id}</div>
                  <div className="text-gray-400 text-sm">
                    Staked: {parseFloat(nft.amount || 0).toLocaleString()} LKUSD
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rewards Earned:</span>
                  <span className="text-green-400 font-medium">
                    {parseFloat(nft.rewards_earned || 0).toFixed(2)} LKUSD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Started:</span>
                  <span className="text-white">
                    {new Date(nft.start_timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${nft.is_active ? 'text-green-400' : 'text-gray-400'}`}>
                    {nft.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-gray-600 hover:bg-orange-500/20 hover:border-orange-500 border border-gray-500 py-2 rounded-lg text-sm font-medium transition-all duration-300 group-hover:bg-orange-500/10">
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No staked NFTs</p>
          <p className="text-gray-500 text-sm mb-4">Visit the marketplace to start staking</p>
          <button className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-medium transition-colors">
            Browse Marketplace
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Portfolio Performance Component
export function PortfolioPerformance({ performance, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl">
        <div className="h-6 bg-gray-700 rounded mb-4 w-40"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const performanceMetrics = [
    {
      label: "24h Change",
      value: "+$245.67",
      change: "+2.34%",
      positive: true,
      icon: TrendingUp
    },
    {
      label: "7d Change", 
      value: "+$1,234.56",
      change: "+8.91%", 
      positive: true,
      icon: ArrowUpRight
    },
    {
      label: "Total Return",
      value: "$5,678.90",
      change: "+15.67%",
      positive: true,
      icon: Award
    },
    {
      label: "Best NFT",
      value: "NFT #3",
      change: "+25.43%",
      positive: true,
      icon: Building2
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 p-6 rounded-xl border border-gray-700"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-400" />
        Portfolio Performance
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-4 bg-gray-700/30 rounded-lg border border-gray-600"
          >
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <metric.icon className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-gray-400 text-xs mb-1">{metric.label}</div>
            <div className="text-white font-bold text-lg">{metric.value}</div>
            <div className={`text-xs font-medium ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
              {metric.change}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
