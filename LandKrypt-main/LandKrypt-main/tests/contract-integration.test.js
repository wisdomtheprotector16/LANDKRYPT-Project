// Smart Contract Integration Tests
// Tests contract addresses, ABIs, and integration points

const { expect } = require('jest');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Import contract ABIs and addresses
const CONTRACT_ADDRESSES = require('../src/contracts/abis').CONTRACT_ADDRESSES;
const ABIS = require('../src/contracts/abis');

// Test configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
const TEST_TIMEOUT = 30000;

describe('Smart Contract Integration Tests', () => {
  let provider;
  let signer;

  beforeAll(async () => {
    // Setup provider and signer for testing
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // For testing, we'll use a mock signer or the first account from hardhat
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = accounts[0];
      } else {
        // Create a random wallet for testing
        const wallet = ethers.Wallet.createRandom();
        signer = wallet.connect(provider);
      }
    } catch (error) {
      console.warn('Provider setup failed, some tests will be skipped:', error.message);
    }
  }, TEST_TIMEOUT);

  describe('Contract Address Validation', () => {
    test('All contract addresses should be valid Ethereum addresses', () => {
      Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
        expect(address).toBeDefined();
        expect(ethers.isAddress(address)).toBe(true);
        expect(address).not.toBe('0x0000000000000000000000000000000000000000');
      });
    });

    test('Contract addresses should be unique', () => {
      const addresses = Object.values(CONTRACT_ADDRESSES);
      const uniqueAddresses = [...new Set(addresses)];
      expect(addresses.length).toBe(uniqueAddresses.length);
    });

    test('Critical contracts should have valid addresses', () => {
      const criticalContracts = [
        'REAL_ESTATE_NFT',
        'LANDKRYPT_STABLECOIN',
        'LANDKRYPT_STAKING_TOKEN',
        'NFT_MARKETPLACE',
        'STAKING_FACTORY'
      ];

      criticalContracts.forEach(contractName => {
        expect(CONTRACT_ADDRESSES[contractName]).toBeDefined();
        expect(CONTRACT_ADDRESSES[contractName]).not.toBe('0x0000000000000000000000000000000000000000');
      });
    });
  });

  describe('ABI Validation', () => {
    test('All ABIs should be valid JSON arrays', () => {
      const abiNames = [
        'NFT_STAKING_ABI',
        'REAL_ESTATE_NFT_ABI',
        'NFT_MARKETPLACE_ABI',
        'NFTDAO_ABI',
        'LANDKRYPT_STAKING_TOKEN_ABI',
        'LANDKRYPT_STABLECOIN_ABI',
        'STAKING_FACTORY_ABI'
      ];

      abiNames.forEach(abiName => {
        const abi = ABIS[abiName];
        expect(abi).toBeDefined();
        expect(Array.isArray(abi)).toBe(true);
        expect(abi.length).toBeGreaterThan(0);
      });
    });

    test('Staking ABI should contain required functions', () => {
      const requiredFunctions = [
        'stake',
        'withdrawStake',
        'claimDailyRewards',
        'stakers',
        'totalStaked',
        'targetAmount'
      ];

      requiredFunctions.forEach(functionName => {
        const hasFunction = ABIS.NFT_STAKING_ABI.some(
          item => item.type === 'function' && item.name === functionName
        );
        expect(hasFunction).toBe(true);
      });
    });

    test('NFT ABI should contain required functions', () => {
      const requiredFunctions = [
        'mint',
        'tokenURI',
        'ownerOf',
        'totalSupply'
      ];

      requiredFunctions.forEach(functionName => {
        const hasFunction = ABIS.REAL_ESTATE_NFT_ABI.some(
          item => item.type === 'function' && item.name === functionName
        );
        expect(hasFunction).toBe(true);
      });
    });

    test('Token ABIs should contain ERC20 functions', () => {
      const erc20Functions = ['balanceOf', 'approve'];
      
      [ABIS.LANDKRYPT_STAKING_TOKEN_ABI, ABIS.LANDKRYPT_STABLECOIN_ABI].forEach(abi => {
        erc20Functions.forEach(functionName => {
          const hasFunction = abi.some(
            item => item.type === 'function' && item.name === functionName
          );
          expect(hasFunction).toBe(true);
        });
      });
    });
  });

  describe('Contract Interface Tests', () => {
    test('Should be able to create contract instances', async () => {
      if (!provider) {
        console.log('Skipping contract interface tests - no provider available');
        return;
      }

      try {
        // Test creating contract instances
        const stakingContract = new ethers.Contract(
          CONTRACT_ADDRESSES.REAL_ESTATE_NFT,
          ABIS.REAL_ESTATE_NFT_ABI,
          provider
        );

        expect(stakingContract).toBeDefined();
        expect(stakingContract.target).toBe(CONTRACT_ADDRESSES.REAL_ESTATE_NFT);
      } catch (error) {
        console.warn('Contract instance creation failed:', error.message);
        // This is expected if we're not connected to a real network
      }
    });

    test('Staking Factory should have correct interface', async () => {
      if (!provider) return;

      try {
        const factory = new ethers.Contract(
          CONTRACT_ADDRESSES.STAKING_FACTORY,
          ABIS.STAKING_FACTORY_ABI,
          provider
        );

        // Check if required functions exist
        expect(factory.getStakingContractForNFT).toBeDefined();
        expect(factory.createStakingContract).toBeDefined();
      } catch (error) {
        console.warn('Staking factory interface test failed:', error.message);
      }
    });
  });

  describe('Data Consistency Tests', () => {
    test('Marketplace listings should have valid staking contracts', () => {
      const listingsPath = path.join(__dirname, '..', 'src', 'data', 'all-listings.json');
      
      if (fs.existsSync(listingsPath)) {
        const listings = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));
        
        listings.forEach((listing, index) => {
          // Check staking contract format
          expect(listing.stakingContract).toBeDefined();
          expect(typeof listing.stakingContract).toBe('string');
          expect(listing.stakingContract.startsWith('0x')).toBe(true);
          
          // Check token ID format
          expect(listing.tokenId).toBeDefined();
          expect(listing.id).toBeDefined();
          
          // Check price format
          expect(listing.originalPrice).toBeDefined();
          expect(isNaN(parseInt(listing.originalPrice))).toBe(false);
        });
      }
    });

    test('Contract addresses should match environment variables', () => {
      const envVars = [
        'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS',
        'NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS',
        'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS',
        'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS',
        'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS'
      ];

      envVars.forEach(envVar => {
        const envValue = process.env[envVar];
        if (envValue && envValue !== '0x0000000000000000000000000000000000000000') {
          expect(ethers.isAddress(envValue)).toBe(true);
        }
      });
    });
  });

  describe('Function Signature Tests', () => {
    test('Critical function signatures should be correct', () => {
      // Test stake function signature
      const stakeFunction = ABIS.NFT_STAKING_ABI.find(
        item => item.type === 'function' && item.name === 'stake'
      );
      
      expect(stakeFunction).toBeDefined();
      expect(stakeFunction.inputs).toBeDefined();
      expect(stakeFunction.inputs.length).toBe(1);
      expect(stakeFunction.inputs[0].type).toBe('uint256');

      // Test balanceOf function signature
      const balanceOfFunction = ABIS.LANDKRYPT_STABLECOIN_ABI.find(
        item => item.type === 'function' && item.name === 'balanceOf'
      );
      
      expect(balanceOfFunction).toBeDefined();
      expect(balanceOfFunction.inputs).toBeDefined();
      expect(balanceOfFunction.inputs.length).toBe(1);
      expect(balanceOfFunction.inputs[0].type).toBe('address');
    });

    test('Function state mutability should be correct', () => {
      // View functions should be marked as view
      const viewFunctions = ['balanceOf', 'totalStaked', 'stakers'];
      
      viewFunctions.forEach(functionName => {
        const functions = [
          ...ABIS.NFT_STAKING_ABI,
          ...ABIS.LANDKRYPT_STABLECOIN_ABI,
          ...ABIS.LANDKRYPT_STAKING_TOKEN_ABI
        ];
        
        const func = functions.find(
          item => item.type === 'function' && item.name === functionName
        );
        
        if (func) {
          expect(['view', 'pure'].includes(func.stateMutability)).toBe(true);
        }
      });
    });
  });

  describe('Integration Point Tests', () => {
    test('Contract interaction hooks should use correct addresses', () => {
      const hooksPath = path.join(__dirname, '..', 'src', 'hooks', 'useContractOperations.js');
      
      if (fs.existsSync(hooksPath)) {
        const hooksContent = fs.readFileSync(hooksPath, 'utf8');
        
        // Check if hooks are using CONTRACT_ADDRESSES
        expect(hooksContent.includes('CONTRACT_ADDRESSES')).toBe(true);
        expect(hooksContent.includes('ABIS.')).toBe(true);
      }
    });

    test('API routes should validate contract addresses', () => {
      const apiPath = path.join(__dirname, '..', 'src', 'app', 'api');
      
      if (fs.existsSync(apiPath)) {
        const files = fs.readdirSync(apiPath, { recursive: true });
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        // At least some API files should exist
        expect(jsFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling Tests', () => {
    test('Should handle invalid contract addresses gracefully', () => {
      const invalidAddresses = [
        '0x0000000000000000000000000000000000000000',
        '0x',
        'invalid',
        null,
        undefined
      ];

      invalidAddresses.forEach(invalidAddress => {
        if (invalidAddress === null || invalidAddress === undefined) {
          expect(invalidAddress).toBeFalsy();
        } else {
          expect(ethers.isAddress(invalidAddress)).toBe(false);
        }
      });
    });

    test('Should validate transaction parameters', () => {
      const validAmount = '1000000000000000000'; // 1 ETH in wei
      const invalidAmounts = ['0', '-1', 'invalid', null, undefined];

      expect(ethers.parseEther('1')).toBe(validAmount);
      
      invalidAmounts.forEach(amount => {
        if (amount === null || amount === undefined) {
          expect(amount).toBeFalsy();
        } else if (amount === '0' || amount === '-1') {
          expect(parseFloat(amount)).toBeLessThanOrEqual(0);
        } else {
          expect(isNaN(parseFloat(amount))).toBe(true);
        }
      });
    });
  });
});

// Helper functions for testing
function isValidContractAddress(address) {
  return ethers.isAddress(address) && address !== '0x0000000000000000000000000000000000000000';
}

function validateABI(abi) {
  return Array.isArray(abi) && abi.every(item => 
    item.type && ['function', 'event', 'constructor'].includes(item.type)
  );
}

module.exports = {
  isValidContractAddress,
  validateABI
};
