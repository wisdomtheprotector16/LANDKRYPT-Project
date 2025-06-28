// Setup Staking Contracts for Land Plot NFTs
// This script will create staking contracts for each land plot NFT with 200,000 LKUSD target

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Configuration
const RECIPIENT_ADDRESS = '0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC';
const LISTING_PRICE = ethers.parseUnits('200000', 18); // 200,000 LKUSD (18 decimals)
const TARGET_AMOUNT = ethers.parseUnits('200000', 18); // Same as listing price for simplicity

// NFT Data with Token IDs - Updated with actual land plot data
const NFT_DATA = [
  {
    tokenId: 1,
    name: "Prime Agricultural Land - Tuscany, Italy",
    description: "50 hectares of fertile vineyard territory with rolling hills",
    location: "Tuscany, Italy",
    landType: "Agricultural",
    size: "50 Hectares",
    useCase: "Vineyard",
    imageCid: "bafkreihsg6iwam4wpykdlhx7ppnss7vgbsniv6n6bg7qtz33q7rti7kg7e",
    metadataCid: "bafkreic5vn4gar25t6awooomodyxf6kbr3gmvprstb2qkdxyyiw2tc2scu",
    tokenURI: "ipfs://bafkreic5vn4gar25t6awooomodyxf6kbr3gmvprstb2qkdxyyiw2tc2scu",
    txHash: "0x7fbe244e49066b91700f42b934016f7184615e632bee72bf6fd70e94c7796aa8"
  },
  {
    tokenId: 2,
    name: "Coastal Development Plot - Malibu, California", 
    description: "25 acres of pristine beachfront land with direct Pacific Ocean access",
    location: "Malibu, California",
    landType: "Coastal Development",
    size: "25 Acres",
    useCase: "Luxury Residential",
    imageCid: "bafkreiglezhg5pjmiwqf2oinalsgmco3mkji66impkqomnpweay3msq2dy",
    metadataCid: "bafkreifpky7wzcuhk5pleld3jtzhhsm5yaew2hfmi5nmlspovlzgq4fkum",
    tokenURI: "ipfs://bafkreifpky7wzcuhk5pleld3jtzhhsm5yaew2hfmi5nmlspovlzgq4fkum",
    txHash: "0xb76c38fa5793c3e64d65bdd06072000137f3d3e01d9e90a8a4d4a6e682ea4a99"
  },
  {
    tokenId: 3,
    name: "Rainforest Conservation Land - Costa Rica",
    description: "100 hectares of protected tropical rainforest with diverse wildlife",
    location: "Costa Rica", 
    landType: "Conservation",
    size: "100 Hectares",
    useCase: "Eco-Tourism",
    imageCid: "bafkreihicdyg6t23vnhromvnxu6gcvtgpntu4o6otgiv5c5toccw5to64q",
    metadataCid: "bafkreie5dcljjs322mzcg5rfarbkeabxes7dr7vfqfsrty3aaqnlbe5itm",
    tokenURI: "ipfs://bafkreie5dcljjs322mzcg5rfarbkeabxes7dr7vfqfsrty3aaqnlbe5itm",
    txHash: "0x7b7f8d769c67447b367ec941fbfc1e235033f0abdfc14900eead37d0971e1165"
  },
  {
    tokenId: 4,
    name: "Urban Development Plot - Tokyo, Japan",
    description: "15,000 square meters in prime Shibuya district with high-rise development rights",
    location: "Tokyo, Japan",
    landType: "Urban Development", 
    size: "15,000 SqM",
    useCase: "High-Rise Commercial",
    imageCid: "bafkreiafwp6utm7qq2p4dyijimyvrhixhneptojixvxwvwuvoqjrnaolxe",
    metadataCid: "bafkreib4coyqdbwqldcvwncpa5ias5ueixpfkvz3fzixu6nopxzajset4a",
    tokenURI: "ipfs://bafkreib4coyqdbwqldcvwncpa5ias5ueixpfkvz3fzixu6nopxzajset4a",
    txHash: "0x10fa8afd8476d6f7916bd0c9ed9c879dddc68886f41c1aad9f07360e8a116004"
  },
  {
    tokenId: 5,
    name: "Outback Mining Territory - Western Australia",
    description: "500 hectares with proven mineral deposits and existing mining rights",
    location: "Western Australia",
    landType: "Mining Territory",
    size: "500 Hectares", 
    useCase: "Resource Extraction",
    imageCid: "bafkreiatqikdd5x63jtgtit2ssi75n5vdyn2m22evyqythfkjrumjg2mge",
    metadataCid: "bafkreiaovdx26d7me3siyyurkhuwdnldmmnmup4izdziutpdznrcpchbfu",
    tokenURI: "ipfs://bafkreiaovdx26d7me3siyyurkhuwdnldmmnmup4izdziutpdznrcpchbfu",
    txHash: "0xec2c0ce432653b080f4103fc0a90a3b14f065210d9e15da95957bb16ad659574"
  },
  {
    tokenId: 6,
    name: "Alpine Ski Resort Land - Swiss Alps",
    description: "200 hectares of pristine mountain terrain with ski slope development rights",
    location: "Swiss Alps",
    landType: "Alpine Recreation",
    size: "200 Hectares",
    useCase: "Ski Resort",
    imageCid: "bafkreicn3aaqcqcsq4vywnsjmviwkdw73d2npchrnrohnsckoeknbme6j4",
    metadataCid: "bafkreiepgd2sywscayod2hcwvxk4mbno65tmabpb7ghmpa63qg23nepksq",
    tokenURI: "ipfs://bafkreiepgd2sywscayod2hcwvxk4mbno65tmabpb7ghmpa63qg23nepksq",
    txHash: "0x2f4a02a907bbd8b58225d933f4923fc626bc8819ac71cce959a3ff5af7b7da73"
  }
];

// Contract ABIs
const STAKING_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "targetAmount", "type": "uint256"}
    ],
    "name": "createStakingContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getStakingContractForNFT",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const NFT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Environment variable validation
function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} not set`);
  }
  return value;
}

async function setupLandPlotStaking() {
  console.log('🏗️ Starting Land Plot Staking Contract Setup...\n');
  console.log('🌍 Setting up investment opportunities for global land plots\n');

  try {
    // Load configuration from environment
    const config = {
      rpcUrl: getRequiredEnvVar('ALCHEMY_SEPOLIA_URL'),
      stakingFactoryAddress: getRequiredEnvVar('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS'),
      nftContractAddress: getRequiredEnvVar('NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS'),
      ownerPrivateKey: getRequiredEnvVar('DEPLOYER_PRIVATE_KEY'),
    };

    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.ownerPrivateKey, provider);

    // Create contract instances
    const stakingFactory = new ethers.Contract(
      config.stakingFactoryAddress,
      STAKING_FACTORY_ABI,
      wallet
    );

    const nftContract = new ethers.Contract(
      config.nftContractAddress,
      NFT_ABI,
      wallet
    );

    console.log(`📋 Setting up staking contracts for ${NFT_DATA.length} Land Plot NFTs`);
    console.log(`🎯 Target amount: ${ethers.formatUnits(TARGET_AMOUNT, 18)} LKUSD each`);
    console.log(`👤 Owner: ${wallet.address}`);
    console.log(`💰 Wallet balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH\n`);

    const results = [];
    const errors = [];

    for (let i = 0; i < NFT_DATA.length; i++) {
      const nft = NFT_DATA[i];
      
      console.log(`\n🏞️ Processing Land Plot ${i + 1}/${NFT_DATA.length}:`);
      console.log(`   🏷️  Token ID: ${nft.tokenId}`);
      console.log(`   📝 Name: ${nft.name}`);
      console.log(`   📍 Location: ${nft.location}`);
      console.log(`   🏗️  Type: ${nft.landType}`);
      console.log(`   📏 Size: ${nft.size}`);

      try {
        // Check if NFT owner is correct
        const nftOwner = await nftContract.ownerOf(nft.tokenId);
        if (nftOwner.toLowerCase() !== wallet.address.toLowerCase()) {
          throw new Error(`NFT ${nft.tokenId} not owned by deployer. Owner: ${nftOwner}`);
        }
        console.log(`   ✅ NFT ownership verified`);

        // Get and verify tokenURI
        const tokenURI = await nftContract.tokenURI(nft.tokenId);
        console.log(`   🔗 Token URI: ${tokenURI}`);

        // Check if staking contract already exists
        let stakingContractAddress;
        try {
          stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
          if (stakingContractAddress !== '0x0000000000000000000000000000000000000000') {
            console.log(`   ⚠️  Staking contract already exists: ${stakingContractAddress}`);
            results.push({
              tokenId: nft.tokenId,
              name: nft.name,
              location: nft.location,
              landType: nft.landType,
              size: nft.size,
              useCase: nft.useCase,
              tokenURI: tokenURI,
              stakingContract: stakingContractAddress,
              targetAmount: ethers.formatUnits(TARGET_AMOUNT, 18),
              imageCid: nft.imageCid,
              metadataCid: nft.metadataCid,
              status: 'already_exists'
            });
            continue;
          }
        } catch (error) {
          // Ignore error, contract doesn't exist
        }

        // Create staking contract
        console.log(`   🏭 Creating staking contract...`);
        console.log(`   💰 Target amount: ${ethers.formatUnits(TARGET_AMOUNT, 18)} LKUSD`);
        
        const createTx = await stakingFactory.createStakingContract(
          nft.tokenId,
          TARGET_AMOUNT
        );

        console.log(`   ⏳ Transaction sent: ${createTx.hash}`);
        const receipt = await createTx.wait();
        console.log(`   ✅ Staking contract created in block ${receipt.blockNumber}`);
        console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Get the staking contract address
        stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
        console.log(`   🏭 Staking contract address: ${stakingContractAddress}`);

        results.push({
          tokenId: nft.tokenId,
          name: nft.name,
          location: nft.location,
          landType: nft.landType,
          size: nft.size,
          useCase: nft.useCase,
          tokenURI: tokenURI,
          stakingContract: stakingContractAddress,
          targetAmount: ethers.formatUnits(TARGET_AMOUNT, 18),
          imageCid: nft.imageCid,
          metadataCid: nft.metadataCid,
          createTxHash: createTx.hash,
          status: 'created'
        });

        console.log(`   🎉 Land Plot NFT ${nft.tokenId} successfully setup for staking!`);

        // Wait 3 seconds between transactions
        if (i < NFT_DATA.length - 1) {
          console.log('   ⏳ Waiting 3 seconds before next NFT...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`   ❌ Failed to setup NFT ${nft.tokenId}:`, error.message);
        errors.push({
          tokenId: nft.tokenId,
          name: nft.name,
          location: nft.location,
          error: error.message
        });
      }
    }

    // Summary report
    console.log('\n' + '='.repeat(80));
    console.log('🎉 LAND PLOT STAKING SETUP COMPLETED!');
    console.log('='.repeat(80));
    console.log(`📊 Total Land Plot NFTs: ${NFT_DATA.length}`);
    console.log(`✅ Successfully Setup: ${results.filter(r => r.status === 'created').length}`);
    console.log(`⚠️  Already Existed: ${results.filter(r => r.status === 'already_exists').length}`);
    console.log(`❌ Failed: ${errors.length}`);
    console.log(`🎯 Target Investment: ${ethers.formatUnits(TARGET_AMOUNT, 18)} LKUSD per plot`);

    if (results.length > 0) {
      console.log('\n✅ STAKING CONTRACTS READY FOR INVESTMENT:');
      results.forEach(result => {
        console.log(`   🏞️ Token #${result.tokenId}: ${result.name}`);
        console.log(`      📍 Location: ${result.location}`);
        console.log(`      🏗️  Type: ${result.landType} (${result.size})`);
        console.log(`      🏭 Staking Contract: ${result.stakingContract}`);
        console.log(`      💰 Target: ${result.targetAmount} LKUSD`);
        console.log(`      🔗 Token URI: ${result.tokenURI}`);
        if (result.createTxHash) {
          console.log(`      📝 Create TX: ${result.createTxHash}`);
        }
        console.log(`      📈 Status: ${result.status.toUpperCase()}`);
        console.log('');
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ FAILED SETUPS:');
      errors.forEach(error => {
        console.log(`   🏞️ Token #${error.tokenId}: ${error.name}`);
        console.log(`      📍 Location: ${error.location}`);
        console.log(`      ❌ Error: ${error.error}`);
      });
    }

    // Save results
    const reportData = {
      timestamp: new Date().toISOString(),
      targetAmount: ethers.formatUnits(TARGET_AMOUNT, 18),
      targetAmountWei: TARGET_AMOUNT.toString(),
      total: NFT_DATA.length,
      successful: results.filter(r => r.status === 'created').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      failed: errors.length,
      landPlots: results,
      errors
    };

    const reportPath = './land-plot-staking-setup-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);

    // Create marketplace-ready JSON with tokenURI
    const marketplaceData = results.map(result => ({
      token_id: result.tokenId,
      title: result.name,
      description: result.description || `${result.landType} land in ${result.location}`,
      location: result.location,
      land_type: result.landType,
      size: result.size,
      use_case: result.useCase,
      staking_contract: result.stakingContract,
      target_amount: TARGET_AMOUNT.toString(),
      target_amount_formatted: result.targetAmount,
      owner_address: RECIPIENT_ADDRESS,
      token_uri: result.tokenURI,
      image_ipfs: `ipfs://${result.imageCid}`,
      metadata_ipfs: `ipfs://${result.metadataCid}`,
      is_stakeable: true,
      is_listed: true,
      category: result.landType.toLowerCase().replace(/\s+/g, '_'),
      blockchain_data: {
        network: "sepolia",
        chain_id: 11155111,
        has_staking_contract: true,
        staking_contract_address: result.stakingContract
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const marketplaceFile = './land-plot-marketplace-data.json';
    fs.writeFileSync(marketplaceFile, JSON.stringify(marketplaceData, null, 2));
    console.log(`🏪 Marketplace data with tokenURI saved to: ${marketplaceFile}`);

    console.log('\n🌍 Global land plot investment platform is now ready!');
    console.log('Users can invest in agricultural, coastal, conservation, urban, mining, and alpine land worldwide.');

    return reportData;

  } catch (error) {
    console.error('\n💥 Setup process failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  setupLandPlotStaking()
    .then(report => {
      console.log('\n🎊 Land plot staking setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Setup process failed:', error);
      process.exit(1);
    });
}

module.exports = { setupLandPlotStaking };
