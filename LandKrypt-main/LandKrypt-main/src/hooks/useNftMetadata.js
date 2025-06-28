// useNftMetadata Hook
// React hook for fetching and managing NFT metadata from IPFS

import { useState, useEffect, useCallback } from 'react';
import { fetchTokenMetadata, convertIpfsToHttp, isIpfsUrl } from '@/utils/ipfs';

export function useNftMetadata(tokenURI, initialData = null) {
  const [metadata, setMetadata] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Fetch metadata from IPFS
  const fetchMetadata = useCallback(async (uri) => {
    if (!uri) return;

    setIsLoading(true);
    setError(null);

    try {
      // If it's already an HTTP URL pointing to an image, use it directly
      if (uri.startsWith('http') && (uri.includes('.jpg') || uri.includes('.png') || uri.includes('.gif') || uri.includes('.webp'))) {
        setImageUrl(uri);
        setMetadata({ image: uri, name: 'NFT Image' });
        return;
      }

      // If it's an IPFS URL or could be metadata
      const fetchedMetadata = await fetchTokenMetadata(uri);
      
      if (fetchedMetadata) {
        setMetadata(fetchedMetadata);
        
        // Extract image URL from metadata
        if (fetchedMetadata.image) {
          const processedImageUrl = convertIpfsToHttp(fetchedMetadata.image) || fetchedMetadata.image;
          setImageUrl(processedImageUrl);
        } else if (fetchedMetadata.animation_url) {
          // Some NFTs use animation_url for images
          const processedImageUrl = convertIpfsToHttp(fetchedMetadata.animation_url) || fetchedMetadata.animation_url;
          setImageUrl(processedImageUrl);
        }
      } else {
        // If metadata fetch failed, treat the URI as a direct image URL
        const directImageUrl = convertIpfsToHttp(uri) || uri;
        setImageUrl(directImageUrl);
        setMetadata({ image: directImageUrl, name: 'NFT Image' });
      }
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      setError(err.message);
      
      // Fallback: treat URI as direct image URL
      const fallbackImageUrl = convertIpfsToHttp(uri) || uri;
      setImageUrl(fallbackImageUrl);
      setMetadata({ image: fallbackImageUrl, name: 'NFT Image', error: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch metadata when tokenURI changes
  useEffect(() => {
    if (tokenURI) {
      fetchMetadata(tokenURI);
    } else {
      setMetadata(null);
      setImageUrl(null);
      setError(null);
    }
  }, [tokenURI, fetchMetadata]);

  // Retry function
  const retry = useCallback(() => {
    if (tokenURI) {
      fetchMetadata(tokenURI);
    }
  }, [tokenURI, fetchMetadata]);

  return {
    metadata,
    imageUrl,
    isLoading,
    error,
    retry,
    // Convenience getters
    name: metadata?.name || metadata?.title || 'Unnamed NFT',
    description: metadata?.description || '',
    attributes: metadata?.attributes || [],
    hasMetadata: !!metadata && !metadata.error
  };
}

// Hook for multiple NFT metadata
export function useMultipleNftMetadata(tokenURIs = []) {
  const [metadataMap, setMetadataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});

  const fetchSingleMetadata = useCallback(async (uri, index) => {
    if (!uri) return;

    const key = `${index}-${uri}`;
    
    setLoadingMap(prev => ({ ...prev, [key]: true }));
    setErrorMap(prev => ({ ...prev, [key]: null }));

    try {
      const metadata = await fetchTokenMetadata(uri);
      
      let processedMetadata = metadata || { image: uri, name: 'NFT Image' };
      
      // Process image URL
      if (processedMetadata.image) {
        processedMetadata.image = convertIpfsToHttp(processedMetadata.image) || processedMetadata.image;
      }

      setMetadataMap(prev => ({ ...prev, [key]: processedMetadata }));
    } catch (err) {
      console.error(`Error fetching metadata for ${uri}:`, err);
      setErrorMap(prev => ({ ...prev, [key]: err.message }));
      
      // Fallback metadata
      const fallbackMetadata = {
        image: convertIpfsToHttp(uri) || uri,
        name: 'NFT Image',
        error: true
      };
      setMetadataMap(prev => ({ ...prev, [key]: fallbackMetadata }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  useEffect(() => {
    // Clear previous data
    setMetadataMap({});
    setLoadingMap({});
    setErrorMap({});

    // Fetch metadata for all URIs
    tokenURIs.forEach((uri, index) => {
      if (uri) {
        fetchSingleMetadata(uri, index);
      }
    });
  }, [tokenURIs, fetchSingleMetadata]);

  // Helper function to get metadata by index
  const getMetadata = useCallback((index, uri) => {
    const key = `${index}-${uri}`;
    return {
      metadata: metadataMap[key] || null,
      isLoading: loadingMap[key] || false,
      error: errorMap[key] || null,
      imageUrl: metadataMap[key]?.image || null
    };
  }, [metadataMap, loadingMap, errorMap]);

  return {
    metadataMap,
    loadingMap,
    errorMap,
    getMetadata,
    isAnyLoading: Object.values(loadingMap).some(loading => loading),
    hasAnyError: Object.values(errorMap).some(error => !!error)
  };
}

// Hook for processing marketplace items with IPFS metadata
export function useMarketplaceMetadata(items = []) {
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processItems = async () => {
      setIsProcessing(true);
      
      const processed = await Promise.all(
        items.map(async (item) => {
          try {
            // Determine the best image source
            let imageUrl = item.image;
            let metadata = null;

            // Priority: tokenURI (metadata) > tokenUrl > image
            if (item.tokenURI && isIpfsUrl(item.tokenURI)) {
              try {
                metadata = await fetchTokenMetadata(item.tokenURI);
                if (metadata?.image) {
                  imageUrl = convertIpfsToHttp(metadata.image) || metadata.image;
                }
              } catch (error) {
                console.warn(`Failed to fetch metadata for ${item.title}:`, error);
              }
            } else if (item.tokenUrl && isIpfsUrl(item.tokenUrl)) {
              imageUrl = convertIpfsToHttp(item.tokenUrl) || item.tokenUrl;
            } else if (item.image && isIpfsUrl(item.image)) {
              imageUrl = convertIpfsToHttp(item.image) || item.image;
            }

            return {
              ...item,
              processedImageUrl: imageUrl,
              metadata: metadata,
              hasIpfsMetadata: !!(metadata || isIpfsUrl(item.tokenURI || item.tokenUrl || item.image))
            };
          } catch (error) {
            console.error(`Error processing item ${item.id}:`, error);
            return {
              ...item,
              processedImageUrl: item.image,
              metadata: null,
              hasIpfsMetadata: false,
              processingError: error.message
            };
          }
        })
      );

      setProcessedItems(processed);
      setIsProcessing(false);
    };

    if (items.length > 0) {
      processItems();
    } else {
      setProcessedItems([]);
      setIsProcessing(false);
    }
  }, [items]);

  return {
    processedItems,
    isProcessing,
    // Helper functions
    getItemImageUrl: (item) => item.processedImageUrl || item.image,
    getItemMetadata: (item) => item.metadata,
    hasIpfsContent: processedItems.some(item => item.hasIpfsMetadata)
  };
}

export default useNftMetadata;
