// Check Existing Staking Contracts
const { ethers } = require('ethers');
require('dotenv').config();

async function checkExistingStaking() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    const stakingFactory = new ethers.Contract(
      process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS,
      [
        'function getStakingContractForNFT(uint256 tokenId) external view returns (address)'
      ],
      provider
    );
    
    console.log('🔍 Checking existing staking contracts...\n');
    console.log(`Staking Factory: ${process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS}\n`);
    
    for (let i = 1; i <= 6; i++) {
      try {
        const stakingContractAddress = await stakingFactory.getStakingContractForNFT(i);
        
        if (stakingContractAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Token ${i}: Staking contract exists at ${stakingContractAddress}`);
        } else {
          console.log(`❌ Token ${i}: No staking contract found`);
        }
      } catch (error) {
        console.log(`❌ Token ${i}: Error checking staking contract - ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingStaking();
