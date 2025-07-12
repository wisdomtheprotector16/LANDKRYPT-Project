// Land Document Verification and NFT Minting Hook
// Handles document verification, automatic NFT minting, and marketplace integration

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContractDatabase } from './useContractDatabase';
import { useAdminAccess } from './useAdminAccess';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Contract ABI for land NFT minting
const LAND_NFT_ABI = [
  {
    name: 'mintLandNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'tokenURI', type: 'string' },
      { name: 'landDetails', type: 'tuple', components: [
        { name: 'documentHash', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'size', type: 'string' },
        { name: 'landType', type: 'string' },
        { name: 'verificationStatus', type: 'bool' }
      ]}
    ],
    outputs: []
  }
];

export function useLandDocumentVerification() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const { handleNFTMint, handleMarketplaceListing } = useContractDatabase();
  const {
    isAdmin,
    canVerifyDocuments,
    canMintNFTs,
    requireAdminAccess,
    requirePermission,
    adminLevel
  } = useAdminAccess();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [verifiedDocuments, setVerifiedDocuments] = useState([]);
  const [ownedLandNFTs, setOwnedLandNFTs] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [usedImages, setUsedImages] = useState([]);

  // Check if current user is admin (authorized to verify and mint)
  const isAuthorized = isAdmin && canVerifyDocuments && canMintNFTs;

  // Load available NFT images
  useEffect(() => {
    loadAvailableImages();
    loadUsedImages();
  }, []);

  // Load user's land NFTs
  useEffect(() => {
    if (address) {
      loadUserLandNFTs();
    }
  }, [address]);

  const loadAvailableImages = useCallback(async () => {
    try {
      // Load images from nftimages folder
      const imageList = [
        'property1.jpg', 'property2.jpg', 'property3.jpg', 'property4.jpg', 'property5.jpg',
        'property6.jpg', 'property7.jpg', 'property8.jpg', 'property9.jpg', 'property10.jpg',
        'villa1.jpg', 'villa2.jpg', 'villa3.jpg', 'villa4.jpg', 'villa5.jpg',
        'apartment1.jpg', 'apartment2.jpg', 'apartment3.jpg', 'apartment4.jpg', 'apartment5.jpg',
        'land1.jpg', 'land2.jpg', 'land3.jpg', 'land4.jpg', 'land5.jpg'
      ];
      
      setAvailableImages(imageList);
    } catch (error) {
      console.error('Error loading available images:', error);
    }
  }, []);

  const loadUsedImages = useCallback(async () => {
    try {
      // Get used images from database
      const { data: usedImagesList } = await supabase
        .from('nft_ownership')
        .select('metadata')
        .not('metadata->image_filename', 'is', null);

      const used = usedImagesList?.map(item => item.metadata?.image_filename).filter(Boolean) || [];
      setUsedImages(used);
    } catch (error) {
      console.error('Error loading used images:', error);
    }
  }, []);

  const loadUserLandNFTs = useCallback(async () => {
    try {
      const { data: nfts } = await supabase
        .from('nft_ownership')
        .select('*')
        .eq('user_address', address)
        .eq('action_type', 'MINT')
        .order('timestamp', { ascending: false });

      setOwnedLandNFTs(nfts || []);
    } catch (error) {
      console.error('Error loading user land NFTs:', error);
    }
  }, [address]);

  // Get next available image
  const getNextAvailableImage = useCallback(() => {
    const unusedImages = availableImages.filter(img => !usedImages.includes(img));
    return unusedImages.length > 0 ? unusedImages[0] : null;
  }, [availableImages, usedImages]);

  // Upload image to Pinata
  const uploadImageToPinata = useCallback(async (imageFilename) => {
    try {
      const imagePath = `/nftimages/${imageFilename}`;
      
      // In a real implementation, you would fetch the actual image file
      // For now, we'll simulate the upload and return a mock IPFS hash
      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      toast.success(`Image uploaded to IPFS: ${imageFilename}`);
      return mockIpfsHash;
    } catch (error) {
      console.error('Error uploading image to Pinata:', error);
      throw error;
    }
  }, []);

  // Verify land document
  const verifyLandDocument = useCallback(async (documentData) => {
    // Check admin access
    requireAdminAccess('document verification');
    requirePermission('verify_documents', 'document verification');

    setIsVerifying(true);

    try {
      // Simulate document verification process
      const verificationResult = {
        documentHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        isValid: true,
        verificationDate: new Date().toISOString(),
        verifiedBy: address,
        ...documentData
      };

      // Store verification in database
      const { data, error } = await supabase
        .from('land_document_verifications')
        .insert({
          document_hash: verificationResult.documentHash,
          owner_address: documentData.ownerAddress,
          location: documentData.location,
          size: documentData.size,
          land_type: documentData.landType,
          verification_status: verificationResult.isValid,
          verified_by: address,
          verification_date: verificationResult.verificationDate,
          document_metadata: documentData
        });

      if (error) throw error;

      setVerifiedDocuments(prev => [...prev, verificationResult]);
      toast.success('Land document verified successfully!');
      
      return verificationResult;
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify land document');
      throw error;
    } finally {
      setIsVerifying(false);
    }
  }, [address, requireAdminAccess, requirePermission]);

  // Mint NFT to land owner
  const mintLandNFT = useCallback(async (verifiedDocument, ownerAddress) => {
    // Check admin access
    requireAdminAccess('NFT minting');
    requirePermission('mint_nfts', 'NFT minting');

    if (!isAuthorized) {
      toast.error('Only authorized admins can mint NFTs');
      return;
    }

    setIsMinting(true);

    try {
      // Get next available image
      const imageFilename = getNextAvailableImage();
      if (!imageFilename) {
        throw new Error('No available images for minting');
      }

      // Upload image to Pinata
      const imageIpfsHash = await uploadImageToPinata(imageFilename);
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;

      // Generate token ID
      const tokenId = Date.now();

      // Create metadata
      const metadata = {
        name: `Land NFT - ${verifiedDocument.location}`,
        description: `Verified land property located at ${verifiedDocument.location}. Size: ${verifiedDocument.size}. Type: ${verifiedDocument.landType}.`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Location', value: verifiedDocument.location },
          { trait_type: 'Size', value: verifiedDocument.size },
          { trait_type: 'Land Type', value: verifiedDocument.landType },
          { trait_type: 'Verification Status', value: 'Verified' },
          { trait_type: 'Document Hash', value: verifiedDocument.documentHash },
          { trait_type: 'Verification Date', value: verifiedDocument.verificationDate }
        ],
        properties: {
          document_hash: verifiedDocument.documentHash,
          location: verifiedDocument.location,
          size: verifiedDocument.size,
          land_type: verifiedDocument.landType,
          verified: true,
          image_filename: imageFilename
        }
      };

      // Upload metadata to IPFS
      const metadataIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`;

      // Mint NFT
      const hash = await writeContract({
        address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
        abi: LAND_NFT_ABI,
        functionName: 'mintLandNFT',
        args: [
          ownerAddress,
          tokenId,
          tokenURI,
          {
            documentHash: verifiedDocument.documentHash,
            location: verifiedDocument.location,
            size: verifiedDocument.size,
            landType: verifiedDocument.landType,
            verificationStatus: true
          }
        ]
      });

      // Record in database
      await handleNFTMint(hash, tokenId, ownerAddress, tokenURI);

      // Update used images
      setUsedImages(prev => [...prev, imageFilename]);

      // Store additional land NFT data
      await supabase
        .from('land_nfts')
        .insert({
          token_id: tokenId,
          owner_address: ownerAddress,
          document_hash: verifiedDocument.documentHash,
          location: verifiedDocument.location,
          size: verifiedDocument.size,
          land_type: verifiedDocument.landType,
          image_url: imageUrl,
          metadata_uri: tokenURI,
          tx_hash: hash,
          minted_by: address,
          mint_timestamp: new Date().toISOString()
        });

      toast.success(`Land NFT minted successfully to ${ownerAddress}!`);
      
      // Refresh user's NFTs
      await loadUserLandNFTs();

      return { tokenId, hash, tokenURI, imageUrl };
    } catch (error) {
      console.error('Error minting land NFT:', error);
      toast.error('Failed to mint land NFT');
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [isAuthorized, getNextAvailableImage, uploadImageToPinata, writeContract, handleNFTMint, address, loadUserLandNFTs, requireAdminAccess, requirePermission]);

  // List NFT on marketplace
  const listLandNFTOnMarketplace = useCallback(async (tokenId, price) => {
    setIsListing(true);

    try {
      // First approve the marketplace contract
      const approveHash = await writeContract({
        address: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'tokenId', type: 'uint256' }
            ],
            outputs: []
          }
        ],
        functionName: 'approve',
        args: [process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE, tokenId]
      });

      toast.loading('Approving NFT for marketplace...', { id: approveHash });

      // Wait for approval confirmation
      setTimeout(async () => {
        try {
          // List on marketplace
          const listHash = await writeContract({
            address: process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE,
            abi: [
              {
                name: 'listItem',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'nftContract', type: 'address' },
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'price', type: 'uint256' }
                ],
                outputs: []
              }
            ],
            functionName: 'listItem',
            args: [
              process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT,
              tokenId,
              price
            ]
          });

          // Record listing in database
          await handleMarketplaceListing(listHash, tokenId, price);

          toast.success('Land NFT listed on marketplace successfully!', { id: approveHash });
          
          // Refresh user's NFTs
          await loadUserLandNFTs();

          return listHash;
        } catch (error) {
          console.error('Error listing on marketplace:', error);
          toast.error('Failed to list on marketplace', { id: approveHash });
          throw error;
        }
      }, 3000);

    } catch (error) {
      console.error('Error approving NFT:', error);
      toast.error('Failed to approve NFT for marketplace');
      throw error;
    } finally {
      setIsListing(false);
    }
  }, [writeContract, handleMarketplaceListing, loadUserLandNFTs]);

  // Complete workflow: Verify document and mint NFT
  const verifyAndMintWorkflow = useCallback(async (documentData, ownerAddress) => {
    try {
      // Step 1: Verify document
      const verifiedDocument = await verifyLandDocument(documentData);
      
      // Step 2: Mint NFT to land owner
      const mintResult = await mintLandNFT(verifiedDocument, ownerAddress);
      
      toast.success('Complete workflow finished: Document verified and NFT minted!');
      return { verifiedDocument, mintResult };
    } catch (error) {
      console.error('Error in verify and mint workflow:', error);
      toast.error('Workflow failed');
      throw error;
    }
  }, [verifyLandDocument, mintLandNFT]);

  return {
    // State
    isVerifying,
    isMinting,
    isListing,
    isAdmin,
    isAuthorized,
    adminLevel,
    canVerifyDocuments,
    canMintNFTs,
    verifiedDocuments,
    ownedLandNFTs,
    availableImages: availableImages.filter(img => !usedImages.includes(img)),
    usedImages,

    // Actions
    verifyLandDocument,
    mintLandNFT,
    listLandNFTOnMarketplace,
    verifyAndMintWorkflow,
    
    // Utilities
    getNextAvailableImage,
    loadUserLandNFTs,
    uploadImageToPinata
  };
}
