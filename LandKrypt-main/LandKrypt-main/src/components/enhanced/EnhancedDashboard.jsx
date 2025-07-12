// Enhanced Dashboard Component
// Comprehensive dashboard showcasing all upgraded contract features

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  useMockEnhancedLandKrypt,
  useMockEnhancedTierSystem
} from '../../hooks/useMockEnhancedSystem';
import { useContractDatabase } from '../../hooks/useContractDatabase';
import { useAccount } from 'wagmi';
import { 
  Wallet, 
  TrendingUp, 
  Zap, 
  Star, 
  DollarSign, 
  Gavel, 
  Lock, 
  Vote, 
  Gift,
  Activity,
  BarChart3,
  Sparkles,
  Trophy,
  Target,
  Clock,
  Users,
  Percent,
  ArrowUp,
  ArrowDown,
  Eye,
  Heart,
  Database,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import TransactionMonitor from '../TransactionMonitor';
import LandDocumentVerification from '../LandDocumentVerification';
import AdminDashboard from '../AdminDashboard';
import DailyLoginBonus from '../tier/DailyLoginBonus';
import { useAdminAccess } from '../../hooks/useAdminAccess';

export default function EnhancedDashboard() {
  const { address } = useAccount();
  const { isAdmin } = useAdminAccess();
  const { nft, marketplace, staking, tier, capabilities, isLoading } = useMockEnhancedLandKrypt();
  const {
    userActions,
    nftOwnership,
    stakingData,
    marketplaceListings,
    governanceVotes,
    isLoading: dbLoading,
    refreshUserData
  } = useContractDatabase();
  const {
    totalXP,
    currentTier,
    tierProgress,
    nftsOwned,
    totalStaked,
    marketplaceTransactions,
    governanceParticipation,
    gasSaved,
    milestoneProgress,
    tierBenefits,
    showAnimation,
    newXP,
  } = useMockEnhancedTierSystem();

  const [dashboardStats, setDashboardStats] = useState({
    totalValue: 0,
    weeklyGrowth: 0,
    activeListings: 0,
    pendingRewards: 0,
    votingPower: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    setDashboardStats({
      totalValue: 12.5, // ETH
      weeklyGrowth: 8.3, // %
      activeListings: 3,
      pendingRewards: 45.2, // LKST
      votingPower: 1250,
    });

    setRecentActivity([
      {
        id: 1,
        type: 'mint',
        description: 'Minted Lagos Villa #123',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        value: '2.5 ETH',
        xp: 100,
      },
      {
        id: 2,
        type: 'auction',
        description: 'Created Dutch auction',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        value: '3.0 → 1.5 ETH',
        xp: 125,
      },
      {
        id: 3,
        type: 'stake',
        description: 'Staked 500 LKST tokens',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        value: '500 LKST',
        xp: 25,
      },
      {
        id: 4,
        type: 'vote',
        description: 'Voted on Proposal #15',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        value: '1,250 power',
        xp: 50,
      },
    ]);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'mint': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'auction': return <Gavel className="w-4 h-4 text-orange-500" />;
      case 'stake': return <Lock className="w-4 h-4 text-green-500" />;
      case 'vote': return <Vote className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const completedMilestones = Object.values(milestoneProgress || {}).filter(m => m.completed).length;
  const totalMilestones = Object.keys(milestoneProgress || {}).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with XP Animation */}
      <div className="relative">
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Enhanced Dashboard</h1>
                <p className="text-purple-100">
                  Welcome to your upgraded LandKrypt experience
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white text-purple-600 font-semibold">
                    <Star className="w-3 h-3 mr-1" />
                    Tier {currentTier}
                  </Badge>
                  <Badge className="bg-purple-500 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Enhanced
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{totalXP.toLocaleString()} XP</div>
              </div>
            </div>
            
            {/* Tier Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Tier Progress</span>
                <span>{tierProgress}%</span>
              </div>
              <Progress value={tierProgress} className="bg-purple-400" />
            </div>
          </CardContent>
        </Card>

        {/* XP Animation */}
        {showAnimation && newXP > 0 && (
          <div className="absolute top-4 right-4 animate-bounce">
            <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
              +{newXP} XP
            </Badge>
          </div>
        )}
      </div>

      {/* Database Integration Status */}
      {address && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-green-800">
              <Database className="w-5 h-5 mr-2" />
              Real-time Database Integration
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshUserData}
                disabled={dbLoading}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <RefreshCw className={`w-4 h-4 ${dbLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userActions.length}</div>
                <div className="text-sm text-green-700">Total Actions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{nftOwnership.length}</div>
                <div className="text-sm text-blue-700">NFTs Owned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stakingData.filter(s => s.is_active).length}</div>
                <div className="text-sm text-purple-700">Active Stakes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{marketplaceListings.filter(l => l.is_active).length}</div>
                <div className="text-sm text-orange-700">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{governanceVotes.length}</div>
                <div className="text-sm text-pink-700">Votes Cast</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              All contract interactions are automatically recorded
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold">{dashboardStats.totalValue} ETH</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <ArrowUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+{dashboardStats.weeklyGrowth}%</span>
              <span className="text-gray-500">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">NFTs Owned</p>
                <p className="text-2xl font-bold">{nftsOwned}</p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {capabilities.batchMinting ? 'Batch Enabled' : 'Single Only'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold">{dashboardStats.activeListings}</p>
              </div>
              <Gavel className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {capabilities.auctions ? 'Auctions Available' : 'Fixed Price Only'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staked Value</p>
                <p className="text-2xl font-bold">{totalStaked.toFixed(1)} LKST</p>
              </div>
              <Lock className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">{capabilities.stakingMultiplier}x</span>
              <span className="text-gray-500">multiplier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gas Saved</p>
                <p className="text-2xl font-bold">{gasSaved.toLocaleString()}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <Percent className="w-3 h-3 text-yellow-500" />
              <span className="text-yellow-500">30-56%</span>
              <span className="text-gray-500">savings</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            Your Tier Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-green-500" />
                <span className="font-semibold">{capabilities.feeDiscount}%</span>
              </div>
              <p className="text-sm text-gray-600">Fee Discount</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">{nft.maxBatchSize}</span>
              </div>
              <p className="text-sm text-gray-600">Max Batch Size</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="font-semibold">{capabilities.stakingMultiplier}x</span>
              </div>
              <p className="text-sm text-gray-600">Staking Multiplier</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold">{tierBenefits?.priorityProcessing ? 'Yes' : 'No'}</span>
              </div>
              <p className="text-sm text-gray-600">Priority Processing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          <TabsTrigger value="land-verification">Land Verification</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Enhanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>Batch Minting</span>
                  </div>
                  <Badge variant={capabilities.batchMinting ? "default" : "secondary"}>
                    {capabilities.batchMinting ? 'Available' : 'Tier 2+'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-orange-500" />
                    <span>Auction Creation</span>
                  </div>
                  <Badge variant={capabilities.auctions ? "default" : "secondary"}>
                    {capabilities.auctions ? 'Available' : 'Tier 3+'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Make Offers</span>
                  </div>
                  <Badge variant={capabilities.offers ? "default" : "secondary"}>
                    {capabilities.offers ? 'Available' : 'Tier 2+'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    <span>NFT Staking</span>
                  </div>
                  <Badge variant={capabilities.nftStaking ? "default" : "secondary"}>
                    {capabilities.nftStaking ? 'Available' : 'Tier 2+'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span>Staking Boosters</span>
                  </div>
                  <Badge variant={capabilities.boosters ? "default" : "secondary"}>
                    {capabilities.boosters ? 'Available' : 'Tier 4+'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {capabilities.batchMinting ? 'Batch Mint NFTs' : 'Mint NFT'}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Gavel className="w-4 h-4 mr-2" />
                  {capabilities.auctions ? 'Create Auction' : 'Create Listing'}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Lock className="w-4 h-4 mr-2" />
                  {capabilities.nftStaking ? 'Stake NFT' : 'Stake Tokens'}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Vote className="w-4 h-4 mr-2" />
                  View Governance
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Daily Login Bonus */}
            <DailyLoginBonus />
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Milestone Progress
                <Badge variant="outline">
                  {completedMilestones}/{totalMilestones}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(milestoneProgress || {}).map(([key, milestone]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{milestone.badge}</span>
                        <span className="font-semibold">{milestone.name}</span>
                      </div>
                      {milestone.completed && (
                        <Badge className="bg-green-500">
                          <Trophy className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{milestone.current}/{milestone.target}</span>
                      </div>
                      <Progress value={milestone.progress} />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Reward</span>
                        <span className="font-semibold text-purple-600">+{milestone.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-600">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{activity.value}</p>
                      <Badge variant="outline" className="text-xs">
                        +{activity.xp} XP
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Gas Optimization</span>
                  <Badge className="bg-green-500">30-56% saved</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transaction Success Rate</span>
                  <Badge className="bg-blue-500">99.8%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Response Time</span>
                  <Badge className="bg-purple-500">1.2s</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Feature Utilization</span>
                  <Badge className="bg-orange-500">85%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total NFTs Minted</span>
                  <span className="font-semibold">12,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Auctions</span>
                  <span className="font-semibold">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Staked Value</span>
                  <span className="font-semibold">2.4M LKST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Governance Proposals</span>
                  <span className="font-semibold">18</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <AdminDashboard />
          </TabsContent>
        )}

        <TabsContent value="land-verification" className="space-y-4">
          <LandDocumentVerification />
        </TabsContent>
      </Tabs>

      {/* Real-time Transaction Monitor */}
      <TransactionMonitor />
    </div>
  );
}
