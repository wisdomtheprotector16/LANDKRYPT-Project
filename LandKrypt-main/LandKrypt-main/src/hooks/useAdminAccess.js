// Admin Access Control Hook
// Manages admin authentication and authorization for land verification

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

export function useAdminAccess() {
  const { address, isConnected } = useAccount();
  const [adminStatus, setAdminStatus] = useState({
    isAdmin: false,
    isVerified: false,
    adminLevel: 'none',
    permissions: []
  });

  // Get admin addresses from environment
  const adminAddresses = useMemo(() => {
    const addresses = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || [];
    const primaryAdmin = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
    const ownerAddress = process.env.NEXT_PUBLIC_OWNER_ADDRESS;
    
    // Combine all admin addresses and remove duplicates
    const allAdmins = [...new Set([
      ...addresses.map(addr => addr.trim().toLowerCase()),
      primaryAdmin?.toLowerCase(),
      ownerAddress?.toLowerCase()
    ].filter(Boolean))];
    
    return allAdmins;
  }, []);

  // Check if current address is admin
  const isAdmin = useMemo(() => {
    if (!address || !isConnected) return false;
    return adminAddresses.includes(address.toLowerCase());
  }, [address, isConnected, adminAddresses]);

  // Get admin level based on address
  const getAdminLevel = useMemo(() => {
    if (!isAdmin) return 'none';
    
    const primaryAdmin = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
    const ownerAddress = process.env.NEXT_PUBLIC_OWNER_ADDRESS?.toLowerCase();
    
    if (address?.toLowerCase() === ownerAddress) return 'owner';
    if (address?.toLowerCase() === primaryAdmin) return 'primary';
    return 'secondary';
  }, [isAdmin, address]);

  // Get admin permissions based on level
  const getAdminPermissions = useMemo(() => {
    const permissions = [];
    
    if (!isAdmin) return permissions;
    
    switch (getAdminLevel) {
      case 'owner':
        permissions.push(
          'verify_documents',
          'mint_nfts',
          'manage_admins',
          'system_settings',
          'view_analytics',
          'emergency_controls'
        );
        break;
      case 'primary':
        permissions.push(
          'verify_documents',
          'mint_nfts',
          'view_analytics',
          'manage_verifications'
        );
        break;
      case 'secondary':
        permissions.push(
          'verify_documents',
          'mint_nfts',
          'view_analytics'
        );
        break;
      default:
        break;
    }
    
    return permissions;
  }, [isAdmin, getAdminLevel]);

  // Check specific permission
  const hasPermission = (permission) => {
    return getAdminPermissions.includes(permission);
  };

  // Verify admin access with additional checks
  const verifyAdminAccess = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (!isAdmin) {
      toast.error('Access denied: Admin privileges required');
      return false;
    }

    // Additional verification checks can be added here
    // For example: checking admin status in database, time-based access, etc.
    
    setAdminStatus({
      isAdmin: true,
      isVerified: true,
      adminLevel: getAdminLevel,
      permissions: getAdminPermissions
    });

    toast.success(`Admin access verified (${getAdminLevel} level)`);
    return true;
  };

  // Require admin access for sensitive operations
  const requireAdminAccess = (operation = 'this operation') => {
    if (!isAdmin) {
      toast.error(`Admin access required for ${operation}`);
      throw new Error('Admin access required');
    }
    return true;
  };

  // Require specific permission
  const requirePermission = (permission, operation = 'this operation') => {
    if (!hasPermission(permission)) {
      toast.error(`Insufficient permissions for ${operation}`);
      throw new Error(`Permission '${permission}' required`);
    }
    return true;
  };

  // Update admin status when address changes
  useEffect(() => {
    setAdminStatus({
      isAdmin,
      isVerified: isAdmin,
      adminLevel: getAdminLevel,
      permissions: getAdminPermissions
    });
  }, [isAdmin, getAdminLevel, getAdminPermissions]);

  // Log admin access attempts
  useEffect(() => {
    if (isConnected && address) {
      if (isAdmin) {
        console.log(`Admin access granted: ${address} (${getAdminLevel} level)`);
      } else {
        console.log(`Regular user connected: ${address}`);
      }
    }
  }, [isConnected, address, isAdmin, getAdminLevel]);

  return {
    // Status
    isAdmin,
    isConnected,
    adminStatus,
    adminLevel: getAdminLevel,
    permissions: getAdminPermissions,
    
    // Checks
    hasPermission,
    canVerifyDocuments: hasPermission('verify_documents'),
    canMintNFTs: hasPermission('mint_nfts'),
    canManageAdmins: hasPermission('manage_admins'),
    canViewAnalytics: hasPermission('view_analytics'),
    
    // Actions
    verifyAdminAccess,
    requireAdminAccess,
    requirePermission,
    
    // Data
    adminAddresses,
    currentAddress: address
  };
}

// Admin access wrapper component
export function AdminAccessWrapper({ children, requiredPermission, fallback }) {
  const { isAdmin, hasPermission } = useAdminAccess();
  
  if (!isAdmin || (requiredPermission && !hasPermission(requiredPermission))) {
    return fallback || (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 font-semibold mb-2">Access Denied</div>
        <div className="text-red-500 text-sm">
          {requiredPermission 
            ? `Permission '${requiredPermission}' required`
            : 'Admin access required'
          }
        </div>
      </div>
    );
  }
  
  return children;
}

// Admin status indicator component
export function AdminStatusIndicator() {
  const { isAdmin, adminLevel, isConnected } = useAdminAccess();
  
  if (!isConnected) return null;
  
  if (!isAdmin) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
        Regular User
      </div>
    );
  }
  
  const levelColors = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-green-100 text-green-800 border-green-200'
  };
  
  const levelLabels = {
    owner: 'System Owner',
    primary: 'Primary Admin',
    secondary: 'Admin'
  };
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${levelColors[adminLevel]}`}>
      <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
      {levelLabels[adminLevel]}
    </div>
  );
}

export default useAdminAccess;
