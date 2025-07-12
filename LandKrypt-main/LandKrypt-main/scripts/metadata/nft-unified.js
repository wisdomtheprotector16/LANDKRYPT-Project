// Unified NFT Management System
// Consolidates minting, metadata generation, and IPFS operations

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

// Configuration and validation
const CONFIG = {
  // IPFS Configuration
  PINATA: {
    API_KEY: process.env.PINATA_API_KEY,
    SECRET_KEY: process.env.PINATA_SECRET_API_KEY,
    GATEWAY: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
  },
  
  // Blockchain Configuration
  BLOCKCHAIN: {
    RPC_URL: process.env.ALCHEMY_SEPOLIA_URL || process.env.RPC_URL,
    PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
    NFT_CONTRACT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS
  },
  
  // File paths
  PATHS: {
    IMAGES: path.join(__dirname, '../../public/nfts'),
    METADATA: path.join(__dirname, '../../data/json'),
    RECORDS: path.join(__dirname, '../../records')
  }
};

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'PINATA_API_KEY',
    'PINATA_SECRET_API_KEY',
    'ALCHEMY_SEPOLIA_URL',
    'DEPLOYER_PRIVATE_KEY',
    'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

class NFTManager {
  constructor() {
    validateEnvironment();
    this.ensureDirectories();
    this.initializeBlockchain();
  }

  ensureDirectories() {
    Object.values(CONFIG.PATHS).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async initializeBlockchain() {
    try {
      this.provider = new ethers.JsonRpcProvider(CONFIG.BLOCKCHAIN.RPC_URL);
      this.wallet = new ethers.Wallet(CONFIG.BLOCKCHAIN.PRIVATE_KEY, this.provider);
      
      // Load NFT contract ABI
      const abiPath = path.join(__dirname, '../../src/contracts/abis.js');
      if (fs.existsSync(abiPath)) {
        const { REAL_ESTATE_NFT_ABI } = require(abiPath);
        this.nftContract = new ethers.Contract(
          CONFIG.BLOCKCHAIN.NFT_CONTRACT,
          REAL_ESTATE_NFT_ABI,
          this.wallet
        );
      } else {
        console.warn('⚠️  NFT contract ABI not found. Blockchain operations will be limited.');
      }
      
      console.log(`✅ Blockchain initialized - Wallet: ${this.wallet.address}`);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain:', error.message);
      throw error;
    }
  }

  // ====== IPFS OPERATIONS ======

  async uploadImageToPinata(imagePath, filename) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));
      
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          project: 'LandKrypt',
          type: 'nft-image'
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': CONFIG.PINATA.API_KEY,
            'pinata_secret_api_key': CONFIG.PINATA.SECRET_KEY
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log(`✅ Image uploaded to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('❌ Failed to upload image to IPFS:', error.message);
      throw error;
    }
  }

  async uploadMetadataToPinata(metadata, filename) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': CONFIG.PINATA.API_KEY,
            'pinata_secret_api_key': CONFIG.PINATA.SECRET_KEY
          },
          pinataMetadata: {
            name: filename,
            keyvalues: {
              project: 'LandKrypt',
              type: 'nft-metadata'
            }
          }
        }
      );

      console.log(`✅ Metadata uploaded to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('❌ Failed to upload metadata to IPFS:', error.message);
      throw error;
    }
  }

  // ====== METADATA GENERATION ======

  generateNFTMetadata(tokenId, name, description, imageCid, attributes = []) {
    const metadata = {
      name: name || `LandKrypt Property #${tokenId}`,
      description: description || `A unique real estate NFT representing property #${tokenId} in the LandKrypt ecosystem.`,
      image: `ipfs://${imageCid}`,
      external_url: `https://landkrypt.com/property/${tokenId}`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId
        },
        {
          trait_type: "Collection",
          value: "LandKrypt Real Estate"
        },
        {
          trait_type: "Blockchain",
          value: "Ethereum"
        },
        ...attributes
      ],
      properties: {
        category: "Real Estate",
        creator: "LandKrypt",
        date: new Date().toISOString()
      }
    };

    return metadata;
  }

  // ====== MINTING OPERATIONS ======

  async mintNFT(recipient, tokenId, name, description, imagePath, attributes = []) {
    try {
      console.log(`🎨 Starting NFT minting process for Token ID: ${tokenId}`);
      
      // Step 1: Upload image to IPFS
      console.log('📤 Uploading image to IPFS...');
      const imageCid = await this.uploadImageToPinata(imagePath, `nft-${tokenId}.jpg`);
      
      // Step 2: Generate metadata
      console.log('📝 Generating metadata...');
      const metadata = this.generateNFTMetadata(tokenId, name, description, imageCid, attributes);
      
      // Step 3: Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...');
      const metadataCid = await this.uploadMetadataToPinata(metadata, `metadata-${tokenId}.json`);
      
      // Step 4: Mint NFT on blockchain
      console.log('⛓️  Minting NFT on blockchain...');
      const tokenURI = `ipfs://${metadataCid}`;
      
      if (!this.nftContract) {
        throw new Error('NFT contract not initialized');
      }
      
      const tx = await this.nftContract.mintNFT(recipient, tokenId, name, tokenURI);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ NFT minted successfully! Block: ${receipt.blockNumber}`);
      
      // Step 5: Save minting record
      const record = {
        tokenId,
        recipient,
        name,
        description,
        imageCid,
        metadataCid,
        tokenURI,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: new Date().toISOString(),
        attributes
      };
      
      await this.saveMintingRecord(record);
      
      return {
        success: true,
        tokenId,
        transactionHash: tx.hash,
        imageCid,
        metadataCid,
        tokenURI
      };
      
    } catch (error) {
      console.error('❌ NFT minting failed:', error.message);
      throw error;
    }
  }

  async batchMintNFTs(mintingData) {
    const results = [];
    const errors = [];
    
    console.log(`🎨 Starting batch minting of ${mintingData.length} NFTs...`);
    
    for (let i = 0; i < mintingData.length; i++) {
      const { recipient, tokenId, name, description, imagePath, attributes } = mintingData[i];
      
      try {
        console.log(`\n[${i + 1}/${mintingData.length}] Minting NFT #${tokenId}...`);
        const result = await this.mintNFT(recipient, tokenId, name, description, imagePath, attributes);
        results.push(result);
        
        // Add delay between mints to avoid rate limiting
        if (i < mintingData.length - 1) {
          console.log('⏳ Waiting 2 seconds before next mint...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to mint NFT #${tokenId}:`, error.message);
        errors.push({
          tokenId,
          error: error.message
        });
      }
    }
    
    // Save batch report
    const batchReport = {
      timestamp: new Date().toISOString(),
      total: mintingData.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
    
    const reportPath = path.join(CONFIG.PATHS.RECORDS, `batch-mint-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(batchReport, null, 2));
    
    console.log(`\n📊 Batch minting complete:`);
    console.log(`   ✅ Successful: ${results.length}`);
    console.log(`   ❌ Failed: ${errors.length}`);
    console.log(`   📄 Report saved: ${reportPath}`);
    
    return batchReport;
  }

  // ====== RECORD KEEPING ======

  async saveMintingRecord(record) {
    try {
      // Save individual record
      const filename = `mint-${record.tokenId}-${Date.now()}.json`;
      const filepath = path.join(CONFIG.PATHS.RECORDS, filename);
      fs.writeFileSync(filepath, JSON.stringify(record, null, 2));
      
      // Update master records file
      const masterFile = path.join(CONFIG.PATHS.RECORDS, 'minting-records.json');
      let masterRecords = [];
      
      if (fs.existsSync(masterFile)) {
        masterRecords = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
      }
      
      masterRecords.push(record);
      fs.writeFileSync(masterFile, JSON.stringify(masterRecords, null, 2));
      
      console.log(`✅ Minting record saved: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save minting record:', error.message);
    }
  }

  // ====== UTILITY FUNCTIONS ======

  async getNextTokenId() {
    try {
      if (!this.nftContract) {
        throw new Error('NFT contract not initialized');
      }
      
      const totalSupply = await this.nftContract.totalSupply();
      return totalSupply + 1n;
    } catch (error) {
      console.error('❌ Failed to get next token ID:', error.message);
      return null;
    }
  }

  async getNFTMetadata(tokenId) {
    try {
      if (!this.nftContract) {
        throw new Error('NFT contract not initialized');
      }
      
      const tokenURI = await this.nftContract.tokenURI(tokenId);
      
      if (tokenURI.startsWith('ipfs://')) {
        const cid = tokenURI.replace('ipfs://', '');
        const response = await axios.get(`${CONFIG.PINATA.GATEWAY}${cid}`);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get metadata for token ${tokenId}:`, error.message);
      return null;
    }
  }

  // ====== VALIDATION ======

  validateImageFile(imagePath) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(imagePath).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Invalid image format. Allowed: ${allowedExtensions.join(', ')}`);
    }
    
    const stats = fs.statSync(imagePath);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (stats.size > maxSize) {
      throw new Error(`Image file too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }
    
    return true;
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  try {
    const nftManager = new NFTManager();
    
    switch (command) {
      case 'mint':
        if (args.length < 4) {
          console.log('Usage: node nft-unified.js mint <recipient> <tokenId> <name> <imagePath> [description]');
          return;
        }
        
        const [recipient, tokenId, name, imagePath, description] = args;
        nftManager.validateImageFile(imagePath);
        
        const result = await nftManager.mintNFT(
          recipient,
          parseInt(tokenId),
          name,
          description || `LandKrypt Property #${tokenId}`,
          imagePath
        );
        
        console.log('Minting result:', result);
        break;
        
      case 'next-id':
        const nextId = await nftManager.getNextTokenId();
        console.log(`Next available token ID: ${nextId}`);
        break;
        
      case 'metadata':
        if (args.length < 1) {
          console.log('Usage: node nft-unified.js metadata <tokenId>');
          return;
        }
        
        const metadata = await nftManager.getNFTMetadata(parseInt(args[0]));
        console.log('NFT Metadata:', JSON.stringify(metadata, null, 2));
        break;
        
      default:
        console.log(`
LandKrypt NFT Management Tool

Usage: node nft-unified.js <command> [args]

Commands:
  mint <recipient> <tokenId> <name> <imagePath> [description]
    Mint a new NFT with image and metadata
    
  next-id
    Get the next available token ID
    
  metadata <tokenId>
    Get metadata for an existing NFT

Examples:
  node nft-unified.js mint 0x123... 1 "Luxury Villa" ./images/villa.jpg "Beautiful villa in Lagos"
  node nft-unified.js next-id
  node nft-unified.js metadata 1
        `);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = NFTManager;

// Run CLI if called directly
if (require.main === module) {
  main();
}
