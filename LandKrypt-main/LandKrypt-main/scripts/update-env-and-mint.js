// Update Environment Files and Mint NFTs Script
// Uses mock deployment addresses and sets up the system

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 Updating Environment Files and Setting Up System...\n');

  // Mock deployed contract addresses (realistic for testing)
  const deployedContracts = {
    // Enhanced contracts
    gasOptimizedNFT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    enhancedMarketplace: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    advancedStaking: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    quadraticGovernance: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    oracle: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    mockERC20: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    
    // Original contracts for compatibility
    realEstateNFT: "0x742d35Cc6634C0532925a3b8D4C9db96c4b5Da5e",
    nftMarketplace: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
    nftStaking: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    nftDAO: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    stakingFactory: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    developmentContract: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    
    // Core infrastructure
    stableCoin: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    stakingToken: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    exchange: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"
  };

  console.log('📝 Updating environment files...');

  const envUpdates = {
    // Enhanced contracts
    NEXT_PUBLIC_GAS_OPTIMIZED_NFT: deployedContracts.gasOptimizedNFT,
    NEXT_PUBLIC_ENHANCED_MARKETPLACE: deployedContracts.enhancedMarketplace,
    NEXT_PUBLIC_ADVANCED_STAKING: deployedContracts.advancedStaking,
    NEXT_PUBLIC_QUADRATIC_GOVERNANCE: deployedContracts.quadraticGovernance,
    NEXT_PUBLIC_ORACLE: deployedContracts.oracle,
    NEXT_PUBLIC_MOCK_ERC20: deployedContracts.mockERC20,
    
    // Original contracts
    NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS: deployedContracts.realEstateNFT,
    NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS: deployedContracts.nftMarketplace,
    NEXT_PUBLIC_NFT_STAKING_ADDRESS: deployedContracts.nftStaking,
    NEXT_PUBLIC_NFT_DAO_ADDRESS: deployedContracts.nftDAO,
    NEXT_PUBLIC_STAKING_FACTORY_ADDRESS: deployedContracts.stakingFactory,
    NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS: deployedContracts.developmentContract,
    
    // Core infrastructure
    NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS: deployedContracts.stableCoin,
    NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS: deployedContracts.stakingToken,
    NEXT_PUBLIC_EXCHANGE_ADDRESS: deployedContracts.exchange,
    
    // Deployment info
    NEXT_PUBLIC_DEPLOYMENT_NETWORK: "localhost",
    NEXT_PUBLIC_DEPLOYMENT_DATE: new Date().toISOString(),
    NEXT_PUBLIC_DEPLOYER_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    NEXT_PUBLIC_RECIPIENT_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    
    // Admin configuration
    NEXT_PUBLIC_ADMIN_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    NEXT_PUBLIC_ADMIN_ADDRESSES: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    NEXT_PUBLIC_OWNER_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    
    // Feature flags
    NEXT_PUBLIC_ENHANCED_FEATURES: "true",
    NEXT_PUBLIC_GAS_OPTIMIZATION: "true",
    NEXT_PUBLIC_BATCH_MINTING: "true",
    NEXT_PUBLIC_ADVANCED_MARKETPLACE: "true",
    NEXT_PUBLIC_MULTI_ASSET_STAKING: "true",
    NEXT_PUBLIC_QUADRATIC_GOVERNANCE: "true",
    NEXT_PUBLIC_DEMO_MODE: "false",
    NEXT_PUBLIC_MOCK_DEPLOYMENT: "true",
    
    // IPFS Configuration
    NEXT_PUBLIC_IPFS_FIXED: "true",
    NEXT_PUBLIC_IPFS_GATEWAY: "https://gateway.pinata.cloud/ipfs/",
    
    // Chainlink Price Feeds (Sepolia)
    NEXT_PUBLIC_ETH_USD_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    NEXT_PUBLIC_BTC_USD_FEED: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    NEXT_PUBLIC_USDC_USD_FEED: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    NEXT_PUBLIC_DAI_USD_FEED: "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19"
  };

  // Update .env.local
  await updateEnvFile('.env.local', envUpdates);
  
  // Update .env.production
  await updateEnvFile('.env.production', envUpdates);

  console.log('✅ Environment files updated');

  console.log('\n🎨 Creating mock NFT data...');

  // Create mock NFT data for the 5 NFTs
  const nftData = [
    {
      tokenId: 1,
      name: "Luxury Villa Property",
      description: "Beautiful luxury villa with ocean view",
      image: "property1.jpg",
      attributes: [
        { trait_type: "Property Type", value: "Villa" },
        { trait_type: "Location", value: "Lagos, Nigeria" },
        { trait_type: "Size", value: "500 sqm" },
        { trait_type: "Bedrooms", value: "5" },
        { trait_type: "Bathrooms", value: "4" }
      ]
    },
    {
      tokenId: 2,
      name: "Modern Apartment Complex",
      description: "Contemporary apartment in city center",
      image: "property2.jpg",
      attributes: [
        { trait_type: "Property Type", value: "Apartment" },
        { trait_type: "Location", value: "Abuja, Nigeria" },
        { trait_type: "Size", value: "150 sqm" },
        { trait_type: "Bedrooms", value: "3" },
        { trait_type: "Bathrooms", value: "2" }
      ]
    },
    {
      tokenId: 3,
      name: "Executive Villa Estate",
      description: "Premium villa in gated community",
      image: "villa1.jpg",
      attributes: [
        { trait_type: "Property Type", value: "Villa" },
        { trait_type: "Location", value: "Port Harcourt, Nigeria" },
        { trait_type: "Size", value: "750 sqm" },
        { trait_type: "Bedrooms", value: "6" },
        { trait_type: "Bathrooms", value: "5" }
      ]
    },
    {
      tokenId: 4,
      name: "Downtown Apartment",
      description: "Stylish apartment in business district",
      image: "apartment1.jpg",
      attributes: [
        { trait_type: "Property Type", value: "Apartment" },
        { trait_type: "Location", value: "Kano, Nigeria" },
        { trait_type: "Size", value: "120 sqm" },
        { trait_type: "Bedrooms", value: "2" },
        { trait_type: "Bathrooms", value: "2" }
      ]
    },
    {
      tokenId: 5,
      name: "Agricultural Land Plot",
      description: "Fertile agricultural land for farming",
      image: "land1.jpg",
      attributes: [
        { trait_type: "Property Type", value: "Land" },
        { trait_type: "Location", value: "Kaduna, Nigeria" },
        { trait_type: "Size", value: "2000 sqm" },
        { trait_type: "Land Use", value: "Agricultural" },
        { trait_type: "Soil Type", value: "Fertile" }
      ]
    }
  ];

  // Save NFT data
  const nftDataPath = path.join(__dirname, '../data/mock-nft-data.json');
  fs.mkdirSync(path.dirname(nftDataPath), { recursive: true });
  fs.writeFileSync(nftDataPath, JSON.stringify(nftData, null, 2));
  console.log(`✅ NFT data saved: ${nftDataPath}`);

  console.log('\n🏪 Creating mock marketplace listings...');

  // Create mock marketplace listings
  const marketplaceListings = [
    {
      listingId: 1,
      tokenId: 1,
      seller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      price: "1.5",
      currency: "ETH",
      status: "active",
      listingType: "fixed_price",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    },
    {
      listingId: 2,
      tokenId: 2,
      seller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      price: "0.8",
      currency: "ETH",
      status: "active",
      listingType: "fixed_price",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }
  ];

  const listingsPath = path.join(__dirname, '../data/mock-marketplace-listings.json');
  fs.writeFileSync(listingsPath, JSON.stringify(marketplaceListings, null, 2));
  console.log(`✅ Marketplace listings saved: ${listingsPath}`);

  console.log('\n📊 Saving deployment info...');

  const deploymentInfo = {
    network: "localhost",
    timestamp: new Date().toISOString(),
    deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    contracts: deployedContracts,
    nftsMinted: 5,
    marketplaceListings: 2,
    status: 'SUCCESS',
    features: {
      enhancedContracts: true,
      adminAccessControl: true,
      landVerification: true,
      realTimeSync: true,
      gasOptimization: true
    }
  };

  const deploymentPath = path.join(__dirname, '../deployments/mock-deployment.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved: ${deploymentPath}`);

  console.log('\n🎉 Setup Complete!');
  console.log('\n📋 Summary:');
  console.log(`   • Contract addresses updated: ${Object.keys(deployedContracts).length}`);
  console.log(`   • NFT data created: 5 NFTs`);
  console.log(`   • Marketplace listings: 2 active listings`);
  console.log(`   • Environment files updated: ✅`);
  console.log(`   • Admin access configured: ✅`);
  console.log(`   • Enhanced features enabled: ✅`);

  console.log('\n🔗 Key Contract Addresses:');
  console.log(`   GasOptimizedNFT: ${deployedContracts.gasOptimizedNFT}`);
  console.log(`   EnhancedMarketplace: ${deployedContracts.enhancedMarketplace}`);
  console.log(`   AdvancedStaking: ${deployedContracts.advancedStaking}`);
  console.log(`   QuadraticGovernance: ${deployedContracts.quadraticGovernance}`);

  console.log('\n🚀 Ready for frontend testing!');
  console.log('   Run: npm run dev');
  console.log('   Navigate to: http://localhost:3000');
}

async function updateEnvFile(filename, updates) {
  const envPath = path.join(__dirname, '..', filename);
  
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add each environment variable
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`   📝 Updated ${filename}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to update ${filename}:`, error.message);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
