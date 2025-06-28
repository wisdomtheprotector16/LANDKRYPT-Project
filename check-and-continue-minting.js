// Check existing NFTs and continue minting
const { ethers } = require('ethers');
const { mintNFT } = require('./LandKrypt-main/LandKrypt-main/scripts/mintNFT.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const RECIPIENT_ADDRESS = '0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC';
const IMAGES_FOLDER = './nftimages';

// Land plot descriptions
const PROPERTY_DESCRIPTIONS = {
  'WhatsApp Image 2025-06-20 at 04.26.26_a97c5884.jpg': 'Prime Agricultural Land in Tuscany, Italy - 50 hectares of fertile vineyard territory with rolling hills, perfect soil composition for premium wine production, and panoramic views of the Italian countryside.',
  'WhatsApp Image 2025-06-20 at 04.26.26_ccd45142.jpg': 'Coastal Development Plot in Malibu, California - 25 acres of pristine beachfront land with direct Pacific Ocean access, approved for luxury residential development, and unobstructed sunset views.',
  'WhatsApp Image 2025-06-20 at 04.26.27_21c4e115.jpg': 'Rainforest Conservation Land in Costa Rica - 100 hectares of protected tropical rainforest with diverse wildlife, natural springs, and sustainable eco-tourism development potential.',
  'WhatsApp Image 2025-06-20 at 04.26.27_237a5395.jpg': 'Urban Development Plot in Tokyo, Japan - 15,000 square meters in prime Shibuya district with high-rise development rights, excellent transportation access, and commercial zoning approval.',
  'WhatsApp Image 2025-06-20 at 04.26.27_66f033c1.jpg': 'Outback Mining Territory in Western Australia - 500 hectares with proven mineral deposits, existing mining rights, and access to transportation infrastructure for resource extraction.',
  'WhatsApp Image 2025-06-20 at 04.26.27_a96643cc.jpg': 'Alpine Ski Resort Land in Swiss Alps - 200 hectares of pristine mountain terrain with ski slope development rights, chairlift access, and year-round recreational opportunities.'
};

// Land plot attributes
const PROPERTY_ATTRIBUTES = {
  'WhatsApp Image 2025-06-20 at 04.26.26_a97c5884.jpg': [
    { trait_type: 'Land Type', value: 'Agricultural' },
    { trait_type: 'Location', value: 'Tuscany, Italy' },
    { trait_type: 'Size', value: '50 Hectares' },
    { trait_type: 'Use Case', value: 'Vineyard' },
    { trait_type: 'Climate', value: 'Mediterranean' },
    { trait_type: 'Rarity', value: 'Premium Wine Region' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.26_ccd45142.jpg': [
    { trait_type: 'Land Type', value: 'Coastal Development' },
    { trait_type: 'Location', value: 'Malibu, California' },
    { trait_type: 'Size', value: '25 Acres' },
    { trait_type: 'Use Case', value: 'Luxury Residential' },
    { trait_type: 'Feature', value: 'Beachfront Access' },
    { trait_type: 'Rarity', value: 'Exclusive Coastline' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_21c4e115.jpg': [
    { trait_type: 'Land Type', value: 'Conservation' },
    { trait_type: 'Location', value: 'Costa Rica' },
    { trait_type: 'Size', value: '100 Hectares' },
    { trait_type: 'Use Case', value: 'Eco-Tourism' },
    { trait_type: 'Ecosystem', value: 'Tropical Rainforest' },
    { trait_type: 'Rarity', value: 'Protected Biodiversity' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_237a5395.jpg': [
    { trait_type: 'Land Type', value: 'Urban Development' },
    { trait_type: 'Location', value: 'Tokyo, Japan' },
    { trait_type: 'Size', value: '15,000 SqM' },
    { trait_type: 'Use Case', value: 'High-Rise Commercial' },
    { trait_type: 'District', value: 'Shibuya' },
    { trait_type: 'Rarity', value: 'Prime City Center' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_66f033c1.jpg': [
    { trait_type: 'Land Type', value: 'Mining Territory' },
    { trait_type: 'Location', value: 'Western Australia' },
    { trait_type: 'Size', value: '500 Hectares' },
    { trait_type: 'Use Case', value: 'Resource Extraction' },
    { trait_type: 'Resource', value: 'Mineral Deposits' },
    { trait_type: 'Rarity', value: 'Proven Reserves' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_a96643cc.jpg': [
    { trait_type: 'Land Type', value: 'Alpine Recreation' },
    { trait_type: 'Location', value: 'Swiss Alps' },
    { trait_type: 'Size', value: '200 Hectares' },
    { trait_type: 'Use Case', value: 'Ski Resort' },
    { trait_type: 'Elevation', value: 'High Altitude' },
    { trait_type: 'Rarity', value: 'Premium Alpine Access' }
  ]
};

async function main() {
  console.log('🔍 Checking existing NFTs and continuing minting...\n');
  
  // Setup provider
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  const nft = new ethers.Contract(process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS, [
    'function isThereTokenId(uint256 tokenId) external view returns (bool)',
    'function ownerOf(uint256 tokenId) external view returns (address)'
  ], provider);
  
  // Get all image files
  const imageFiles = fs.readdirSync(IMAGES_FOLDER)
    .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/))
    .sort();
  
  console.log(`📁 Found ${imageFiles.length} images total\n`);
  
  // Check which NFTs already exist
  const existingNFTs = [];
  const toMint = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const tokenId = i + 1;
    const filename = imageFiles[i];
    
    try {
      const exists = await nft.isThereTokenId(tokenId);
      if (exists) {
        const owner = await nft.ownerOf(tokenId);
        console.log(`✅ Token #${tokenId} already exists - Owner: ${owner}`);
        existingNFTs.push({ tokenId, filename, owner });
      } else {
        console.log(`⏳ Token #${tokenId} needs to be minted - ${filename}`);
        toMint.push({ tokenId, filename });
      }
    } catch (error) {
      console.log(`⏳ Token #${tokenId} needs to be minted - ${filename}`);
      toMint.push({ tokenId, filename });
    }
  }
  
  console.log(`\n📊 Status: ${existingNFTs.length} already minted, ${toMint.length} to mint\n`);
  
  if (toMint.length === 0) {
    console.log('🎉 All NFTs are already minted!');
    return;
  }
  
  // Mint remaining NFTs
  console.log('🚀 Starting to mint remaining NFTs...\n');
  const results = [];
  const errors = [];
  
  for (let i = 0; i < toMint.length; i++) {
    const { tokenId, filename } = toMint[i];
    const imagePath = path.join(IMAGES_FOLDER, filename);
    const description = PROPERTY_DESCRIPTIONS[filename] || `LandKrypt Land Plot #${tokenId}`;
    const attributes = PROPERTY_ATTRIBUTES[filename] || [];
    
    console.log(`🏠 Minting NFT ${i + 1}/${toMint.length}:`);
    console.log(`   📸 Image: ${filename}`);
    console.log(`   🏷️  Token ID: ${tokenId}`);
    console.log(`   📝 Description: ${description.substring(0, 60)}...`);
    
    try {
      const result = await mintNFT(imagePath, tokenId, description, RECIPIENT_ADDRESS, attributes);
      
      results.push({ filename, tokenId, ...result });
      console.log(`   ✅ Successfully minted Token #${tokenId}`);
      console.log(`   🔗 Transaction: ${result.txHash}`);
      console.log(`   📎 IPFS Image: ipfs://${result.imageCid}`);
      console.log(`   📋 IPFS Metadata: ipfs://${result.metadataCid}`);
      
      // Wait 3 seconds between mints
      if (i < toMint.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next mint...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to mint ${filename}:`, error.message);
      errors.push({ filename, tokenId, error: error.message });
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎊 MINTING PROCESS COMPLETED!');
  console.log('='.repeat(60));
  console.log(`📊 Total Images: ${imageFiles.length}`);
  console.log(`✅ Previously Minted: ${existingNFTs.length}`);
  console.log(`🆕 Newly Minted: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);
  console.log(`👤 All NFTs owned by: ${RECIPIENT_ADDRESS}`);
  
  if (results.length > 0) {
    console.log('\n🆕 NEWLY MINTED NFTs:');
    results.forEach(result => {
      console.log(`   🏠 Token #${result.tokenId}: ${result.filename}`);
      console.log(`      🔗 TX: ${result.txHash}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ FAILED MINTS:');
    errors.forEach(error => {
      console.log(`   🏠 Token #${error.tokenId}: ${error.filename}`);
      console.log(`      ❌ Error: ${error.error}`);
    });
  }
  
  // Save complete report
  const reportData = {
    timestamp: new Date().toISOString(),
    recipient: RECIPIENT_ADDRESS,
    total: imageFiles.length,
    existing: existingNFTs.length,
    newlyMinted: results.length,
    failed: errors.length,
    existingNFTs,
    newResults: results,
    errors
  };
  
  const reportPath = './complete-mint-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📁 Complete report saved to: ${reportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
