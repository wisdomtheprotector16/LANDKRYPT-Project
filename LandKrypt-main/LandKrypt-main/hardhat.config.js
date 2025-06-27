require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

// Check environment variables
if (!process.env.ALCHEMY_SEPOLIA_URL && !process.env.ALCHEMY_API_KEY) {
  console.warn("Warning: Please set either ALCHEMY_SEPOLIA_URL or ALCHEMY_API_KEY in .env file");
}
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  console.warn("Warning: Please set DEPLOYER_PRIVATE_KEY in .env file for contract deployment");
}

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000 // Higher optimization for gas efficiency
          },
          viaIR: true // Use intermediate representation for better optimization
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 3000000000, // 3 gwei - very low for testnet
      timeout: 120000, // 2 minutes
      httpHeaders: {
        "User-Agent": "hardhat-landkrypt"
      }
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
      timeout: 60000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  defaultNetwork: "sepolia",
  mocha: {
    timeout: 60000
  }
};
