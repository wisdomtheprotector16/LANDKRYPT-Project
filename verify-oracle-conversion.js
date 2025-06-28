// Verify Oracle Conversion Logic
const { ethers } = require('ethers');

function testOracleConversion() {
  console.log('🔬 Testing Oracle Conversion Logic\n');
  
  // Example values
  const ethPrice = 2423.16; // USD per ETH
  const ethPriceFeed = Math.floor(ethPrice * 1e8); // Chainlink format (8 decimals)
  
  console.log(`ETH Price: $${ethPrice}`);
  console.log(`Chainlink Price Feed: ${ethPriceFeed} (8 decimals)\n`);
  
  // Test different ETH amounts
  const testAmounts = [
    { eth: '1.0', label: '1 ETH' },
    { eth: '0.1', label: '0.1 ETH' },
    { eth: '0.01', label: '0.01 ETH' },
    { eth: '0.001', label: '0.001 ETH' }
  ];
  
  console.log('Expected conversions:');
  testAmounts.forEach(({ eth, label }) => {
    const ethWei = ethers.parseEther(eth);
    const expectedUSD = Number(eth) * ethPrice;
    
    // Current conversion (what the contract does)
    const contractResult = (ethWei * BigInt(ethPriceFeed)) / BigInt(1e8);
    const contractUSD = ethers.formatEther(contractResult);
    
    console.log(`${label}:`);
    console.log(`  Expected USD value: $${expectedUSD.toFixed(6)}`);
    console.log(`  Contract result: ${contractUSD} USD`);
    console.log(`  Correct: ${Math.abs(Number(contractUSD) - expectedUSD) < 0.000001}`);
    console.log('');
  });
  
  console.log('📊 Analysis:');
  console.log('The conversion formula (ethAmount * ethPrice) / 1e8 is mathematically correct.');
  console.log('ETH amount in wei (18 decimals) * price (8 decimals) / 1e8 = USD in wei (18 decimals)');
  console.log('This maintains proper decimal precision for token operations.\n');
}

// Test the actual deployed Oracle
async function testDeployedOracle() {
  console.log('🔮 Testing Deployed Oracle\n');
  
  require('dotenv').config();
  
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  const oracleAddress = process.env.NEXT_PUBLIC_ORACLE_ADDRESS;
  
  const oracle = new ethers.Contract(oracleAddress, [
    "function getLatestETHPrice() external view returns (int256)",
    "function convertETHToUSD(uint256 ethAmount) external view returns (uint256)"
  ], provider);
  
  try {
    const ethPrice = await oracle.getLatestETHPrice();
    const ethPriceUSD = Number(ethPrice) / 1e8;
    
    console.log(`Live ETH Price: $${ethPriceUSD.toFixed(2)}`);
    
    // Test conversions
    const testAmounts = ['1.0', '0.1', '0.01', '0.001'];
    
    for (const amount of testAmounts) {
      const ethWei = ethers.parseEther(amount);
      const usdResult = await oracle.convertETHToUSD(ethWei);
      const usdFormatted = ethers.formatEther(usdResult);
      const expectedUSD = Number(amount) * ethPriceUSD;
      
      console.log(`${amount} ETH = ${usdFormatted} USD (expected: $${expectedUSD.toFixed(6)})`);
    }
    
  } catch (error) {
    console.error('Error testing deployed oracle:', error.message);
  }
}

async function main() {
  testOracleConversion();
  await testDeployedOracle();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testOracleConversion, testDeployedOracle };
