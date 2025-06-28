"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Users,
  FileText,
  MessageCircle,
  HelpCircle,
  Twitter,
  Facebook,
  Linkedin,
  Lock,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Charts from "./components/Charts";
import { 
  BalanceCards, 
  AccountSummary, 
  RecentActivity, 
  StakedNFTs, 
  PortfolioPerformance 
} from "./components/DashboardComponents";
import { useDashboardData } from "@/hooks/useDashboard";
import CustomConnectButton from "@/components/CustomConnectButton";
import ClientOnlyWrapper from "@/components/ClientOnlyWrapper";

// Main dashboard component that uses Wagmi hooks
function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { dashboardData, dashboardStats, isLoading, error, refetch } = useDashboardData();
  const [activeTab, setActiveTab] = useState("overview");
  // Handle wallet connection state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
          <Header />
        </div>
        <main className="py-28 px-4">
          <div className="max-w-4xl mx-auto text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Wallet className="w-16 h-16 text-orange-400 mx-auto" />
              <h1 className="text-4xl font-bold">Connect Your Wallet</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Connect your wallet to access your dashboard and view your staking rewards, 
                NFT portfolio, and recent activity.
              </p>
              <div className="pt-6">
                <CustomConnectButton />
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
        <Header />
      </div>

      {/* Main Content */}
      <main className="py-28 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400">
                  Track your balance, monitor investments, view staking rewards, and manage your digital real estate.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {error && (
                  <motion.button
                    onClick={refetch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Error - Retry
                  </motion.button>
                )}
                <motion.button
                  onClick={refetch}
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Balance Cards */}
          <div className="mb-8">
            <BalanceCards 
              balances={dashboardStats?.balances}
              staking={dashboardStats?.staking}
              isLoading={isLoading}
            />
          </div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex space-x-8 mb-6 border-b border-gray-800"
          >
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'staking', label: 'Staked NFTs', icon: Lock },
              { id: 'activity', label: 'Activity', icon: TrendingUp },
              { id: 'analytics', label: 'Analytics', icon: Users }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2 }}
                className={`pb-2 px-1 flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-orange-500 text-orange-500 font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Chart and Summary Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Chart - Takes up 2 columns */}
                  <div className="xl:col-span-2">
                    <Charts dashboardStats={dashboardStats} isLoading={isLoading} />
                  </div>
                  
                  {/* Account Summary */}
                  <AccountSummary 
                    address={address}
                    staking={dashboardStats?.staking}
                    proposals={dashboardStats?.proposals}
                    activity={dashboardStats?.activity}
                    isLoading={isLoading}
                  />
                </div>

                {/* Portfolio Performance */}
                <PortfolioPerformance isLoading={isLoading} />

                {/* Recent Activity and Staked NFTs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RecentActivity 
                    activity={dashboardStats?.activity}
                    isLoading={isLoading}
                  />
                  <StakedNFTs 
                    stakedNfts={dashboardData?.stakedNfts}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'staking' && (
              <motion.div
                key="staking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StakedNFTs 
                  stakedNfts={dashboardData?.stakedNfts}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RecentActivity 
                  activity={dashboardStats?.activity}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Charts dashboardStats={dashboardStats} isLoading={isLoading} />
                  <PortfolioPerformance isLoading={isLoading} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  <span className="text-white font-medium">Loading dashboard data...</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// SSR-safe Dashboard export
export default function Dashboard() {
  return (
    <ClientOnlyWrapper 
      fallback={
        <div className="min-h-screen bg-neutral-900 text-white">
          <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
            <Header />
          </div>
          <main className="py-28 px-4">
            <div className="max-w-4xl mx-auto text-center py-20">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse mx-auto"></div>
                <div className="h-8 bg-gray-700 rounded animate-pulse w-64 mx-auto"></div>
                <div className="h-4 bg-gray-700 rounded animate-pulse w-96 mx-auto"></div>
                <div className="h-10 bg-gray-700 rounded animate-pulse w-32 mx-auto"></div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <DashboardContent />
    </ClientOnlyWrapper>
  );
}
