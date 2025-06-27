// Integrated LandKrypt Deployment Script
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Configuration Constants
const DEPLOY_CONFIG = {
  // Network-specific settings
  NETWORK: {
    CHAINLINK_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD Sepolia
    GAS_SETTINGS: {
      maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei")
    }
  },
  
  // Protocol parameters
  PROTOCOL: {
    EXCHANGE_FEE_BPS: 50, // 0.5%
    DAO: {
      VOTING_PERIOD: 604800, // 7 days
      QUORUM_PERCENT: 30, // 30%
      DEVELOPER_FEE_ETH: ethers.utils.parseEther("0.1")
    },
    NFT: {
      BASE_URI: "https://gateway.pinata.cloud/ipfs/",
      MINT_SAFETY_LIMIT: 1000 // Max NFTs that can be minted
    }
  }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 Beginning LandKrypt deployment with ${deployer.address}\n`);
  console.log(`💰 Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  /********************************
   * PHASE 1: CORE INFRASTRUCTURE *
   ********************************/
  console.log("🛠  Deploying Core Infrastructure...");
  
  // Deploy Stablecoin Ecosystem
  const LKUSD = await ethers.getContractFactory("LandKryptStablecoin");
  const lkusd = await LKUSD.deploy();
  await lkusd.deployed();
  console.log(`✅ LKUSD deployed to: ${lkusd.address}`);
  
  const LKST = await ethers.getContractFactory("LandKryptStakingToken");
  const lkst = await LKST.deploy();
  await lkst.deployed();
  console.log(`✅ LKST deployed to: ${lkst.address}`);

  // Deploy NFT Infrastructure
  const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
  const realEstateNFT = await RealEstateNFT.deploy(DEPLOY_CONFIG.PROTOCOL.NFT.BASE_URI);
  await realEstateNFT.deployed();
  console.log(`✅ RealEstateNFT deployed to: ${realEstateNFT.address}`);

  // Deploy Financial Infrastructure
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(DEPLOY_CONFIG.NETWORK.CHAINLINK_FEED);
  await oracle.deployed();
  console.log(`✅ Oracle deployed to: ${oracle.address}`);

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(
    lkusd.address,
    oracle.address,
    DEPLOY_CONFIG.PROTOCOL.EXCHANGE_FEE_BPS
  );
  await exchange.deployed();
  console.log(`✅ Exchange deployed to: ${exchange.address}`);

  /*************************************
   * PHASE 2: OPERATIONAL COMPONENTS *
   *************************************/
  console.log("\n🔧 Deploying Operational Contracts...");

  // Deploy Marketplace with temporary DAO address
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(
    realEstateNFT.address,
    lkusd.address,
    ethers.constants.AddressZero // Temporary DAO placeholder
  );
  await marketplace.deployed();
  console.log(`✅ NFTMarketplace deployed to: ${marketplace.address}`);

  // Deploy Development Contract
  const DevelopmentContract = await ethers.getContractFactory("DevelopmentContract");
  const devContract = await DevelopmentContract.deploy();
  await devContract.deployed();
  console.log(`✅ DevelopmentContract deployed to: ${devContract.address}`);

  // Deploy Staking Factory
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = await StakingFactory.deploy(
    marketplace.address,
    lkusd.address,
    lkst.address,
    realEstateNFT.address,
    devContract.address
  );
  await stakingFactory.deployed();
  console.log(`✅ StakingFactory deployed to: ${stakingFactory.address}`);

  /******************************
   * PHASE 3: GOVERNANCE LAYER *
   ******************************/
  console.log("\n🏛  Deploying Governance System...");
  
  // Deploy DAO with full dependencies
  const NFTDAO = await ethers.getContractFactory("NFTDAO");
  const nftDAO = await NFTDAO.deploy(
    lkst.address,
    marketplace.address,
    devContract.address,
    stakingFactory.address,
    DEPLOY_CONFIG.PROTOCOL.DAO.VOTING_PERIOD,
    DEPLOY_CONFIG.PROTOCOL.DAO.QUORUM_PERCENT,
    DEPLOY_CONFIG.PROTOCOL.DAO.DEVELOPER_FEE_ETH
  );
  await nftDAO.deployed();
  console.log(`✅ NFTDAO deployed to: ${nftDAO.address}`);

  /*******************************
   * PHASE 4: SYSTEM INTEGRATION *
   *******************************/
  console.log("\n🔗 Integrating System Components...");

  // 1. Update Marketplace DAO reference
  console.log("🔄 Updating Marketplace DAO address...");
  const updateDAOTx = await marketplace.changeDAOAddress(nftDAO.address);
  await updateDAOTx.wait();

  // 2. Set Contract Permissions
  console.log("🔐 Configuring Access Controls...");
  await configurePermissions({
    lkusd,
    lkst,
    exchange,
    stakingFactory,
    nftDAO,
    devContract
  });

  // 3. Transfer Ownership to DAO (commented out for initial deployment)
  console.log("🔄 Preparing for Governance Transfer...");
  // await transferOwnerships({
  //   contracts: [
  //     { contract: realEstateNFT, name: "RealEstateNFT" },
  //     { contract: lkusd, name: "LKUSD" },
  //     { contract: lkst, name: "LKST" },
  //     { contract: marketplace, name: "Marketplace" },
  //     { contract: stakingFactory, name: "StakingFactory" }
  //   ],
  //   newOwner: nftDAO.address
  // });

  /***************************
   * FINAL VERIFICATION *
   ***************************/
  console.log("\n🔍 Verifying Deployment...");
  
  const verificationResults = {
    DAO_ADDRESS_SET: await marketplace.nftDAO() === nftDAO.address,
    MINT_PERMISSIONS: {
      STAKING_FACTORY_LKUSD: await lkusd.isMinter(stakingFactory.address),
      EXCHANGE_LKUSD: await lkusd.isMinter(exchange.address)
    }
  };

  console.log("Verification Results:", JSON.stringify(verificationResults, null, 2));

  /***************************
   * DEPLOYMENT OUTPUT *
   ***************************/
  const deploymentManifest = {
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CORE: {
        LKUSD: lkusd.address,
        LKST: lkst.address,
        RealEstateNFT: realEstateNFT.address,
        Oracle: oracle.address,
        Exchange: exchange.address
      },
      OPERATIONAL: {
        Marketplace: marketplace.address,
        StakingFactory: stakingFactory.address,
        DevelopmentContract: devContract.address
      },
      GOVERNANCE: {
        DAO: nftDAO.address
      }
    }
  };

  // Save deployment manifest
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentManifest, null, 2));

  // Update environment file with contract addresses
  await updateEnvironmentFile(deploymentManifest.contracts);

  console.log("\n🚀 Deployment Complete! 🚀");
  console.log(JSON.stringify(deploymentManifest, null, 2));
  console.log(`\n📁 Deployment saved to: ${deploymentFile}`);

  return deploymentManifest;
}

/***************************
| * HELPER FUNCTIONS *
| ***************************/
async function configurePermissions({ lkusd, lkst, exchange, stakingFactory, nftDAO, devContract }) {
  console.log("Setting up minting permissions...");
  
  // Stablecoin permissions
  await lkusd.addMinter(exchange.address);
  await lkusd.addMinter(stakingFactory.address);
  await lkusd.addBurner(stakingFactory.address);

  // Staking token permissions
  await lkst.addMinter(stakingFactory.address);
  await lkst.addBurner(nftDAO.address);
  
  console.log("✅ Permissions configured");
}

async function transferOwnerships({ contracts, newOwner }) {
  for (const { contract, name } of contracts) {
    console.log(`Transferring ${name} ownership to DAO...`);
    const tx = await contract.transferOwnership(newOwner);
    await tx.wait();
    console.log(`✅ ${name} ownership transferred`);
  }
}

async function updateEnvironmentFile(contracts) {
  console.log("📝 Updating environment configuration...");
  
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update contract addresses in env content
  const updates = {
    'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS': contracts.CORE.RealEstateNFT,
    'NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS': contracts.CORE.LKUSD,
    'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS': contracts.CORE.LKST,
    'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS': contracts.OPERATIONAL.Marketplace,
    'NEXT_PUBLIC_NFT_DAO_ADDRESS': contracts.GOVERNANCE.DAO,
    'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS': contracts.OPERATIONAL.StakingFactory,
    'NEXT_PUBLIC_EXCHANGE_ADDRESS': contracts.CORE.Exchange,
    'NEXT_PUBLIC_ORACLE_ADDRESS': contracts.CORE.Oracle,
    'NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS': contracts.OPERATIONAL.DevelopmentContract
  };

  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Environment file updated");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("⚠️ Deployment Failed:", error);
    process.exit(1);
  });
