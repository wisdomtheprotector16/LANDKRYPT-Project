#!/usr/bin/env node

// Test script to debug IPFS image URI issues
const marketplaceData = require('./data/marketplace-listings.json');

console.log('🔍 IPFS URL Analysis for LandKrypt Marketplace\n');
console.log('='.repeat(50));

// Test IPFS URL conversion
function convertIpfsToHttp(ipfsUrl, gatewayIndex = 0) {
  const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://ipfs.infura.io/ipfs/',
    'https://nftstorage.link/ipfs/'
  ];

  if (!ipfsUrl) return null;

  // If it's already an HTTP URL, return as-is
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    return ipfsUrl;
  }

  // Extract IPFS hash from various formats
  let ipfsHash = '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    ipfsHash = ipfsUrl.replace('ipfs://', '');
  } else if (ipfsUrl.startsWith('ipfs/')) {
    ipfsHash = ipfsUrl.replace('ipfs/', '');
  } else if (ipfsUrl.startsWith('/ipfs/')) {
    ipfsHash = ipfsUrl.replace('/ipfs/', '');
  } else {
    // Assume it's already a hash
    ipfsHash = ipfsUrl;
  }

  // Remove any leading/trailing slashes
  ipfsHash = ipfsHash.replace(/^\/+|\/+$/g, '');

  // Validate IPFS hash (basic check)
  if (!ipfsHash || ipfsHash.length < 10) {
    console.warn('Invalid IPFS hash:', ipfsUrl);
    return null;
  }

  // Use specified gateway or default to first one
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  
  return `${gateway}${ipfsHash}`;
}

// Check each marketplace item
marketplaceData.forEach((item, index) => {
  console.log(`\n📄 Item ${index + 1}: ${item.title.substring(0, 50)}...`);
  console.log(`   ID: ${item.id}`);
  console.log(`   Image: ${item.image}`);
  console.log(`   TokenURI: ${item.tokenURI}`);
  console.log(`   TokenUrl: ${item.tokenUrl}`);
  
  // Test IPFS conversion for tokenURI
  if (item.tokenURI) {
    const convertedURI = convertIpfsToHttp(item.tokenURI);
    console.log(`   ✅ Converted TokenURI: ${convertedURI}`);
    
    // Test if it's accessible (simulate)
    if (convertedURI) {
      console.log(`   🌐 Gateway URL: ${convertedURI}`);
    }
  }
  
  // Test IPFS conversion for tokenUrl
  if (item.tokenUrl) {
    const convertedUrl = convertIpfsToHttp(item.tokenUrl);
    console.log(`   ✅ Converted TokenUrl: ${convertedUrl}`);
  }
  
  console.log('   ---');
});

console.log('\n📊 Summary:');
console.log(`   Total items: ${marketplaceData.length}`);
console.log(`   Items with tokenURI: ${marketplaceData.filter(item => item.tokenURI).length}`);
console.log(`   Items with tokenUrl: ${marketplaceData.filter(item => item.tokenUrl).length}`);
console.log(`   Items with image: ${marketplaceData.filter(item => item.image).length}`);

// Test specific IPFS URLs from the data
console.log('\n🧪 Testing specific IPFS URLs:');
const testUrls = [
  'ipfs://bafkreic5vn4gar25t6awooomodyxf6kbr3gmvprstb2qkdxyyiw2tc2scu',
  'ipfs://bafkreifpky7wzcuhk5pleld3jtzhhsm5yaew2hfmi5nmlspovlzgq4fkum',
  'ipfs://bafkreie5dcljjs322mzcg5rfarbkeabxes7dr7vfqfsrty3aaqnlbe5itm'
];

testUrls.forEach((url, index) => {
  console.log(`\n   Test ${index + 1}: ${url}`);
  const converted = convertIpfsToHttp(url);
  console.log(`   Result: ${converted}`);
});

console.log('\n✨ IPFS Analysis Complete!');
console.log('\n📝 Next Steps:');
console.log('   1. Check if the converted URLs are accessible in browser');
console.log('   2. Verify IpfsImage component is being used correctly');
console.log('   3. Check browser console for any errors');
console.log('   4. Test fallback gateways if primary ones fail');
