// IPFS Image Component
// Reusable component for displaying images from IPFS with automatic fallbacks

import React, { useState, useEffect } from 'react';
import { convertIpfsToHttp, IPFS_GATEWAYS, isIpfsUrl } from '../utils/ipfs';
import NftPlaceholder from './NftPlaceholder';

// IPFS Gateway fallback system for production reliability

const IpfsImage = ({ 
  src, 
  alt = 'NFT Image', 
  className = '', 
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  placeholder = '/images/nft-placeholder.jpg',
  showLoadingSpinner = true,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Initialize image source
  useEffect(() => {
    if (src) {
      const httpUrl = convertIpfsToHttp(src, 0);
      setCurrentSrc(httpUrl);
      setGatewayIndex(0);
      setIsLoading(true);
      setHasError(false);
    } else {
      setCurrentSrc(placeholder);
      setIsLoading(false);
      setHasError(true);
    }
  }, [src, placeholder]);

  const handleImageLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleImageError = (e) => {
    console.warn('Image failed to load:', currentSrc);
    
    // If this is an IPFS URL and we haven't tried all gateways yet
    if (isIpfsUrl(src) && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      // Trying next IPFS gateway
      const nextIndex = gatewayIndex + 1;
      const fallbackUrl = convertIpfsToHttp(src, nextIndex);
      
      if (fallbackUrl && fallbackUrl !== currentSrc) {
        setGatewayIndex(nextIndex);
        setCurrentSrc(fallbackUrl);
        return; // Don't set error state yet, try next gateway
      }
    }
    
    // All gateways failed or not an IPFS URL, use placeholder
    // All IPFS gateways failed, using placeholder
    setCurrentSrc(placeholder);
    setIsLoading(false);
    setHasError(true);
    
    if (onError) {
      onError(e);
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );

  // Error placeholder component
  const ErrorPlaceholder = () => (
    <div className="absolute inset-0">
      <NftPlaceholder 
        title={alt}
        className="w-full h-full"
      />
    </div>
  );

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading state */}
      {isLoading && showLoadingSpinner && <LoadingSpinner />}
      
      {/* Error state */}
      {hasError && !currentSrc && <ErrorPlaceholder />}
      
      {/* Main image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />
      )}
      
      {/* IPFS indicator (for development) */}
      {process.env.NODE_ENV === 'development' && isIpfsUrl(src) && (
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          IPFS {gatewayIndex + 1}/{IPFS_GATEWAYS.length}
        </div>
      )}
    </div>
  );
};

export default IpfsImage;
