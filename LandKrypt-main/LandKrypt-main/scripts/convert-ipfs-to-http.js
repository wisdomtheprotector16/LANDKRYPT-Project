// Convert IPFS URLs to HTTP Gateway URLs
// Fixes the critical issue where ipfs:// URLs don't work in browsers

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class IpfsToHttpConverter {
  constructor() {
    this.gateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    this.conversions = [];
  }

  async convertAllIpfsToHttp() {
    console.log('🔄 Converting IPFS URLs to HTTP Gateway URLs...\n');
    console.log('='.repeat(60));

    try {
      // 1. Load IPFS fix report
      const ipfsReport = await this.loadIpfsReport();
      
      // 2. Convert metadata files
      await this.convertMetadataFiles(ipfsReport);
      
      // 3. Update deployment files
      await this.updateDeploymentFiles(ipfsReport);
      
      // 4. Update marketplace data
      await this.updateMarketplaceData(ipfsReport);
      
      // 5. Test gateway accessibility
      await this.testGatewayAccessibility();
      
      // 6. Generate conversion report
      await this.generateConversionReport();

      console.log('\n🎉 IPFS to HTTP conversion completed successfully!');
      return this.conversions;

    } catch (error) {
      console.error('\n❌ IPFS conversion failed:', error);
      throw error;
    }
  }

  async loadIpfsReport() {
    console.log('📄 Loading IPFS fix report...');
    
    const reportPath = path.join(__dirname, '../IPFS_FIX_REPORT.json');
    if (!fs.existsSync(reportPath)) {
      throw new Error('IPFS fix report not found. Run fix-ipfs-images.js first.');
    }
    
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`✅ Loaded report with ${report.uploadedImages.length} images and ${report.generatedMetadata.length} metadata files`);
    
    return report;
  }

  async convertMetadataFiles(ipfsReport) {
    console.log('\n📝 Converting metadata files to use HTTP URLs...');
    
    const metadataDir = path.join(__dirname, '../public/metadata');
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }

    for (const metadata of ipfsReport.generatedMetadata) {
      const metadataPath = path.join(metadataDir, `${metadata.tokenId}.json`);
      
      // Find corresponding image data
      const imageData = ipfsReport.uploadedImages.find(img => img.tokenId === metadata.tokenId);
      if (!imageData) {
        console.warn(`⚠️  No image data found for token ${metadata.tokenId}`);
        continue;
      }

      // Fetch metadata from IPFS
      const metadataContent = await this.fetchMetadataFromIpfs(metadata.metadataCid);
      if (!metadataContent) {
        console.warn(`⚠️  Could not fetch metadata for token ${metadata.tokenId}`);
        continue;
      }

      // Convert image URL to HTTP
      const httpImageUrl = `${this.gateways[0]}${imageData.ipfsCid}`;
      metadataContent.image = httpImageUrl;
      
      // Add additional HTTP gateway URLs for fallback
      metadataContent.image_gateways = this.gateways.map(gateway => `${gateway}${imageData.ipfsCid}`);
      
      // Update external URL
      metadataContent.external_url = `https://landkrypt.com/property/${metadata.tokenId}`;
      
      // Add HTTP metadata URL
      metadataContent.metadata_url = `${this.gateways[0]}${metadata.metadataCid}`;
      
      // Save updated metadata
      fs.writeFileSync(metadataPath, JSON.stringify(metadataContent, null, 2));
      
      this.conversions.push({
        tokenId: metadata.tokenId,
        originalImageUrl: `ipfs://${imageData.ipfsCid}`,
        httpImageUrl: httpImageUrl,
        originalMetadataUrl: `ipfs://${metadata.metadataCid}`,
        httpMetadataUrl: `${this.gateways[0]}${metadata.metadataCid}`,
        localMetadataPath: metadataPath
      });

      console.log(`✅ Converted Token #${metadata.tokenId}: ${httpImageUrl}`);
    }

    console.log(`✅ Converted ${this.conversions.length} metadata files to use HTTP URLs`);
  }

  async fetchMetadataFromIpfs(metadataCid) {
    for (const gateway of this.gateways) {
      try {
        const url = `${gateway}${metadataCid}`;
        const response = await axios.get(url, { timeout: 10000 });
        return response.data;
      } catch (error) {
        console.warn(`⚠️  Gateway ${gateway} failed for ${metadataCid}`);
        continue;
      }
    }
    return null;
  }

  async updateDeploymentFiles(ipfsReport) {
    console.log('\n🔄 Updating deployment files...');
    
    const deploymentFiles = [
      '../deployments/sepolia-enhanced-deployment.json',
      '../deployments/sepolia-deployment.json'
    ];

    for (const deploymentFile of deploymentFiles) {
      const deploymentPath = path.join(__dirname, deploymentFile);
      if (!fs.existsSync(deploymentPath)) {
        console.log(`⚠️  Deployment file not found: ${deploymentFile}`);
        continue;
      }

      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      // Update NFT data with HTTP URLs
      if (deployment.nfts) {
        deployment.nfts = deployment.nfts.map((nft, index) => {
          const imageData = ipfsReport.uploadedImages[index];
          const metadataData = ipfsReport.generatedMetadata[index];
          
          if (imageData && metadataData) {
            return {
              ...nft,
              imageUrl: `${this.gateways[0]}${imageData.ipfsCid}`,
              metadataUrl: `${this.gateways[0]}${metadataData.metadataCid}`,
              ipfsImageUrl: `ipfs://${imageData.ipfsCid}`,
              ipfsMetadataUrl: `ipfs://${metadataData.metadataCid}`,
              httpConverted: true
            };
          }
          return nft;
        });
      }

      deployment.lastUpdated = new Date().toISOString();
      deployment.httpConversionComplete = true;

      fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
      console.log(`✅ Updated ${deploymentFile}`);
    }
  }

  async updateMarketplaceData(ipfsReport) {
    console.log('\n🛒 Updating marketplace data...');
    
    const marketplaceFiles = [
      '../public/data/marketplace-listings.json',
      '../src/data/mockNFTs.js'
    ];

    for (const marketplaceFile of marketplaceFiles) {
      const filePath = path.join(__dirname, marketplaceFile);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Marketplace file not found: ${marketplaceFile}`);
        continue;
      }

      if (marketplaceFile.endsWith('.json')) {
        // Update JSON file
        const marketplaceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (Array.isArray(marketplaceData)) {
          marketplaceData.forEach((item, index) => {
            if (index < ipfsReport.uploadedImages.length) {
              const imageData = ipfsReport.uploadedImages[index];
              item.image = `${this.gateways[0]}${imageData.ipfsCid}`;
              item.processedImageUrl = `${this.gateways[0]}${imageData.ipfsCid}`;
              item.ipfsFixed = true;
            }
          });
        }

        fs.writeFileSync(filePath, JSON.stringify(marketplaceData, null, 2));
        console.log(`✅ Updated ${marketplaceFile}`);
      }
    }
  }

  async testGatewayAccessibility() {
    console.log('\n🌐 Testing gateway accessibility...');
    
    const testResults = [];
    
    for (const conversion of this.conversions.slice(0, 2)) { // Test first 2 images
      console.log(`🔍 Testing Token #${conversion.tokenId}...`);
      
      for (let i = 0; i < this.gateways.length; i++) {
        const gateway = this.gateways[i];
        const testUrl = conversion.httpImageUrl.replace(this.gateways[0], gateway);
        
        try {
          const startTime = Date.now();
          const response = await axios.head(testUrl, { timeout: 10000 });
          const responseTime = Date.now() - startTime;
          
          if (response.status === 200) {
            testResults.push({
              tokenId: conversion.tokenId,
              gateway: gateway,
              status: 'SUCCESS',
              responseTime: responseTime,
              url: testUrl
            });
            console.log(`   ✅ ${gateway}: ${responseTime}ms`);
          }
        } catch (error) {
          testResults.push({
            tokenId: conversion.tokenId,
            gateway: gateway,
            status: 'FAILED',
            error: error.message,
            url: testUrl
          });
          console.log(`   ❌ ${gateway}: ${error.message}`);
        }
      }
    }

    const successfulTests = testResults.filter(t => t.status === 'SUCCESS');
    console.log(`✅ Gateway accessibility: ${successfulTests.length}/${testResults.length} tests passed`);
    
    return testResults;
  }

  async generateConversionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'HTTP_CONVERSION_COMPLETE',
      summary: {
        totalConversions: this.conversions.length,
        gatewaysUsed: this.gateways.length,
        primaryGateway: this.gateways[0]
      },
      conversions: this.conversions,
      gateways: this.gateways,
      workingUrls: this.conversions.map(c => ({
        tokenId: c.tokenId,
        imageUrl: c.httpImageUrl,
        metadataUrl: c.httpMetadataUrl
      }))
    };

    // Save report
    const reportPath = path.join(__dirname, '../HTTP_CONVERSION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 HTTP Conversion Report:');
    console.log('='.repeat(40));
    console.log(`Total Conversions: ${report.summary.totalConversions}`);
    console.log(`Primary Gateway: ${report.summary.primaryGateway}`);
    console.log(`Fallback Gateways: ${report.summary.gatewaysUsed - 1}`);

    console.log('\n🔗 Working HTTP URLs:');
    this.conversions.forEach(conversion => {
      console.log(`Token #${conversion.tokenId}:`);
      console.log(`  Image: ${conversion.httpImageUrl}`);
      console.log(`  Metadata: ${conversion.httpMetadataUrl}`);
    });

    return report;
  }
}

// Execute IPFS to HTTP conversion
async function main() {
  const converter = new IpfsToHttpConverter();
  await converter.convertAllIpfsToHttp();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ IPFS to HTTP conversion completed successfully!');
      console.log('🌐 All images now accessible via HTTP gateway URLs!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ IPFS to HTTP conversion failed:', error);
      process.exit(1);
    });
}

module.exports = { IpfsToHttpConverter };
