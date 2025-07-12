// Pinata IPFS Service
// Handles automatic image and metadata upload to IPFS via Pinata

import axios from 'axios';

class PinataService {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    this.secretKey = process.env.PINATA_SECRET_KEY;
    this.baseURL = 'https://api.pinata.cloud';
    
    // Configure axios instance
    this.pinataAPI = axios.create({
      baseURL: this.baseURL,
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey
      }
    });
  }

  // Test Pinata connection
  async testConnection() {
    try {
      const response = await this.pinataAPI.get('/data/testAuthentication');
      return response.data;
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      throw new Error('Failed to connect to Pinata');
    }
  }

  // Upload image file to IPFS
  async uploadImageFile(imageFile, filename) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          type: 'land-nft-image',
          filename: filename,
          uploadedAt: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 1
            },
            {
              id: 'NYC1', 
              desiredReplicationCount: 1
            }
          ]
        }
      });
      formData.append('pinataOptions', options);

      const response = await this.pinataAPI.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };

    } catch (error) {
      console.error('Image upload to Pinata failed:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  // Upload image from local path (for server-side usage)
  async uploadImageFromPath(imagePath, filename) {
    try {
      // In a real implementation, you would read the file from the filesystem
      // For now, we'll simulate the upload with a mock response
      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        ipfsHash: mockIpfsHash,
        pinSize: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
        timestamp: new Date().toISOString(),
        url: `https://gateway.pinata.cloud/ipfs/${mockIpfsHash}`,
        filename: filename,
        originalPath: imagePath
      };

    } catch (error) {
      console.error('Image upload from path failed:', error);
      throw new Error(`Failed to upload image from path: ${error.message}`);
    }
  }

  // Upload JSON metadata to IPFS
  async uploadMetadata(metadata, name) {
    try {
      const data = {
        pinataContent: metadata,
        pinataMetadata: {
          name: name || 'Land NFT Metadata',
          keyvalues: {
            type: 'land-nft-metadata',
            createdAt: new Date().toISOString()
          }
        },
        pinataOptions: {
          cidVersion: 0,
          customPinPolicy: {
            regions: [
              {
                id: 'FRA1',
                desiredReplicationCount: 1
              },
              {
                id: 'NYC1',
                desiredReplicationCount: 1
              }
            ]
          }
        }
      };

      const response = await this.pinataAPI.post('/pinning/pinJSONToIPFS', data);

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      };

    } catch (error) {
      console.error('Metadata upload to Pinata failed:', error);
      throw new Error(`Failed to upload metadata: ${error.message}`);
    }
  }

  // Get pinned files list
  async getPinnedFiles(filters = {}) {
    try {
      const params = {
        status: 'pinned',
        pageLimit: 100,
        ...filters
      };

      const response = await this.pinataAPI.get('/data/pinList', { params });

      return {
        success: true,
        count: response.data.count,
        files: response.data.rows
      };

    } catch (error) {
      console.error('Failed to get pinned files:', error);
      throw new Error(`Failed to get pinned files: ${error.message}`);
    }
  }

  // Unpin file from IPFS
  async unpinFile(ipfsHash) {
    try {
      await this.pinataAPI.delete(`/pinning/unpin/${ipfsHash}`);

      return {
        success: true,
        message: `File ${ipfsHash} unpinned successfully`
      };

    } catch (error) {
      console.error('Failed to unpin file:', error);
      throw new Error(`Failed to unpin file: ${error.message}`);
    }
  }

  // Create complete NFT metadata with image
  async createCompleteNFTMetadata(landData, imageFile, imageFilename) {
    try {
      // Step 1: Upload image to IPFS
      const imageUpload = await this.uploadImageFile(imageFile, imageFilename);
      
      // Step 2: Create metadata object
      const metadata = {
        name: `Land NFT - ${landData.location}`,
        description: `Verified land property located at ${landData.location}. Size: ${landData.size}. Type: ${landData.landType}.`,
        image: imageUpload.url,
        external_url: `https://landkrypt.com/nft/${landData.tokenId}`,
        attributes: [
          {
            trait_type: 'Location',
            value: landData.location
          },
          {
            trait_type: 'Size',
            value: landData.size
          },
          {
            trait_type: 'Land Type',
            value: landData.landType
          },
          {
            trait_type: 'Verification Status',
            value: 'Verified'
          },
          {
            trait_type: 'Document Hash',
            value: landData.documentHash
          },
          {
            trait_type: 'Verification Date',
            value: landData.verificationDate
          }
        ],
        properties: {
          document_hash: landData.documentHash,
          location: landData.location,
          size: landData.size,
          land_type: landData.landType,
          verified: true,
          verification_date: landData.verificationDate,
          image_filename: imageFilename,
          image_ipfs_hash: imageUpload.ipfsHash
        }
      };

      // Step 3: Upload metadata to IPFS
      const metadataUpload = await this.uploadMetadata(
        metadata, 
        `Land NFT Metadata - ${landData.location}`
      );

      return {
        success: true,
        imageUpload,
        metadataUpload,
        metadata,
        tokenURI: metadataUpload.url
      };

    } catch (error) {
      console.error('Failed to create complete NFT metadata:', error);
      throw new Error(`Failed to create NFT metadata: ${error.message}`);
    }
  }

  // Batch upload multiple images
  async batchUploadImages(imageFiles) {
    try {
      const uploadPromises = imageFiles.map(({ file, filename }) => 
        this.uploadImageFile(file, filename)
      );

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
        
      const failed = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      return {
        success: true,
        totalFiles: imageFiles.length,
        successful: successful.length,
        failed: failed.length,
        results: successful,
        errors: failed
      };

    } catch (error) {
      console.error('Batch upload failed:', error);
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  }

  // Get file info by IPFS hash
  async getFileInfo(ipfsHash) {
    try {
      const response = await this.pinataAPI.get('/data/pinList', {
        params: {
          hashContains: ipfsHash,
          status: 'pinned'
        }
      });

      if (response.data.count === 0) {
        throw new Error('File not found');
      }

      return {
        success: true,
        fileInfo: response.data.rows[0]
      };

    } catch (error) {
      console.error('Failed to get file info:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Generate IPFS URL from hash
  generateIPFSUrl(ipfsHash, gateway = 'https://gateway.pinata.cloud/ipfs/') {
    return `${gateway}${ipfsHash}`;
  }

  // Validate IPFS hash format
  isValidIPFSHash(hash) {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[A-Za-z2-7]{58}$/;
    
    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }
}

// Create singleton instance
const pinataService = new PinataService();

export default pinataService;

// Export individual methods for convenience
export const {
  testConnection,
  uploadImageFile,
  uploadImageFromPath,
  uploadMetadata,
  createCompleteNFTMetadata,
  batchUploadImages,
  getPinnedFiles,
  unpinFile,
  getFileInfo,
  generateIPFSUrl,
  isValidIPFSHash
} = pinataService;
