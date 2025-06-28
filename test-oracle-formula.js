// Test Oracle Conversion Formula
const { ethers } = require('ethers');

function testFormulas() {
  console.log('🧮 Testing Oracle Conversion Formulas\n');
  
  // Example values
  const ethPrice = 2421.29; // USD per ETH
  const ethPriceFeed = Math.floor(ethPrice * 1e8); // Chainlink format (8 decimals): 242129000000
  const oneETH = ethers.parseEther('1.0'); // 1000000000000000000 wei (18 decimals)
  
  console.log(`ETH Price: $${ethPrice}`);
  console.log(`Price Feed (8 decimals): ${ethPriceFeed}`);
  console.log(`1 ETH in wei (18 decimals): ${oneETH}`);
  console.log('');
  
  // Current formula (wrong): (ethAmount * ethPrice) / 1e8
  const currentFormula = (oneETH * BigInt(ethPriceFeed)) / BigInt(1e8);
  console.log('Current Formula: (ethAmount * ethPrice) / 1e8');
  console.log(`Result: ${currentFormula}`);
  console.log(`Formatted: ${ethers.formatEther(currentFormula)} USD`);
  console.log(`Expected: ${ethPrice} USD`);
  console.log(`Correct: ${Math.abs(Number(ethers.formatEther(currentFormula)) - ethPrice) < 0.01}`);
  console.log('');
  
  // Proposed formula: (ethAmount * ethPrice * 1e10) / 1e18
  const proposedFormula = (oneETH * BigInt(ethPriceFeed) * BigInt(1e10)) / BigInt(1e18);
  console.log('Proposed Formula: (ethAmount * ethPrice * 1e10) / 1e18');
  console.log(`Result: ${proposedFormula}`);
  console.log(`Formatted: ${ethers.formatEther(proposedFormula)} USD`);
  console.log(`Expected: ${ethPrice} USD`);
  console.log(`Correct: ${Math.abs(Number(ethers.formatEther(proposedFormula)) - ethPrice) < 0.01}`);
  console.log('');
  
  // Alternative: Simply multiply by 1e10
  const alternativeFormula = (oneETH * BigInt(ethPriceFeed)) / BigInt(1e8);
  const fixedAlternative = alternativeFormula * BigInt(1e10);
  console.log('Alternative: Current result * 1e10');
  console.log(`Result: ${fixedAlternative}`);
  console.log(`Formatted: ${ethers.formatEther(fixedAlternative)} USD`);
  console.log(`Expected: ${ethPrice} USD`);
  console.log(`Correct: ${Math.abs(Number(ethers.formatEther(fixedAlternative)) - ethPrice) < 0.01}`);
  console.log('');
  
  // Simplified correct formula
  const correctFormula = (oneETH * BigInt(ethPriceFeed)) / BigInt(100000000); // 1e8
  const correctedResult = correctFormula * BigInt(10000000000); // 1e10
  console.log('✅ CORRECT Formula: (ethAmount * ethPrice / 1e8) * 1e10');
  console.log(`Step 1 - Basic conversion: ${correctFormula}`);
  console.log(`Step 2 - Scale to 18 decimals: ${correctedResult}`);
  console.log(`Formatted: ${ethers.formatEther(correctedResult)} USD`);
  console.log(`Expected: ${ethPrice} USD`);
  console.log(`Correct: ${Math.abs(Number(ethers.formatEther(correctedResult)) - ethPrice) < 0.01}`);
}

testFormulas();
