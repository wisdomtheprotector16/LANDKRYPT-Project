import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tier configuration based on requirements
const TIER_CONFIG = {
  1: { name: 'Territory Trainee', requiredXP: 0, avatar: 'tier1.png' },
  2: { name: 'Plot Pioneer', requiredXP: 5000, avatar: 'tier2.png' },
  3: { name: 'Estate Architect', requiredXP: 10000, avatar: 'tier3.png' },
  4: { name: 'Dominion Magnate', requiredXP: 15000, avatar: 'tier4.png' },
  5: { name: 'Realm Sovereign', requiredXP: 20000, avatar: 'tier5.png' }
};

const TierBadge = ({ 
  walletAddress, 
  totalXP = 0, 
  currentTier = 1, 
  tierProgress = 0, 
  className = '', 
  showAnimation = false,
  newXP = 0 
}) => {
  // Add error boundary
  const [hasError, setHasError] = useState(false);
  
  // Reset error when props change
  useEffect(() => {
    setHasError(false);
  }, [walletAddress, totalXP, currentTier]);
  
  // Handle errors gracefully
  const handleError = (error) => {
    console.warn('TierBadge error:', error);
    setHasError(true);
  };
  
  // If there's an error, show a minimal fallback
  if (hasError) {
    return (
      <div className={`flex items-center bg-gray-800 rounded-lg p-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-400">?</span>
        </div>
        <span className="ml-2 text-xs text-gray-400">Tier System Loading...</span>
      </div>
    );
  }
  const [displayXP, setDisplayXP] = useState(totalXP);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);

  // Calculate progress percentage (0-100%)
  const progressPercentage = currentTier < 5 ? (tierProgress / 5000) * 100 : 100;
  
  // Get tier info
  const tierInfo = TIER_CONFIG[currentTier] || TIER_CONFIG[1];
  const nextTierInfo = TIER_CONFIG[currentTier + 1];

  // Handle XP animation when new XP is awarded
  useEffect(() => {
    if (newXP > 0 && showAnimation) {
      setIsAnimating(true);
      setShowXPGain(true);
      
      // Animate XP counter
      const startXP = totalXP - newXP;
      const duration = 1000; // 1 second
      const steps = 30;
      const increment = newXP / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        setDisplayXP(startXP + (increment * currentStep));
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setDisplayXP(totalXP);
          setIsAnimating(false);
          
          // Hide XP gain indicator after animation
          setTimeout(() => setShowXPGain(false), 1000);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [newXP, showAnimation, totalXP]);

  if (!walletAddress) {
    return null; // Don't show if no wallet connected
  }

  return (
    <div className={`flex items-center bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3 shadow-md relative ${className}`}>
      {/* Tier Avatar */}
      <div className="relative">
        <img 
          src={`/tier-avatars/${tierInfo.avatar}`} 
          alt={tierInfo.name}
          className="w-12 h-12 rounded-full border-2 border-indigo-500 shadow-sm"
          onError={(e) => {
            e.target.src = '/tier-avatars/default.png'; // Fallback avatar
          }}
        />
        {/* Tier number badge */}
        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {currentTier}
        </div>
      </div>

      {/* Tier Info */}
      <div className="flex-1 ml-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            {tierInfo.name}
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {Math.floor(displayXP).toLocaleString()} XP
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              style={{ width: `${progressPercentage}%` }}
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{tierProgress.toLocaleString()}</span>
            <span>
              {currentTier < 5 ? `${(5000 - tierProgress).toLocaleString()} to next tier` : 'Max Tier'}
            </span>
          </div>
        </div>
      </div>

      {/* XP Gain Animation */}
      <AnimatePresence>
        {showXPGain && newXP > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.6 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute -top-8 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10"
          >
            +{newXP} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Up Animation */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.6, repeat: 2 }}
          className="absolute inset-0 border-2 border-yellow-400 rounded-lg pointer-events-none"
        />
      )}
    </div>
  );
};

export default TierBadge;

