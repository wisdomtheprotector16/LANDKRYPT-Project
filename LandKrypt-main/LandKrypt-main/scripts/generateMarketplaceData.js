// LandKrypt Marketplace Data Generator
const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load contract ABIs
const NFTMarketplaceABI = require('../src/contracts/abis').NFT_MARKETPLACE_ABI;
const RealEstateNFTABI = require('../src/contracts/abis').REAL_ESTATE_NFT_ABI;

async function generateMarketplaceListings() {
  console.log('🔍 Starting NFT marketplace listings generation...');
  const startTime = Date.now();
  
  try {
    // Load configuration from environment
    const config = {
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || process.env.ALCHEMY_SEPOLIA_URL,
      marketplaceAddress: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
      nftAddress: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
      outputDir: path.join(__dirname, '..', 'src', 'data')
    };

    // Validate configuration
    if (!config.rpcUrl) {
      throw new Error('RPC URL not configured. Set NEXT_PUBLIC_RPC_URL or ALCHEMY_SEPOLIA_URL');
    }
    if (!config.marketplaceAddress) {
      throw new Error('Marketplace address not configured. Deploy contracts first.');
    }
    if (!config.nftAddress) {
      throw new Error('NFT contract address not configured. Deploy contracts first.');
    }

    // Initialize provider  
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Load contracts
    const marketplace = new ethers.Contract(
      config.marketplaceAddress,
      NFTMarketplaceABI,
      provider
    );
    
    const nftContract = new ethers.Contract(
      config.nftAddress,
      RealEstateNFTABI,
      provider
    );

    // Get total NFT supply
    const totalSupply = await nftContract.totalSupply();
    const totalTokens = Number(totalSupply);
    console.log(`📊 Found ${totalTokens} NFTs in collection`);
    
    if (totalTokens === 0) {
      console.log('⚠️  No NFTs found. Generating mock data instead...');
      return generateMockData(config.outputDir);
    }
    
    // Process all tokens in batches
    const listings = [];
    const batchSize = 50;
    
    for (let tokenId = 1; tokenId <= totalTokens; tokenId += batchSize) {
      const batchEnd = Math.min(tokenId + batchSize - 1, totalTokens);
      const batchListings = await processTokenBatch(
        nftContract, 
        marketplace, 
        tokenId, 
        batchEnd
      );
      
      listings.push(...batchListings);
      console.log(`✅ Processed tokens ${tokenId}-${batchEnd-1}: Found ${batchListings.length} active listings`);
    }

    // Save to files
    await saveData(config.outputDir, listings);
    
    console.log(`🎉 Success! Generated ${listings.length} listings`);
    console.log(`⏱️  Completed in ${(Date.now() - startTime)/1000} seconds`);
    
    return listings;
  } catch (error) {
    console.error('❌ Generation failed:', error);
    
    // Fallback to mock data generation
    console.log('🔄 Falling back to mock data generation...');
    return generateMockData(path.join(__dirname, '..', 'src', 'data'));
  }
}

async function processTokenBatch(nftContract, marketplace, startId, endId) {
  const batchPromises = [];
  
  for (let tokenId = startId; tokenId <= endId; tokenId++) {
    batchPromises.push(getTokenListing(nftContract, marketplace, tokenId));
  }
  
  const batchResults = await Promise.allSettled(batchPromises);
  return batchResults
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);
}

async function getTokenListing(nftContract, marketplace, tokenId) {
  try {
    // Check token existence
    const exists = await nftContract.isThereTokenId(tokenId);
    if (!exists) return null;

    // Check listing status
    const isListed = await marketplace.listedBool(tokenId);
    if (!isListed) return null;

    // Fetch all data in parallel
    const [listing, tokenURI, owner, origPrice, description] = await Promise.allSettled([
      marketplace.listings(tokenId),
      nftContract.tokenURI(tokenId),
      marketplace.tokenIdToOwner(tokenId),
      marketplace.getOriginalPrice(tokenId),
      nftContract.getTokenDescription(tokenId)
    ]);

    return {
      id: tokenId,
      tokenId: tokenId.toString(),
      title: `Property #${tokenId}`,
      description: description.status === 'fulfilled' ? description.value : `Real estate property ${tokenId}`,
      tokenUrl: tokenURI.status === 'fulfilled' ? tokenURI.value : `https://nft-metadata.landkrypt.com/${tokenId}.json`,
      price: listing.status === 'fulfilled' ? listing.value.price.toString() : '0',
      stakingContract: listing.status === 'fulfilled' ? listing.value.stakingContract : ethers.ZeroAddress,
      isListed: listing.status === 'fulfilled' ? listing.value.isListed : false,
      owner: owner.status === 'fulfilled' ? owner.value : ethers.ZeroAddress,
      originalPrice: origPrice.status === 'fulfilled' ? origPrice.value.toString() : '0',
      location: `Property Location ${tokenId}`,
      image: `/nfts/nft${(tokenId % 9) + 1}.${tokenId % 3 === 0 ? 'png' : 'jpg'}`,
      tag: tokenId % 2 === 0 ? 'LUXURY VILLA' : 'COMMERCIAL',
      category: tokenId % 2 === 0 ? 'residential' : 'commercial',
      staking: true,
      type: tokenId % 2 === 0 ? 'rwa' : 'digital asset',
      shares: `${Math.floor(Math.random() * 30) + 15} Shares`
    };
  } catch (error) {
    console.error(`⚠️  Error processing token ${tokenId}:`, error.message);
    return null;
  }
}

async function generateMockData(outputDir) {
  console.log('📝 Generating mock marketplace data...');
  
  const locations = [
    'Banana Island, Lagos, Nigeria',
    'Victoria Island, Lagos, Nigeria', 
    'Lekki, Lagos, Nigeria',
    'Ikoyi, Lagos, Nigeria',
    'Abuja, FCT, Nigeria'
  ];

  const propertyTypes = [
    { tag: 'LUXURY VILLA', category: 'residential', type: 'rwa' },
    { tag: 'COMMERCIAL', category: 'commercial', type: 'digital asset' },
    { tag: 'RESIDENTIAL', category: 'residential', type: 'rwa' },
    { tag: 'OFFICE SPACE', category: 'commercial', type: 'digital asset' }
  ];

  const mockListings = [];
  
  for (let i = 1; i <= 12; i++) {
    const propType = propertyTypes[i % propertyTypes.length];
    const basePrice = Math.floor(Math.random() * 200000) + 150000;
    
    mockListings.push({
      id: i,
      tokenId: i.toString(),
      title: `${propType.tag.charAt(0) + propType.tag.slice(1).toLowerCase()} Property #${i}`,
      description: `Premium ${propType.category} property with excellent investment potential`,
      location: locations[i % locations.length],
      price: `${basePrice.toLocaleString()} LKUSD staked`,
      shares: `${Math.floor(Math.random() * 30) + 15} Shares`,
      image: `/nfts/nft${(i % 9) + 1}.${i % 3 === 0 ? 'png' : 'jpg'}`,
      tag: propType.tag,
      category: propType.category,
      staking: true,
      type: propType.type,
      stakingContract: `0x${Math.random().toString(16).substr(2, 40)}`,
      isListed: true,
      owner: `0x${Math.random().toString(16).substr(2, 40)}`,
      originalPrice: basePrice.toString(),
      tokenUrl: `https://nft-metadata.landkrypt.com/${i}.json`
    });
  }

  await saveData(outputDir, mockListings);
  console.log(`✅ Generated ${mockListings.length} mock listings`);
  return mockListings;
}

async function saveData(outputDir, listings) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save main listings file
  const listingsFile = path.join(outputDir, 'nft-listings.json');
  fs.writeFileSync(listingsFile, JSON.stringify(listings, null, 2));

  // Generate and save categorized data
  const categories = {
    all: listings,
    rwa: listings.filter(item => item.type === 'rwa'),
    'digital asset': listings.filter(item => item.type === 'digital asset'),
    residential: listings.filter(item => item.category === 'residential'),
    commercial: listings.filter(item => item.category === 'commercial')
  };

  Object.entries(categories).forEach(([category, items]) => {
    const categoryFile = path.join(outputDir, `${category.replace(' ', '-')}-listings.json`);
    fs.writeFileSync(categoryFile, JSON.stringify(items, null, 2));
  });

  // Generate summary statistics
  const summary = {
    total: listings.length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([key, items]) => [key, items.length])
    ),
    totalValue: listings.reduce((sum, item) => {
      const price = parseInt(item.originalPrice || item.price.replace(/[^\d]/g, '') || '0');
      return sum + price;
    }, 0),
    lastUpdated: new Date().toISOString()
  };

  const summaryFile = path.join(outputDir, 'marketplace-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log(`📁 Data saved to ${outputDir}`);
  console.log(`📊 Summary: ${summary.total} listings, ${summary.categories.rwa} RWA, ${summary.categories['digital asset']} digital assets`);
}

// Execute when run directly
if (require.main === module) {
  generateMarketplaceListings()
    .then(() => {
      console.log('✅ Marketplace data generation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateMarketplaceListings, generateMockData };
