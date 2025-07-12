// Responsive Dashboard Component
// Real-time dashboard with mobile-first responsive design

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  CubeIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  TrendingUpIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

import ResponsiveLayout, { useResponsive } from '../layout/ResponsiveLayout';
import { 
  Card, 
  StatsCard, 
  ResponsiveGrid, 
  ListCard, 
  ChartCard, 
  TableCard,
  ActionButton 
} from '../ui/ResponsiveCard';
import { useNFTSync } from '../../hooks/data/useNFTSync';

// Mock data for demonstration
const mockMarketData = {
  totalVolume: '$2.4M',
  totalNFTs: 1247,
  activeUsers: 892,
  avgPrice: '$1,850'
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'mint',
    user: '0x1234...5678',
    nft: 'Lagos Villa #123',
    value: '$450,000',
    time: '2 minutes ago'
  },
  {
    id: 2,
    type: 'sale',
    user: '0x8765...4321',
    nft: 'Abuja Office #45',
    value: '$1,200,000',
    time: '15 minutes ago'
  },
  {
    id: 3,
    type: 'list',
    user: '0x9876...1234',
    nft: 'Port Harcourt Land #67',
    value: '$75,000',
    time: '1 hour ago'
  }
];

function DashboardStats({ userNFTs, loading }) {
  const { isMobile } = useResponsive();
  
  const userStats = {
    ownedNFTs: userNFTs.length,
    totalValue: userNFTs.reduce((sum, nft) => sum + (nft.estimatedValue || 0), 0),
    listedNFTs: userNFTs.filter(nft => nft.isListed).length,
    stakingRewards: userNFTs.reduce((sum, nft) => sum + (nft.stakingMultiplier || 0), 0) * 100
  };

  const statsConfig = [
    {
      title: 'My NFTs',
      value: userStats.ownedNFTs.toString(),
      change: '+2 this week',
      changeType: 'positive',
      icon: CubeIcon
    },
    {
      title: 'Portfolio Value',
      value: `$${(userStats.totalValue / 1000000).toFixed(1)}M`,
      change: '+12.5% this month',
      changeType: 'positive',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Listed Items',
      value: userStats.listedNFTs.toString(),
      change: `${userStats.listedNFTs} active`,
      changeType: 'neutral',
      icon: ChartBarIcon
    },
    {
      title: 'Staking Rewards',
      value: `${userStats.stakingRewards.toFixed(0)}%`,
      change: '+5.2% APY',
      changeType: 'positive',
      icon: TrendingUpIcon
    }
  ];

  return (
    <ResponsiveGrid 
      cols={{ xs: 1, sm: 2, lg: 4 }}
      gap={isMobile ? 'sm' : 'default'}
    >
      {statsConfig.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          loading={loading}
        />
      ))}
    </ResponsiveGrid>
  );
}

function RecentActivity({ loading }) {
  const { isMobile } = useResponsive();

  const renderActivityItem = (activity) => (
    <div className="flex items-center space-x-3">
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${activity.type === 'mint' ? 'bg-green-100 text-green-600' : ''}
        ${activity.type === 'sale' ? 'bg-blue-100 text-blue-600' : ''}
        ${activity.type === 'list' ? 'bg-yellow-100 text-yellow-600' : ''}
      `}>
        {activity.type === 'mint' && '🎨'}
        {activity.type === 'sale' && '💰'}
        {activity.type === 'list' && '📋'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`
            font-medium text-gray-900 dark:text-white truncate
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            {activity.nft}
          </p>
          <span className={`
            font-semibold text-gray-900 dark:text-white
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            {activity.value}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`
            text-gray-500 dark:text-gray-400 truncate
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {activity.user}
          </p>
          <span className={`
            text-gray-500 dark:text-gray-400
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {activity.time}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <ListCard
      title="Recent Activity"
      items={mockRecentActivity}
      renderItem={renderActivityItem}
      loading={loading}
      maxHeight="96"
    />
  );
}

function MyNFTsTable({ nfts, loading }) {
  const { isMobile } = useResponsive();

  const headers = ['NFT', 'Location', 'Value', 'Status'];

  const renderRow = (nft, index, isMobileView) => {
    if (isMobileView) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {nft.metadata?.name || `NFT #${nft.token_id}`}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${(nft.estimatedValue || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{nft.location}</span>
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${nft.isListed 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }
            `}>
              {nft.isListed ? 'Listed' : 'Owned'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  #{nft.token_id}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {nft.metadata?.name || `NFT #${nft.token_id}`}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {nft.propertyType}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {nft.location}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          ${(nft.estimatedValue || 0).toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`
            inline-flex px-2 py-1 text-xs font-semibold rounded-full
            ${nft.isListed 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }
          `}>
            {nft.isListed ? 'Listed' : 'Owned'}
          </span>
        </td>
      </>
    );
  };

  return (
    <TableCard
      title="My NFTs"
      headers={headers}
      data={nfts.slice(0, 5)} // Show only first 5
      renderRow={renderRow}
      loading={loading}
      emptyMessage="No NFTs found. Start by minting your first property!"
    />
  );
}

function MarketOverview({ loading }) {
  const { isMobile } = useResponsive();

  const marketStats = [
    {
      title: 'Total Volume',
      value: mockMarketData.totalVolume,
      change: '+15.3% vs last month',
      changeType: 'positive',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Total NFTs',
      value: mockMarketData.totalNFTs.toLocaleString(),
      change: '+47 this week',
      changeType: 'positive',
      icon: CubeIcon
    },
    {
      title: 'Active Users',
      value: mockMarketData.activeUsers.toLocaleString(),
      change: '+8.2% growth',
      changeType: 'positive',
      icon: UserGroupIcon
    },
    {
      title: 'Avg. Price',
      value: mockMarketData.avgPrice,
      change: '+5.7% this month',
      changeType: 'positive',
      icon: TrendingUpIcon
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`
          font-bold text-gray-900 dark:text-white
          ${isMobile ? 'text-lg' : 'text-xl'}
        `}>
          Market Overview
        </h2>
        <ActionButton size="sm" variant="ghost">
          View All
        </ActionButton>
      </div>
      
      <ResponsiveGrid 
        cols={{ xs: 2, sm: 2, lg: 4 }}
        gap={isMobile ? 'sm' : 'default'}
      >
        {marketStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            loading={loading}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
}

export default function ResponsiveDashboard() {
  const { address } = useAccount();
  const { nfts, loading, error, lastSync, syncUserNFTs } = useNFTSync();
  const { isMobile } = useResponsive();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncUserNFTs();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const userNFTs = address ? nfts.filter(nft => 
    nft.owner_address?.toLowerCase() === address.toLowerCase()
  ) : [];

  return (
    <ResponsiveLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`
              font-bold text-gray-900 dark:text-white
              ${isMobile ? 'text-xl' : 'text-2xl'}
            `}>
              Welcome back!
            </h1>
            <p className={`
              text-gray-600 dark:text-gray-400
              ${isMobile ? 'text-sm' : 'text-base'}
            `}>
              {address ? 'Here\'s your portfolio overview' : 'Connect your wallet to get started'}
            </p>
          </div>
          
          {lastSync && (
            <div className="flex items-center space-x-2">
              <ActionButton 
                size="sm" 
                variant="ghost" 
                onClick={handleRefresh}
                loading={refreshing}
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                {isMobile ? 'Sync' : 'Refresh'}
              </ActionButton>
              {!isMobile && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card>
            <div className="text-center py-4">
              <p className="text-red-600 dark:text-red-400">
                Error loading data: {error}
              </p>
              <ActionButton 
                size="sm" 
                variant="primary" 
                onClick={handleRefresh}
                className="mt-2"
              >
                Retry
              </ActionButton>
            </div>
          </Card>
        )}

        {/* User Stats */}
        {address && (
          <div className="space-y-4">
            <h2 className={`
              font-semibold text-gray-900 dark:text-white
              ${isMobile ? 'text-base' : 'text-lg'}
            `}>
              Your Portfolio
            </h2>
            <DashboardStats userNFTs={userNFTs} loading={loading} />
          </div>
        )}

        {/* Main Content Grid */}
        <ResponsiveGrid 
          cols={{ xs: 1, lg: 2 }}
          gap={isMobile ? 'sm' : 'lg'}
        >
          {/* User NFTs Table */}
          {address && (
            <div className="lg:col-span-2">
              <MyNFTsTable nfts={userNFTs} loading={loading} />
            </div>
          )}

          {/* Recent Activity */}
          <RecentActivity loading={loading} />

          {/* Quick Actions */}
          <Card>
            <div className="space-y-4">
              <h3 className={`
                font-semibold text-gray-900 dark:text-white
                ${isMobile ? 'text-base' : 'text-lg'}
              `}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <ActionButton variant="primary">
                  Mint New NFT
                </ActionButton>
                <ActionButton variant="secondary">
                  Browse Marketplace
                </ActionButton>
                <ActionButton variant="secondary">
                  Start Staking
                </ActionButton>
              </div>
            </div>
          </Card>
        </ResponsiveGrid>

        {/* Market Overview */}
        <MarketOverview loading={loading} />
      </div>
    </ResponsiveLayout>
  );
}
