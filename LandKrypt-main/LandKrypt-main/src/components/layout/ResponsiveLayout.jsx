// Responsive Layout Component
// Ensures mobile responsiveness down to 320px with adaptive design patterns

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Breakpoint constants
const BREAKPOINTS = {
  xs: 320,   // Extra small devices
  sm: 640,   // Small devices
  md: 768,   // Medium devices
  lg: 1024,  // Large devices
  xl: 1280,  // Extra large devices
  '2xl': 1536 // 2X large devices
};

// Hook for responsive behavior
function useResponsive() {
  const [screenSize, setScreenSize] = useState('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.sm) {
        setScreenSize('xs');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < BREAKPOINTS.md) {
        setScreenSize('sm');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < BREAKPOINTS.lg) {
        setScreenSize('md');
        setIsMobile(false);
        setIsTablet(true);
      } else if (width < BREAKPOINTS.xl) {
        setScreenSize('lg');
        setIsMobile(false);
        setIsTablet(false);
      } else {
        setScreenSize('xl');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { screenSize, isMobile, isTablet };
}

// Navigation items
const navigationItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'My NFTs', href: '/nfts', icon: CubeIcon },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBagIcon },
  { name: 'Staking', href: '/staking', icon: CogIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon }
];

// Mobile Navigation Component
function MobileNavigation({ isOpen, onClose }) {
  const router = useRouter();
  const { address } = useAccount();

  const handleNavigation = (href) => {
    router.push(href);
    onClose();
  };

  return (
    <div className={`
      fixed inset-0 z-50 lg:hidden
      ${isOpen ? 'block' : 'hidden'}
    `}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 
        shadow-xl transform transition-transform duration-300 ease-in-out
        flex flex-col
      ">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            LandKrypt
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        {address && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {address.slice(2, 4).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connected
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Desktop Sidebar Component
function DesktopSidebar() {
  const router = useRouter();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white dark:lg:bg-gray-900 dark:lg:border-gray-700">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          LandKrypt
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                transition-colors duration-200
                ${isActive 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Header Component
function Header({ onMenuClick }) {
  const { address } = useAccount();
  const { isMobile } = useResponsive();

  return (
    <header className="
      bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
      lg:pl-64
    ">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Page title - hidden on mobile */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>

        {/* User menu */}
        <div className="flex items-center space-x-4">
          {address ? (
            <div className="flex items-center space-x-3">
              {!isMobile && (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
              )}
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <button className="
              px-4 py-2 text-sm font-medium text-white bg-blue-600 
              rounded-md hover:bg-blue-700 transition-colors duration-200
            ">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// Main Layout Component
export default function ResponsiveLayout({ children, title = 'Dashboard' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, isTablet, screenSize } = useResponsive();

  // Close mobile menu on route change
  const router = useRouter();
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="
          px-4 py-6 sm:px-6 lg:px-8
          min-h-[calc(100vh-4rem)]
        ">
          {/* Responsive Container */}
          <div className={`
            mx-auto
            ${screenSize === 'xs' ? 'max-w-none' : ''}
            ${screenSize === 'sm' ? 'max-w-sm' : ''}
            ${screenSize === 'md' ? 'max-w-4xl' : ''}
            ${screenSize === 'lg' ? 'max-w-6xl' : ''}
            ${screenSize === 'xl' ? 'max-w-7xl' : ''}
          `}>
            {children}
          </div>
        </main>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-2 py-1 rounded text-xs font-mono z-50">
          {screenSize} ({window.innerWidth}px)
        </div>
      )}
    </div>
  );
}

// Export responsive utilities
export { useResponsive, BREAKPOINTS };
