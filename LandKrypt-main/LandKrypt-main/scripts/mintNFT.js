// LandKrypt NFT Minting Script with IPFS Integration
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { ethers } = require('ethers');
require('dotenv').config();

// NFT Metadata structure
class NFTMetadata {
  constructor(name, description, image, attributes = []) {
    this.name = name;
    this.description = description;
    this.image = image;
    this.attributes = attributes;
    this.external_url = process.env.NEXT_PUBLIC_APP_URL || 'https://landkrypt.com';
  }
}

// Environment variable validation
function getRequiredEnvVar(name, fallback = null) {
  const value = process.env[name];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${name} not set`);
  }
  return value || fallback;
}

// Main minting function
async function mintNFT(imagePath, tokenId, description, recipient, attributes = []) {
  console.log('🚀 Starting NFT minting process...');
  
  // Validate inputs
  if (!imagePath || !tokenId || !description || !recipient) {
    throw new Error('Missing required arguments: imagePath, tokenId, description, or recipient');
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  try {
    // Load configuration from environment
    const config = {
      pinataApiKey: getRequiredEnvVar('PINATA_API_KEY'),
      pinataApiSecret: getRequiredEnvVar('PINATA_SECRET_API_KEY'),
      rpcUrl: getRequiredEnvVar('ALCHEMY_SEPOLIA_URL'),
      contractAddress: getRequiredEnvVar('NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS'),
      ownerPrivateKey: getRequiredEnvVar('DEPLOYER_PRIVATE_KEY'),
    };

    console.log(`📝 Minting NFT #${tokenId} for ${recipient}`);

    // Step 1: Upload image to IPFS
    console.log('📤 Uploading image to IPFS...');
    const imageCid = await uploadToPinata(imagePath, config.pinataApiKey, config.pinataApiSecret);
    console.log(`✅ Image uploaded: ipfs://${imageCid}`);

    // Step 2: Generate and upload metadata
    console.log('📝 Creating and uploading metadata...');
    const metadataCid = await createAndUploadMetadata(
      tokenId, 
      description, 
      imageCid, 
      attributes, 
      config
    );
    console.log(`✅ Metadata uploaded: ipfs://${metadataCid}`);

    // Step 3: Mint NFT on blockchain
    console.log('⛓️  Minting NFT on blockchain...');
    const txHash = await mintNFTOnChain(
      recipient, 
      tokenId, 
      description, 
      metadataCid, 
      config
    );
    console.log(`🎉 NFT minted successfully!`);
    console.log(`🔗 Transaction Hash: ${txHash}`);

    // Step 4: Save minting record
    await saveMintingRecord({
      tokenId,
      recipient,
      description,
      imageCid,
      metadataCid,
      txHash,
      timestamp: new Date().toISOString()
    });

    return {
      tokenId,
      txHash,
      imageCid,
      metadataCid,
      recipient
    };

  } catch (error) {
    console.error('❌ Minting failed:', error);
    throw error;
  }
}

// Upload file to Pinata IPFS
async function uploadToPinata(filePath, apiKey, apiSecret) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
  });

  // Add pinning options
  const pinataOptions = {
    cidVersion: 1,
    customPinPolicy: {
      regions: [
        {
          id: 'FRA1',
          desiredReplicationCount: 2
        }
      ]
    }
  };
  formData.append('pinataOptions', JSON.stringify(pinataOptions));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
      maxBodyLength: Infinity,
    }
  );

  if (response.status !== 200) {
    throw new Error(`Pinata upload failed: ${response.status} ${JSON.stringify(response.data)}`);
  }

  return response.data.IpfsHash;
}

// Create and upload metadata to IPFS
async function createAndUploadMetadata(tokenId, description, imageCid, attributes, config) {
  const metadata = new NFTMetadata(
    `LandKrypt Property #${tokenId}`,
    description,
    `ipfs://${imageCid}`,
    [
      {
        trait_type: "Property Type",
        value: "Real Estate"
      },
      {
        trait_type: "Token ID", 
        value: tokenId.toString()
      },
      {
        trait_type: "Platform",
        value: "LandKrypt"
      },
      ...attributes
    ]
  );

  // Create temporary metadata file
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `metadata-${tokenId}-${Date.now()}.json`);
  fs.writeFileSync(tempFilePath, JSON.stringify(metadata, null, 2));

  try {
    return await uploadToPinata(tempFilePath, config.pinataApiKey, config.pinataApiSecret);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Mint NFT on blockchain
async function mintNFTOnChain(recipient, tokenId, description, metadataCid, config) {
  // Connect to Ethereum provider (ethers v6 syntax)
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Create wallet from private key (ethers v6 syntax)
  const wallet = new ethers.Wallet(config.ownerPrivateKey, provider);
  
  // Load contract ABI
  const contractABI = [
    "function mint(address to, uint256 tokenId, string memory description, string memory ipfsHash) external",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function isThereTokenId(uint256 tokenId) external view returns (bool)"
  ];

  // Create contract instance
  const contract = new ethers.Contract(
    config.contractAddress,
    contractABI,
    wallet
  );

  // Check if token ID already exists
  const tokenExists = await contract.isThereTokenId(tokenId);
  if (tokenExists) {
    throw new Error(`Token ID ${tokenId} already exists`);
  }

  // Estimate gas
  const gasEstimate = await contract.mint.estimateGas(
    recipient,
    tokenId,
    description,
    metadataCid
  );

  // Add 20% buffer to gas estimate (ethers v6 syntax)
  const gasLimit = (gasEstimate * 120n) / 100n;

  // Get current gas price and fee data
  const feeData = await provider.getFeeData();
  
  // Prepare transaction options
  const txOptions = {
    gasLimit,
  };

  // Use EIP-1559 if available, otherwise use legacy gas price
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    txOptions.maxFeePerGas = (feeData.maxFeePerGas * 110n) / 100n; // 10% higher
    txOptions.maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 110n) / 100n;
  } else if (feeData.gasPrice) {
    txOptions.gasPrice = (feeData.gasPrice * 110n) / 100n; // 10% higher than current gas price
  }

  // Send transaction
  const tx = await contract.mint(
    recipient,
    tokenId,
    description,
    metadataCid,
    txOptions
  );

  console.log(`⏳ Transaction sent: ${tx.hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  // Wait for transaction confirmation
  const receipt = await tx.wait();
  
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

  return tx.hash;
}

// Save minting record for tracking
async function saveMintingRecord(record) {
  const recordsDir = path.join(__dirname, '..', 'records');
  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
  }

  const recordFile = path.join(recordsDir, 'minting-records.json');
  let records = [];
  
  if (fs.existsSync(recordFile)) {
    try {
      records = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not read existing records file');
    }
  }

  records.push(record);
  fs.writeFileSync(recordFile, JSON.stringify(records, null, 2));
  console.log(`📁 Minting record saved`);
}

// Batch minting function
async function batchMintNFTs(mintingData) {
  console.log(`🔄 Starting batch minting of ${mintingData.length} NFTs...`);
  
  const results = [];
  const errors = [];

  for (let i = 0; i < mintingData.length; i++) {
    const data = mintingData[i];
    console.log(`\n🔄 Minting NFT ${i + 1}/${mintingData.length}`);
    
    try {
      const result = await mintNFT(
        data.imagePath,
        data.tokenId,
        data.description,
        data.recipient,
        data.attributes
      );
      results.push(result);
      
      // Wait 2 seconds between mints to avoid rate limiting
      if (i < mintingData.length - 1) {
        console.log('⏳ Waiting 2 seconds before next mint...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to mint NFT ${data.tokenId}:`, error.message);
      errors.push({
        tokenId: data.tokenId,
        error: error.message
      });
    }
  }

  console.log(`\n🎉 Batch minting completed!`);
  console.log(`✅ Successfully minted: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Failed mints:');
    errors.forEach(err => console.log(`  - Token ${err.tokenId}: ${err.error}`));
  }

  return { results, errors };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log(`
Usage: node mintNFT.js <imagePath> <tokenId> <description> <recipient> [attributes]

Examples:
  node mintNFT.js ./images/property1.jpg 1 "Luxury villa in Lagos" 0x123...
  node mintNFT.js ./images/property2.jpg 2 "Commercial building" 0x456... '[{"trait_type":"Location","value":"Lagos"}]'
`);
    process.exit(1);
  }

  const [imagePath, tokenId, description, recipient, attributesJson] = args;
  let attributes = [];
  
  if (attributesJson) {
    try {
      attributes = JSON.parse(attributesJson);
    } catch (error) {
      console.error('Invalid attributes JSON:', error.message);
      process.exit(1);
    }
  }

  mintNFT(imagePath, parseInt(tokenId), description, recipient, attributes)
    .then(result => {
      console.log('\n✅ Minting completed successfully!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Minting failed:', error.message);
      process.exit(1);
    });
}

module.exports = { 
  mintNFT, 
  batchMintNFTs, 
  uploadToPinata, 
  createAndUploadMetadata,
  mintNFTOnChain 
};
