// IPFS Utility Functions
// This module provides utilities for handling IPFS URLs and converting them to public gateway URLs

/**
 * List of reliable IPFS gateways with fallback options
 * Ordered by reliability and speed
 */
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://ipfs.infura.io/ipfs/',
  'https://nftstorage.link/ipfs/'
];

/**
 * Convert IPFS URL to HTTP URL using public gateways
 * @param {string} ipfsUrl - The IPFS URL (can be ipfs:// or ipfs/ format)
 * @param {number} gatewayIndex - Index of gateway to use (for fallback)
 * @returns {string} - HTTP URL for the IPFS content
 */
export function convertIpfsToHttp(ipfsUrl, gatewayIndex = 0) {
  if (!ipfsUrl) return null;

  // If it's already an HTTP URL, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }

  // Extract IPFS hash from various formats
  let ipfsHash = '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    ipfsHash = ipfsUrl.replace('ipfs://', '');
  } else if (ipfsUrl.startsWith('ipfs/')) {
    ipfsHash = ipfsUrl.replace('ipfs/', '');
  } else if (ipfsUrl.startsWith('/ipfs/')) {
    ipfsHash = ipfsUrl.replace('/ipfs/', '');
  } else {
    // Assume it's already a hash
    ipfsHash = ipfsUrl;
  }

  // Remove any leading/trailing slashes
  ipfsHash = ipfsHash.replace(/^\/+|\/+$/g, '');

  // Validate IPFS hash (basic check)
  if (!ipfsHash || ipfsHash.length < 10) {
    console.warn('Invalid IPFS hash:', ipfsUrl);
    return null;
  }

  // Use specified gateway or default to first one
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  
  return `${gateway}${ipfsHash}`;
}

/**
 * Convert IPFS metadata URL to HTTP and fetch metadata
 * @param {string} tokenURI - The token URI (may be IPFS)
 * @returns {Promise<Object>} - Parsed metadata object
 */
export async function fetchTokenMetadata(tokenURI) {
  if (!tokenURI) return null;

  try {
    const httpUrl = convertIpfsToHttp(tokenURI);
    if (!httpUrl) return null;

    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const metadata = await response.json();
    
    // Convert image URL if it's also IPFS
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = convertIpfsToHttp(metadata.image);
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}

/**
 * Get optimized image URL with fallbacks
 * @param {string} imageUrl - Original image URL
 * @param {Object} options - Options for image optimization
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(imageUrl, options = {}) {
  const {
    width = 400,
    height = 300,
    quality = 80,
    format = 'webp'
  } = options;

  if (!imageUrl) return null;

  // Convert IPFS to HTTP first
  const httpUrl = convertIpfsToHttp(imageUrl);
  if (!httpUrl) return null;

  // For now, return the direct URL
  // In the future, you could add image optimization services like:
  // - Cloudinary
  // - ImageKit
  // - Next.js Image Optimization
  return httpUrl;
}

/**
 * Create image component with IPFS support and fallbacks
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {Object} props - Additional image props
 * @returns {Object} - Image props with fallback handling
 */
export function createIpfsImageProps(src, alt, props = {}) {
  const optimizedSrc = getOptimizedImageUrl(src);
  
  return {
    src: optimizedSrc,
    alt: alt || 'NFT Image',
    ...props,
    onError: (e) => {
      // Try next gateway if current one fails
      const currentSrc = e.target.src;
      const gatewayIndex = IPFS_GATEWAYS.findIndex(gateway => 
        currentSrc.startsWith(gateway)
      );
      
      if (gatewayIndex !== -1 && gatewayIndex < IPFS_GATEWAYS.length - 1) {
        const fallbackUrl = convertIpfsToHttp(src, gatewayIndex + 1);
        if (fallbackUrl && fallbackUrl !== currentSrc) {
          e.target.src = fallbackUrl;
          return;
        }
      }
      
      // Final fallback to placeholder
      e.target.src = '/images/nft-placeholder.jpg';
      
      // Call original onError if provided
      if (props.onError) {
        props.onError(e);
      }
    }
  };
}

/**
 * Preload IPFS images for better performance
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 */
export function preloadIpfsImages(imageUrls) {
  imageUrls.forEach(url => {
    if (url) {
      const httpUrl = convertIpfsToHttp(url);
      if (httpUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = httpUrl;
        document.head.appendChild(link);
      }
    }
  });
}

/**
 * Check if URL is an IPFS URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's an IPFS URL
 */
export function isIpfsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  return url.startsWith('ipfs://') || 
         url.startsWith('ipfs/') || 
         url.startsWith('/ipfs/') ||
         /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(url); // Basic IPFS hash pattern
}

/**
 * Extract IPFS hash from various URL formats
 * @param {string} url - URL to extract hash from
 * @returns {string|null} - IPFS hash or null if not found
 */
export function extractIpfsHash(url) {
  if (!url) return null;

  // Remove protocol and gateway
  let hash = url.replace(/^https?:\/\/[^\/]+\/ipfs\//, '');
  hash = hash.replace(/^ipfs:\/\//, '');
  hash = hash.replace(/^ipfs\//, '');
  hash = hash.replace(/^\/ipfs\//, '');

  // Remove any query parameters or fragments
  hash = hash.split('?')[0].split('#')[0];

  // Basic validation
  if (hash && hash.length >= 10) {
    return hash;
  }

  return null;
}

/**
 * Create a React component for IPFS images with automatic fallbacks
 */
export const IpfsImage = ({ 
  src, 
  alt, 
  className = '', 
  onError,
  ...props 
}) => {
  const imageProps = createIpfsImageProps(src, alt, { 
    className, 
    onError, 
    ...props 
  });

  return React.createElement('img', imageProps);
};

// Export for use in components
const ipfsUtils = {
  convertIpfsToHttp,
  fetchTokenMetadata,
  getOptimizedImageUrl,
  createIpfsImageProps,
  preloadIpfsImages,
  isIpfsUrl,
  extractIpfsHash,
  IPFS_GATEWAYS
};

export default ipfsUtils;
