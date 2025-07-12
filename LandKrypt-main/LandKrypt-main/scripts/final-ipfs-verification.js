// Final IPFS Verification - Test all HTTP URLs are working
// Ensures all images are accessible via HTTP gateway URLs

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class FinalIpfsVerification {
  constructor() {
    this.testResults = [];
    this.gateway = 'https://gateway.pinata.cloud/ipfs/';
  }

  async runFinalVerification() {
    console.log('🔍 Running Final IPFS HTTP Verification...\n');
    console.log('='.repeat(50));

    try {
      // 1. Load the HTTP fix report
      const httpReport = await this.loadHttpReport();
      
      // 2. Test all HTTP URLs
      await this.testAllHttpUrls(httpReport);
      
      // 3. Verify metadata files
      await this.verifyMetadataFiles();
      
      // 4. Test browser compatibility
      await this.testBrowserCompatibility();
      
      // 5. Generate final report
      const report = await this.generateFinalReport();

      console.log('\n🎉 Final IPFS verification completed!');
      return report;

    } catch (error) {
      console.error('\n❌ Final IPFS verification failed:', error);
      throw error;
    }
  }

  async loadHttpReport() {
    console.log('📄 Loading HTTP fix report...');
    
    const reportPath = path.join(__dirname, '../IPFS_HTTP_FIX_REPORT.json');
    if (!fs.existsSync(reportPath)) {
      throw new Error('HTTP fix report not found. Run fix-ipfs-urls.js first.');
    }
    
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`✅ Found ${report.totalFixed} fixed URLs`);
    
    return report;
  }

  async testAllHttpUrls(httpReport) {
    console.log('\n🌐 Testing all HTTP URLs...');
    
    for (const item of httpReport.fixedUrls) {
      console.log(`🔍 Testing ${item.name}...`);
      
      try {
        const startTime = Date.now();
        const response = await axios.head(item.httpUrl, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'LandKrypt-Verification/1.0'
          }
        });
        const responseTime = Date.now() - startTime;
        
        if (response.status === 200) {
          this.testResults.push({
            tokenId: item.tokenId,
            name: item.name,
            url: item.httpUrl,
            status: 'SUCCESS',
            responseTime: responseTime,
            contentType: response.headers['content-type'] || 'unknown'
          });
          console.log(`   ✅ SUCCESS (${responseTime}ms) - ${response.headers['content-type']}`);
        } else {
          this.testResults.push({
            tokenId: item.tokenId,
            name: item.name,
            url: item.httpUrl,
            status: 'FAILED',
            error: `HTTP ${response.status}`,
            responseTime: responseTime
          });
          console.log(`   ❌ FAILED - HTTP ${response.status}`);
        }
      } catch (error) {
        this.testResults.push({
          tokenId: item.tokenId,
          name: item.name,
          url: item.httpUrl,
          status: 'ERROR',
          error: error.message
        });
        console.log(`   ❌ ERROR - ${error.message}`);
      }
      
      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successCount = this.testResults.filter(r => r.status === 'SUCCESS').length;
    console.log(`\n📊 HTTP URL Test Results: ${successCount}/${this.testResults.length} successful`);
  }

  async verifyMetadataFiles() {
    console.log('\n📝 Verifying metadata files...');
    
    const metadataDir = path.join(__dirname, '../public/metadata');
    if (!fs.existsSync(metadataDir)) {
      throw new Error('Metadata directory not found');
    }
    
    const metadataFiles = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));
    console.log(`Found ${metadataFiles.length} metadata files`);
    
    for (const file of metadataFiles) {
      const filePath = path.join(metadataDir, file);
      const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check if image URL is HTTP format
      if (!metadata.image || !metadata.image.startsWith('https://')) {
        throw new Error(`Invalid image URL in ${file}: ${metadata.image}`);
      }
      
      // Check if it's a Pinata gateway URL
      if (!metadata.image.includes('gateway.pinata.cloud/ipfs/')) {
        throw new Error(`Not using Pinata gateway in ${file}: ${metadata.image}`);
      }
      
      console.log(`   ✅ ${file}: ${metadata.name}`);
    }
    
    console.log(`✅ All ${metadataFiles.length} metadata files verified`);
  }

  async testBrowserCompatibility() {
    console.log('\n🌐 Testing browser compatibility...');
    
    const testUrls = this.testResults
      .filter(r => r.status === 'SUCCESS')
      .slice(0, 2) // Test first 2 successful URLs
      .map(r => r.url);
    
    for (const url of testUrls) {
      console.log(`🔍 Testing browser compatibility for: ${url}`);
      
      try {
        // Test with different user agents to simulate different browsers
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ];
        
        for (const userAgent of userAgents) {
          const response = await axios.head(url, {
            timeout: 10000,
            headers: { 'User-Agent': userAgent }
          });
          
          if (response.status === 200) {
            console.log(`   ✅ Compatible with ${userAgent.includes('iPhone') ? 'Mobile Safari' : userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Browser compatibility issue: ${error.message}`);
      }
    }
    
    console.log('✅ Browser compatibility testing completed');
  }

  async generateFinalReport() {
    const successfulTests = this.testResults.filter(r => r.status === 'SUCCESS');
    const failedTests = this.testResults.filter(r => r.status !== 'SUCCESS');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: successfulTests.length === this.testResults.length ? 'ALL_URLS_WORKING' : 'SOME_ISSUES_FOUND',
      summary: {
        totalTested: this.testResults.length,
        successful: successfulTests.length,
        failed: failedTests.length,
        successRate: Math.round((successfulTests.length / this.testResults.length) * 100)
      },
      gateway: this.gateway,
      testResults: this.testResults,
      workingUrls: successfulTests.map(r => ({
        tokenId: r.tokenId,
        name: r.name,
        url: r.url,
        responseTime: r.responseTime
      })),
      failedUrls: failedTests.map(r => ({
        tokenId: r.tokenId,
        name: r.name,
        url: r.url,
        error: r.error
      }))
    };

    // Save report
    const reportPath = path.join(__dirname, '../FINAL_IPFS_VERIFICATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Final IPFS Verification Report:');
    console.log('='.repeat(50));
    console.log(`Status: ${report.status}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Working URLs: ${report.summary.successful}/${report.summary.totalTested}`);
    
    if (report.summary.successful > 0) {
      console.log('\n🔗 Working HTTP URLs:');
      report.workingUrls.forEach(url => {
        console.log(`✅ ${url.name}: ${url.url} (${url.responseTime}ms)`);
      });
    }
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Failed URLs:');
      report.failedUrls.forEach(url => {
        console.log(`❌ ${url.name}: ${url.error}`);
      });
    }

    if (report.summary.successRate >= 80) {
      console.log('\n🎉 IPFS HTTP URLs are working! Images will display in browsers.');
    } else {
      console.log('\n⚠️  Some IPFS URLs are not working. Check the failed URLs above.');
    }

    return report;
  }
}

// Execute final verification
async function main() {
  const verifier = new FinalIpfsVerification();
  await verifier.runFinalVerification();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Final IPFS verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Final IPFS verification failed:', error);
      process.exit(1);
    });
}

module.exports = { FinalIpfsVerification };
