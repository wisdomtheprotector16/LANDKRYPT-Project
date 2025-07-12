// Unified LandKrypt Deployment Script
// Consolidates functionality from multiple deployment scripts
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Configuration Constants
const DEPLOY_CONFIG = {
  // Network-specific settings
  NETWORK: {
    CHAINLINK_FEED: {
      mainnet: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD Mainnet
      sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD Sepolia
      localhost: "0x694AA1769357215DE4FAC081bf1f309aDC325306" // Use Sepolia for localhost
    },
    GAS_SETTINGS: {
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    }
  },
  
  // Protocol parameters
  PROTOCOL: {
    EXCHANGE_FEE_BPS: 50, // 0.5%
    DAO: {
      VOTING_PERIOD: 604800, // 7 days
      QUORUM_PERCENT: 30, // 30%
      DEVELOPER_FEE_ETH: ethers.parseEther("0.1")
    },
    NFT: {
      BASE_URI: "ipfs://",
      MINT_SAFETY_LIMIT: 1000 // Max NFTs that can be minted
    }
  }
};

// Deployment state tracking
let deploymentState = {
  contracts: {},
  transactions: [],
  errors: [],
  startTime: Date.now()
};

async function main() {
  console.log("🚀 Beginning LandKrypt Unified Deployment...");
  
  try {
    // Get network information
    const network = await ethers.provider.getNetwork();
    const [deployer] = await ethers.getSigners();
    
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);
    
    // Validate deployment environment
    await validateEnvironment(network, deployer);
    
    // Deploy core infrastructure
    console.log("\n🛠  Deploying Core Infrastructure...");
    await deployCoreInfrastructure(deployer, network);
    
    // Deploy operational contracts
    console.log("\n🔧 Deploying Operational Contracts...");
    await deployOperationalContracts(deployer, network);
    
    // Deploy governance system
    console.log("\n🏛  Deploying Governance System...");
    await deployGovernanceSystem(deployer, network);
    
    // Configure system integration
    console.log("\n🔗 Integrating System Components...");
    await configureSystemIntegration();
    
    // Setup permissions and ownership
    console.log("\n🔐 Configuring Access Controls...");
    await configurePermissions();
    
    // Save deployment results
    console.log("\n📝 Saving Deployment Results...");
    await saveDeploymentResults(network);
    
    console.log("\n🚀 Deployment Complete! 🚀");
    console.log(`⏱  Total time: ${((Date.now() - deploymentState.startTime) / 1000).toFixed(2)}s`);
    
  } catch (error) {
    console.error("⚠ Deployment Failed:", error);
    deploymentState.errors.push({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Save partial deployment state for debugging
    await saveDeploymentResults(await ethers.provider.getNetwork(), true);
    process.exit(1);
  }
}

async function validateEnvironment(network, deployer) {
  console.log("🔍 Validating deployment environment...");
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const minBalance = ethers.parseEther("0.1"); // Minimum 0.1 ETH
  
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Required: ${ethers.formatEther(minBalance)} ETH, Available: ${ethers.formatEther(balance)} ETH`);
  }
  
  // Check network configuration
  const chainlinkFeed = DEPLOY_CONFIG.NETWORK.CHAINLINK_FEED[network.name] || DEPLOY_CONFIG.NETWORK.CHAINLINK_FEED.sepolia;
  console.log(`✅ Using Chainlink feed: ${chainlinkFeed}`);
  
  // Validate environment variables for production
  if (network.name === 'mainnet') {
    const requiredEnvVars = ['MAINNET_RPC_URL', 'DEPLOYER_PRIVATE_KEY', 'ETHERSCAN_API_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }
  
  console.log("✅ Environment validation passed");
}

async function deployCoreInfrastructure(deployer, network) {
  // Deploy Stablecoin (LKUSD)
  console.log("   Deploying LKUSD...");
  const LKUSD = await ethers.getContractFactory("LandKryptStablecoin");
  const lkusd = await LKUSD.deploy();
  await lkusd.waitForDeployment();
  deploymentState.contracts.lkusd = await lkusd.getAddress();
  console.log(`   ✅ LKUSD deployed to: ${deploymentState.contracts.lkusd}`);
  
  // Deploy Staking Token (LKST)
  console.log("   Deploying LKST...");
  const LKST = await ethers.getContractFactory("LandKryptStakingToken");
  const lkst = await LKST.deploy();
  await lkst.waitForDeployment();
  deploymentState.contracts.lkst = await lkst.getAddress();
  console.log(`   ✅ LKST deployed to: ${deploymentState.contracts.lkst}`);
  
  // Deploy NFT Contract
  console.log("   Deploying RealEstateNFT...");
  const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
  const realEstateNFT = await RealEstateNFT.deploy(DEPLOY_CONFIG.PROTOCOL.NFT.BASE_URI);
  await realEstateNFT.waitForDeployment();
  deploymentState.contracts.realEstateNFT = await realEstateNFT.getAddress();
  console.log(`   ✅ RealEstateNFT deployed to: ${deploymentState.contracts.realEstateNFT}`);
  
  // Deploy Oracle
  console.log("   Deploying Oracle...");
  const chainlinkFeed = DEPLOY_CONFIG.NETWORK.CHAINLINK_FEED[network.name] || DEPLOY_CONFIG.NETWORK.CHAINLINK_FEED.sepolia;
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(chainlinkFeed);
  await oracle.waitForDeployment();
  deploymentState.contracts.oracle = await oracle.getAddress();
  console.log(`   ✅ Oracle deployed to: ${deploymentState.contracts.oracle}`);
  
  // Deploy Exchange
  console.log("   Deploying Exchange...");
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(
    deploymentState.contracts.lkusd,
    deploymentState.contracts.oracle,
    DEPLOY_CONFIG.PROTOCOL.EXCHANGE_FEE_BPS
  );
  await exchange.waitForDeployment();
  deploymentState.contracts.exchange = await exchange.getAddress();
  console.log(`   ✅ Exchange deployed to: ${deploymentState.contracts.exchange}`);
  
  // Store contract instances for later use
  deploymentState.contractInstances = {
    lkusd,
    lkst,
    realEstateNFT,
    oracle,
    exchange
  };
}

async function deployOperationalContracts(deployer, network) {
  // Deploy NFT Marketplace
  console.log("   Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(
    deploymentState.contracts.realEstateNFT,
    deploymentState.contracts.lkusd
  );
  await nftMarketplace.waitForDeployment();
  deploymentState.contracts.nftMarketplace = await nftMarketplace.getAddress();
  console.log(`   ✅ NFTMarketplace deployed to: ${deploymentState.contracts.nftMarketplace}`);
  
  // Deploy Development Contract
  console.log("   Deploying DevelopmentContract...");
  const DevelopmentContract = await ethers.getContractFactory("DevelopmentContract");
  const developmentContract = await DevelopmentContract.deploy(
    deploymentState.contracts.lkst,
    DEPLOY_CONFIG.PROTOCOL.DAO.DEVELOPER_FEE_ETH
  );
  await developmentContract.waitForDeployment();
  deploymentState.contracts.developmentContract = await developmentContract.getAddress();
  console.log(`   ✅ DevelopmentContract deployed to: ${deploymentState.contracts.developmentContract}`);
  
  // Deploy Staking Factory
  console.log("   Deploying StakingFactory...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = await StakingFactory.deploy(
    deploymentState.contracts.realEstateNFT,
    deploymentState.contracts.lkusd,
    deploymentState.contracts.lkst
  );
  await stakingFactory.waitForDeployment();
  deploymentState.contracts.stakingFactory = await stakingFactory.getAddress();
  console.log(`   ✅ StakingFactory deployed to: ${deploymentState.contracts.stakingFactory}`);
  
  // Store additional contract instances
  deploymentState.contractInstances = {
    ...deploymentState.contractInstances,
    nftMarketplace,
    developmentContract,
    stakingFactory
  };
}

async function deployGovernanceSystem(deployer, network) {
  // Deploy NFT DAO
  console.log("   Deploying NFTDAO...");
  const NFTDAO = await ethers.getContractFactory("NFTDAO");
  const nftDAO = await NFTDAO.deploy(
    deploymentState.contracts.realEstateNFT,
    deploymentState.contracts.lkst,
    DEPLOY_CONFIG.PROTOCOL.DAO.VOTING_PERIOD,
    DEPLOY_CONFIG.PROTOCOL.DAO.QUORUM_PERCENT
  );
  await nftDAO.waitForDeployment();
  deploymentState.contracts.nftDAO = await nftDAO.getAddress();
  console.log(`   ✅ NFTDAO deployed to: ${deploymentState.contracts.nftDAO}`);
  
  // Store DAO instance
  deploymentState.contractInstances.nftDAO = nftDAO;
}

async function configureSystemIntegration() {
  console.log("   Setting up contract integrations...");
  
  // Configure Exchange with Oracle
  const { exchange, oracle } = deploymentState.contractInstances;
  
  // Add any additional integration logic here
  console.log("   ✅ System integration configured");
}

async function configurePermissions() {
  console.log("   Setting up minting permissions...");
  
  const { lkusd, lkst, exchange, stakingFactory, nftDAO, developmentContract } = deploymentState.contractInstances;
  
  // Stablecoin permissions
  console.log("      Adding Exchange as LKUSD minter...");
  await (await lkusd.addMinter(await exchange.getAddress())).wait();
  
  console.log("      Adding StakingFactory as LKUSD minter...");
  await (await lkusd.addMinter(await stakingFactory.getAddress())).wait();
  
  console.log("      Adding StakingFactory as LKUSD burner...");
  await (await lkusd.addBurner(await stakingFactory.getAddress())).wait();
  
  // Staking token permissions
  console.log("      Adding StakingFactory as LKST minter...");
  await (await lkst.addMinter(await stakingFactory.getAddress())).wait();
  
  console.log("      Adding DAO as LKST burner...");
  await (await lkst.addBurner(await nftDAO.getAddress())).wait();
  
  console.log("   ✅ All permissions configured successfully");
}

async function saveDeploymentResults(network, isPartial = false) {
  const deploymentData = {
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    timestamp: new Date().toISOString(),
    deployer: deploymentState.contractInstances?.lkusd ? await deploymentState.contractInstances.lkusd.runner.address : "unknown",
    contracts: deploymentState.contracts,
    transactions: deploymentState.transactions,
    errors: deploymentState.errors,
    deploymentTime: Date.now() - deploymentState.startTime,
    isPartial
  };
  
  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, '../../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `deployment-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  console.log(`   ✅ Deployment data saved to: ${filepath}`);
  
  // Update environment file if not partial deployment
  if (!isPartial) {
    await updateEnvironmentFile(deploymentData);
  }
}

async function updateEnvironmentFile(deploymentData) {
  const envPath = path.join(__dirname, '../../.env.local');
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update contract addresses
  const contractUpdates = {
    'NEXT_PUBLIC_LKUSD_ADDRESS': deploymentData.contracts.lkusd,
    'NEXT_PUBLIC_LKST_ADDRESS': deploymentData.contracts.lkst,
    'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS': deploymentData.contracts.realEstateNFT,
    'NEXT_PUBLIC_ORACLE_ADDRESS': deploymentData.contracts.oracle,
    'NEXT_PUBLIC_EXCHANGE_ADDRESS': deploymentData.contracts.exchange,
    'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS': deploymentData.contracts.nftMarketplace,
    'NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS': deploymentData.contracts.developmentContract,
    'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS': deploymentData.contracts.stakingFactory,
    'NEXT_PUBLIC_NFT_DAO_ADDRESS': deploymentData.contracts.nftDAO
  };
  
  // Update or add each contract address
  for (const [key, value] of Object.entries(contractUpdates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`   ✅ Environment file updated: ${envPath}`);
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("⚠ Deployment Failed:", error);
      process.exit(1);
    });
}

module.exports = { main, DEPLOY_CONFIG };
