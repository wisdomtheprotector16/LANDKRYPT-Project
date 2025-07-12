// API endpoint for land document verification
// Handles document verification and NFT minting workflow with admin access control

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin access control
function isAdminAddress(address) {
  if (!address) return false;

  const adminAddresses = [
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase(),
    process.env.NEXT_PUBLIC_OWNER_ADDRESS?.toLowerCase(),
    ...(process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',').map(addr => addr.trim().toLowerCase()) || [])
  ].filter(Boolean);

  return adminAddresses.includes(address.toLowerCase());
}

function requireAdminAccess(userAddress, operation = 'this operation') {
  if (!isAdminAddress(userAddress)) {
    throw new Error(`Admin access required for ${operation}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      action,
      documentData,
      verificationData,
      nftData,
      imageData
    } = req.body;

    switch (action) {
      case 'VERIFY_DOCUMENT':
        return await handleDocumentVerification(req, res, documentData);
      case 'STORE_NFT_DATA':
        return await handleNFTStorage(req, res, nftData);
      case 'TRACK_IMAGE_USAGE':
        return await handleImageTracking(req, res, imageData);
      case 'GET_AVAILABLE_IMAGES':
        return await handleGetAvailableImages(req, res);
      case 'GET_USER_LAND_NFTS':
        return await handleGetUserLandNFTs(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function handleDocumentVerification(req, res, documentData) {
  try {
    const {
      ownerAddress,
      location,
      size,
      landType,
      documentNumber,
      description,
      verifiedBy
    } = documentData;

    // Validate required fields
    if (!ownerAddress || !location || !size || !verifiedBy) {
      return res.status(400).json({
        error: 'Missing required fields: ownerAddress, location, size, verifiedBy'
      });
    }

    // Check admin access
    requireAdminAccess(verifiedBy, 'document verification');

    // Generate document hash
    const documentHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Store verification in database
    const { data, error } = await supabase
      .from('land_document_verifications')
      .insert({
        document_hash: documentHash,
        owner_address: ownerAddress,
        location,
        size,
        land_type: landType || 'Residential',
        verification_status: true,
        verified_by: verifiedBy,
        verification_date: new Date().toISOString(),
        document_metadata: {
          document_number: documentNumber,
          description,
          verification_method: 'Manual Review',
          additional_data: documentData
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to store verification',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document verified successfully',
      data: {
        documentHash,
        verificationId: data.id,
        verificationDate: data.verification_date,
        status: 'verified'
      }
    });

  } catch (error) {
    console.error('Document verification error:', error);
    return res.status(500).json({ 
      error: 'Document verification failed',
      details: error.message 
    });
  }
}

async function handleNFTStorage(req, res, nftData) {
  try {
    const {
      tokenId,
      ownerAddress,
      documentHash,
      location,
      size,
      landType,
      imageUrl,
      metadataUri,
      txHash,
      mintedBy
    } = nftData;

    // Validate required fields
    if (!tokenId || !ownerAddress || !documentHash || !txHash) {
      return res.status(400).json({
        error: 'Missing required fields: tokenId, ownerAddress, documentHash, txHash'
      });
    }

    // Check admin access for minting
    if (mintedBy) {
      requireAdminAccess(mintedBy, 'NFT minting');
    }

    // Store NFT data in database
    const { data, error } = await supabase
      .from('land_nfts')
      .insert({
        token_id: parseInt(tokenId),
        owner_address: ownerAddress,
        document_hash: documentHash,
        location,
        size,
        land_type: landType,
        image_url: imageUrl,
        metadata_uri: metadataUri,
        tx_hash: txHash,
        minted_by: mintedBy,
        mint_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('NFT storage error:', error);
      return res.status(500).json({ 
        error: 'Failed to store NFT data',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'NFT data stored successfully',
      data: {
        nftId: data.id,
        tokenId: data.token_id,
        mintTimestamp: data.mint_timestamp
      }
    });

  } catch (error) {
    console.error('NFT storage error:', error);
    return res.status(500).json({ 
      error: 'NFT storage failed',
      details: error.message 
    });
  }
}

async function handleImageTracking(req, res, imageData) {
  try {
    const {
      imageFilename,
      tokenId,
      usedBy,
      ipfsHash,
      imageUrl
    } = imageData;

    // Validate required fields
    if (!imageFilename || !usedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageFilename, usedBy' 
      });
    }

    // Store image usage in database
    const { data, error } = await supabase
      .from('nft_image_usage')
      .insert({
        image_filename: imageFilename,
        token_id: tokenId ? parseInt(tokenId) : null,
        used_by: usedBy,
        used_at: new Date().toISOString(),
        ipfs_hash: ipfsHash,
        image_url: imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Image tracking error:', error);
      return res.status(500).json({ 
        error: 'Failed to track image usage',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image usage tracked successfully',
      data: {
        usageId: data.id,
        imageFilename: data.image_filename,
        usedAt: data.used_at
      }
    });

  } catch (error) {
    console.error('Image tracking error:', error);
    return res.status(500).json({ 
      error: 'Image tracking failed',
      details: error.message 
    });
  }
}

async function handleGetAvailableImages(req, res) {
  try {
    // Get used images from database
    const { data: usedImages, error } = await supabase
      .from('nft_image_usage')
      .select('image_filename');

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to get used images',
        details: error.message 
      });
    }

    // List of all available images
    const allImages = [
      'property1.jpg', 'property2.jpg', 'property3.jpg', 'property4.jpg', 'property5.jpg',
      'property6.jpg', 'property7.jpg', 'property8.jpg', 'property9.jpg', 'property10.jpg',
      'villa1.jpg', 'villa2.jpg', 'villa3.jpg', 'villa4.jpg', 'villa5.jpg',
      'apartment1.jpg', 'apartment2.jpg', 'apartment3.jpg', 'apartment4.jpg', 'apartment5.jpg',
      'land1.jpg', 'land2.jpg', 'land3.jpg', 'land4.jpg', 'land5.jpg'
    ];

    // Filter out used images
    const usedFilenames = usedImages.map(img => img.image_filename);
    const availableImages = allImages.filter(img => !usedFilenames.includes(img));

    return res.status(200).json({
      success: true,
      data: {
        totalImages: allImages.length,
        usedImages: usedFilenames.length,
        availableImages: availableImages.length,
        availableImagesList: availableImages,
        nextAvailable: availableImages.length > 0 ? availableImages[0] : null
      }
    });

  } catch (error) {
    console.error('Get available images error:', error);
    return res.status(500).json({ 
      error: 'Failed to get available images',
      details: error.message 
    });
  }
}

async function handleGetUserLandNFTs(req, res) {
  try {
    const { userAddress } = req.query;

    if (!userAddress) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userAddress' 
      });
    }

    // Get user's land NFTs
    const { data: landNFTs, error } = await supabase
      .from('land_nfts')
      .select(`
        *,
        land_document_verifications (
          document_hash,
          verification_status,
          verification_date,
          verified_by
        )
      `)
      .eq('owner_address', userAddress)
      .order('mint_timestamp', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to get user land NFTs',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userAddress,
        totalNFTs: landNFTs.length,
        listedNFTs: landNFTs.filter(nft => nft.is_listed).length,
        landNFTs
      }
    });

  } catch (error) {
    console.error('Get user land NFTs error:', error);
    return res.status(500).json({ 
      error: 'Failed to get user land NFTs',
      details: error.message 
    });
  }
}
