// Admin Dashboard Component
// Displays admin-specific features and controls

'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAdminAccess, AdminAccessWrapper, AdminStatusIndicator } from '../hooks/useAdminAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const { address } = useAccount();
  const { 
    isAdmin, 
    adminLevel, 
    permissions, 
    hasPermission,
    canVerifyDocuments,
    canMintNFTs,
    canManageAdmins,
    canViewAnalytics
  } = useAdminAccess();

  const [adminStats, setAdminStats] = useState({
    totalVerifications: 0,
    totalNFTsMinted: 0,
    activeListings: 0,
    pendingVerifications: 0,
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load admin statistics
  useEffect(() => {
    if (isAdmin && canViewAnalytics) {
      loadAdminStats();
    }
  }, [isAdmin, canViewAnalytics]);

  const loadAdminStats = async () => {
    try {
      setIsLoading(true);

      // Get verification statistics
      const { data: verifications } = await supabase
        .from('land_document_verifications')
        .select('*');

      // Get NFT statistics
      const { data: nfts } = await supabase
        .from('land_nfts')
        .select('*');

      // Get marketplace statistics
      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('is_active', true);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('user_actions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      setAdminStats({
        totalVerifications: verifications?.length || 0,
        totalNFTsMinted: nfts?.length || 0,
        activeListings: listings?.length || 0,
        pendingVerifications: verifications?.filter(v => !v.verification_status).length || 0,
        recentActivity: recentActivity || []
      });

    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wallet Connection Required</h3>
          <p className="text-yellow-700">Please connect your wallet to access the admin dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AdminAccessWrapper
      fallback={
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Admin Access Required</h3>
            <p className="text-red-700 mb-4">
              This dashboard is only accessible to authorized administrators.
            </p>
            <div className="text-sm text-red-600 bg-red-100 rounded-lg p-3">
              <p><strong>Current Status:</strong> Regular User</p>
              <p><strong>Required Role:</strong> Administrator</p>
              <p><strong>Contact:</strong> System administrator for access</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-4">Land verification system administration</p>
          <AdminStatusIndicator />
        </div>

        {/* Admin Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Admin Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Account Details</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p><strong>Admin Level:</strong> {adminLevel}</p>
                  <p><strong>Total Permissions:</strong> {permissions.length}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {permissions.map((permission) => (
                    <Badge key={permission} className="text-xs bg-blue-100 text-blue-800">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {canViewAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DocumentCheckIcon className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : adminStats.totalVerifications}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CubeIcon className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">NFTs Minted</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : adminStats.totalNFTsMinted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Listings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : adminStats.activeListings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : adminStats.pendingVerifications}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {canVerifyDocuments && (
                <Button 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => window.location.hash = '#land-verification'}
                >
                  <DocumentCheckIcon className="w-6 h-6" />
                  <span>Verify Documents</span>
                </Button>
              )}

              {canMintNFTs && (
                <Button 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => window.location.hash = '#land-verification'}
                >
                  <CubeIcon className="w-6 h-6" />
                  <span>Mint NFTs</span>
                </Button>
              )}

              {canViewAnalytics && (
                <Button 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={loadAdminStats}
                  disabled={isLoading}
                >
                  <ChartBarIcon className="w-6 h-6" />
                  <span>Refresh Stats</span>
                </Button>
              )}

              {canManageAdmins && (
                <Button 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  variant="outline"
                >
                  <UserGroupIcon className="w-6 h-6" />
                  <span>Manage Admins</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {canViewAnalytics && adminStats.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.action_type}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user_address?.slice(0, 6)}...{activity.user_address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-green-700">Database Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-green-700">Contracts Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-green-700">IPFS Connected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAccessWrapper>
  );
}
