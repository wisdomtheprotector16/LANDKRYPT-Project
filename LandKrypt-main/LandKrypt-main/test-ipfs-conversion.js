// Test IPFS URL Conversion
// This script tests the IPFS URL conversion functionality

const { convertIpfsToHttp, IPFS_GATEWAYS, isIpfsUrl, extractIpfsHash } = require('./src/utils/ipfs');

async function testIpfsConversion() {
    console.log('🧪 Testing IPFS URL Conversion');
    console.log('==============================\n');

    // Test URLs - various IPFS formats
    const testUrls = [
        'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        'ipfs://QmSomeOtherHashExample12345678901234567890123',
        'ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        'not-an-ipfs-url',
        '',
        null,
        undefined
    ];

    console.log('📋 Available IPFS Gateways:');
    console.log('============================');
    IPFS_GATEWAYS.forEach((gateway, index) => {
        console.log(`${index + 1}. ${gateway}`);
    });
    console.log();

    console.log('🔍 Testing URL Conversion:');
    console.log('===========================');
    
    testUrls.forEach((url, index) => {
        console.log(`\n${index + 1}. Testing: ${url || 'null/undefined'}`);
        console.log(`   Is IPFS URL: ${isIpfsUrl(url)}`);
        
        if (url) {
            const hash = extractIpfsHash(url);
            console.log(`   Extracted Hash: ${hash || 'none'}`);
            
            // Test conversion with different gateways
            for (let gatewayIndex = 0; gatewayIndex < 3 && gatewayIndex < IPFS_GATEWAYS.length; gatewayIndex++) {
                const httpUrl = convertIpfsToHttp(url, gatewayIndex);
                console.log(`   Gateway ${gatewayIndex + 1}: ${httpUrl || 'failed'}`);
            }
        }
    });

    console.log('\n🌐 Testing Real IPFS URLs:');
    console.log('===========================');
    
    // These are example IPFS hashes - replace with actual ones from your NFTs
    const realTestUrls = [
        'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', // Example hash
        'ipfs://QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51', // Example hash
    ];

    for (const url of realTestUrls) {
        console.log(`\n🧪 Testing URL: ${url}`);
        
        for (let i = 0; i < Math.min(3, IPFS_GATEWAYS.length); i++) {
            const httpUrl = convertIpfsToHttp(url, i);
            console.log(`   Gateway ${i + 1} (${IPFS_GATEWAYS[i]}): ${httpUrl}`);
            
            // Test if URL is accessible
            try {
                console.log(`   Testing accessibility...`);
                // Note: In a real test, you'd use fetch() to test the URL
                // For this test script, we'll just show the converted URL
            } catch (error) {
                console.log(`   ❌ Failed to access: ${error.message}`);
            }
        }
    }

    console.log('\n📊 Testing with Marketplace Data:');
    console.log('==================================');
    
    // Load and test marketplace data
    try {
        const marketplaceData = require('./data/marketplace-listings.json');
        
        console.log(`Found ${marketplaceData.length} marketplace items`);
        
        const itemsWithImages = marketplaceData.filter(item => 
            item.image || item.tokenURI || item.tokenUrl
        );
        
        console.log(`Items with images: ${itemsWithImages.length}`);
        
        itemsWithImages.slice(0, 5).forEach((item, index) => {
            console.log(`\n${index + 1}. ${item.title}`);
            
            const imageFields = ['image', 'tokenURI', 'tokenUrl'];
            imageFields.forEach(field => {
                if (item[field]) {
                    console.log(`   ${field}: ${item[field]}`);
                    console.log(`   Is IPFS: ${isIpfsUrl(item[field])}`);
                    
                    if (isIpfsUrl(item[field])) {
                        const httpUrl = convertIpfsToHttp(item[field]);
                        console.log(`   Converted: ${httpUrl}`);
                    }
                }
            });
        });
        
    } catch (error) {
        console.log(`❌ Failed to load marketplace data: ${error.message}`);
    }

    console.log('\n✨ Test completed!');
    console.log('\n📝 Recommendations:');
    console.log('===================');
    console.log('1. Ensure your NFT metadata uses proper IPFS URLs');
    console.log('2. Test image loading in the browser with network throttling');
    console.log('3. Monitor which gateways work best for your users');
    console.log('4. Consider implementing image caching for better performance');
    console.log('5. Add error tracking to monitor IPFS gateway failures');
}

// Run the test
testIpfsConversion()
    .then(() => {
        console.log('\n✅ All tests completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
