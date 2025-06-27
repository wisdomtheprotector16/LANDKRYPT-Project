// Batch NFT Minting Script for LandKrypt
// This script will mint NFTs for all images in the nftimages folder

const fs = require('fs');
const path = require('path');
const { mintNFT } = require('./LandKrypt-main/LandKrypt-main/scripts/mintNFT.js');

// Configuration
const RECIPIENT_ADDRESS = '0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC';
const IMAGES_FOLDER = './nftimages';

// Property descriptions for each image
const PROPERTY_DESCRIPTIONS = {
  'WhatsApp Image 2025-06-20 at 04.26.26_a97c5884.jpg': 'Luxury Modern Apartment Complex - Premium residential property with state-of-the-art amenities and contemporary design.',
  'WhatsApp Image 2025-06-20 at 04.26.26_ccd45142.jpg': 'Executive Commercial Building - High-end office space in prime business district with modern facilities.',
  'WhatsApp Image 2025-06-20 at 04.26.27_21c4e115.jpg': 'Waterfront Villa Estate - Exclusive beachfront property with panoramic ocean views and private access.',
  'WhatsApp Image 2025-06-20 at 04.26.27_237a5395.jpg': 'Urban Residential Tower - Contemporary high-rise living with city skyline views and premium finishes.',
  'WhatsApp Image 2025-06-20 at 04.26.27_66f033c1.jpg': 'Commercial Shopping Plaza - Multi-tenant retail complex in high-traffic commercial zone.',
  'WhatsApp Image 2025-06-20 at 04.26.27_a96643cc.jpg': 'Luxury Resort Development - Exclusive hospitality property with world-class amenities and design.'
};

// Property attributes for each image
const PROPERTY_ATTRIBUTES = {
  'WhatsApp Image 2025-06-20 at 04.26.26_a97c5884.jpg': [
    { trait_type: 'Property Type', value: 'Residential' },
    { trait_type: 'Category', value: 'Apartment Complex' },
    { trait_type: 'Style', value: 'Modern' },
    { trait_type: 'Rarity', value: 'Premium' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.26_ccd45142.jpg': [
    { trait_type: 'Property Type', value: 'Commercial' },
    { trait_type: 'Category', value: 'Office Building' },
    { trait_type: 'Style', value: 'Executive' },
    { trait_type: 'Rarity', value: 'High-End' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_21c4e115.jpg': [
    { trait_type: 'Property Type', value: 'Residential' },
    { trait_type: 'Category', value: 'Villa' },
    { trait_type: 'Style', value: 'Waterfront' },
    { trait_type: 'Rarity', value: 'Exclusive' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_237a5395.jpg': [
    { trait_type: 'Property Type', value: 'Residential' },
    { trait_type: 'Category', value: 'High-Rise' },
    { trait_type: 'Style', value: 'Urban' },
    { trait_type: 'Rarity', value: 'Contemporary' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_66f033c1.jpg': [
    { trait_type: 'Property Type', value: 'Commercial' },
    { trait_type: 'Category', value: 'Retail Plaza' },
    { trait_type: 'Style', value: 'Shopping Center' },
    { trait_type: 'Rarity', value: 'Multi-Tenant' }
  ],
  'WhatsApp Image 2025-06-20 at 04.26.27_a96643cc.jpg': [
    { trait_type: 'Property Type', value: 'Hospitality' },
    { trait_type: 'Category', value: 'Resort' },
    { trait_type: 'Style', value: 'Luxury' },
    { trait_type: 'Rarity', value: 'Ultra-Premium' }
  ]
};

async function batchMintAllImages() {
  console.log('🚀 Starting batch NFT minting for all property images...\n');
  
  // Get all image files
  const imageFiles = fs.readdirSync(IMAGES_FOLDER)
    .filter(file => file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/))
    .sort(); // Sort for consistent ordering

  console.log(`📁 Found ${imageFiles.length} images to mint:`);
  imageFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  console.log('');

  const results = [];
  const errors = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const imagePath = path.join(IMAGES_FOLDER, filename);
    const tokenId = i + 1; // Start token IDs from 1
    const description = PROPERTY_DESCRIPTIONS[filename] || `LandKrypt Property #${tokenId}`;
    const attributes = PROPERTY_ATTRIBUTES[filename] || [];

    console.log(`\n🏠 Minting NFT ${i + 1}/${imageFiles.length}:`);
    console.log(`   📸 Image: ${filename}`);
    console.log(`   🏷️  Token ID: ${tokenId}`);
    console.log(`   📝 Description: ${description.substring(0, 50)}...`);
    console.log(`   👤 Recipient: ${RECIPIENT_ADDRESS}`);

    try {
      const result = await mintNFT(
        imagePath,
        tokenId,
        description,
        RECIPIENT_ADDRESS,
        attributes
      );

      results.push({
        filename,
        tokenId,
        ...result
      });

      console.log(`   ✅ Successfully minted Token #${tokenId}`);
      console.log(`   🔗 Transaction: ${result.txHash}`);
      console.log(`   📎 IPFS Image: ipfs://${result.imageCid}`);
      console.log(`   📋 IPFS Metadata: ipfs://${result.metadataCid}`);

      // Wait 3 seconds between mints to avoid rate limiting and gas issues
      if (i < imageFiles.length - 1) {
        console.log('   ⏳ Waiting 3 seconds before next mint...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error(`   ❌ Failed to mint ${filename}:`, error.message);
      errors.push({
        filename,
        tokenId,
        error: error.message
      });
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(60));
  console.log('🎉 BATCH MINTING COMPLETED!');
  console.log('='.repeat(60));
  console.log(`📊 Total Images: ${imageFiles.length}`);
  console.log(`✅ Successfully Minted: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);
  console.log(`👤 All NFTs minted to: ${RECIPIENT_ADDRESS}`);

  if (results.length > 0) {
    console.log('\n✅ SUCCESSFUL MINTS:');
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

  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    recipient: RECIPIENT_ADDRESS,
    total: imageFiles.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors
  };

  const reportPath = './batch-mint-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📁 Detailed report saved to: ${reportPath}`);

  return reportData;
}

// Execute if run directly
if (require.main === module) {
  batchMintAllImages()
    .then(report => {
      console.log('\n🎊 Batch minting process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Batch minting process failed:', error);
      process.exit(1);
    });
}

module.exports = { batchMintAllImages };
