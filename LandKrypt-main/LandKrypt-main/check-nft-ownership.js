// Check NFT Ownership and Descriptions
const { ethers } = require('ethers');
require('dotenv').config();

async function checkNFTs() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const nftContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
      [
        'function ownerOf(uint256 tokenId) external view returns (address)',
        'function getTokenDescription(uint256 tokenId) external view returns (string)',
        'function tokenURI(uint256 tokenId) external view returns (string)'
      ],
      provider
    );
    
    console.log('🔍 Checking NFT ownership and descriptions...\n');
    console.log(`NFT Contract: ${process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS}`);
    console.log(`Deployer Address: 0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC\n`);
    
    for (let i = 1; i <= 10; i++) {
      try {
        const owner = await nftContract.ownerOf(i);
        console.log(`Token ${i}: Owner = ${owner}`);
        
        try {
          const description = await nftContract.getTokenDescription(i);
          console.log(`  Description: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`);
        } catch (e) {
          console.log(`  Description: Error getting description - ${e.message}`);
        }

        try {
          const tokenURI = await nftContract.tokenURI(i);
          console.log(`  Token URI: ${tokenURI}`);
        } catch (e) {
          console.log(`  Token URI: Error getting URI`);
        }
        console.log('');
      } catch (e) {
        console.log(`Token ${i}: Does not exist or error - ${e.message}\n`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNFTs();
