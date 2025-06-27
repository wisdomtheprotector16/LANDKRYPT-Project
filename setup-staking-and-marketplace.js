// Setup Staking Contracts and Marketplace Listings
// This script will create staking contracts for each NFT and list them on the marketplace

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const RECIPIENT_ADDRESS = '0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC';
const LISTING_PRICE = ethers.parseUnits('200000', 18); // 200,000 LKUSD (18 decimals)
const TARGET_AMOUNT = ethers.parseUnits('200000', 18); // Same as listing price for simplicity

// NFT Data with Token IDs
const NFT_DATA = [
  {
    tokenId: 1,
    name: "Luxury Modern Apartment Complex",
    imageCid: "bafkreihsg6iwam4wpykdlhx7ppnss7vgbsniv6n6bg7qtz33q7rti7kg7e",
    metadataCid: "bafkreiaykl22sqzghu2hps3g6jf6q7xij2bppy2xom2vd6frbofagwpcse",
    txHash: "0x14f82bb1d29c29052f320081c12a233b11a7254b3c87bc38548707b29174e908"
  },
  {
    tokenId: 2,
    name: "Executive Commercial Building",
    imageCid: "bafkreiglezhg5pjmiwqf2oinalsgmco3mkji66impkqomnpweay3msq2dy",
    metadataCid: "bafkreialwcgfzwbvfwbonhbuyrv6gnlmy6kkk7tanphsc6u7yp42wyygqe",
    txHash: "0x8582fc5d3f2260b8a206f3fbc2cb32e7d0aa734646801f39022bb3ed3d6d779a"
  },
  {
    tokenId: 3,
    name: "Waterfront Villa Estate",
    imageCid: "bafkreihicdyg6t23vnhromvnxu6gcvtgpntu4o6otgiv5c5toccw5to64q",
    metadataCid: "bafkreiahzfn3qra62nruv7i5wumxvlfrl2eylnrwp6v662hstc4bixr4ju",
    txHash: "0x87530953e036419243f734e8b13c1a9c854bcff3ca28d24f8956549aabe1821f"
  },
  {
    tokenId: 4,
    name: "Urban Residential Tower",
    imageCid: "bafkreiafwp6utm7qq2p4dyijimyvrhixhneptojixvxwvwuvoqjrnaolxe",
    metadataCid: "bafkreigxfcrgju6iyte44njqbed76pqhxpmwv2gbl3cm3bqgtdzhvdlliq",
    txHash: "0xda20bfc0e0d1101329c7c6eeec273fd8e0d12c6e9a889d8141f596c32134fb7f"
  },
  {
    tokenId: 5,
    name: "Commercial Shopping Plaza",
    imageCid: "bafkreiatqikdd5x63jtgtit2ssi75n5vdyn2m22evyqythfkjrumjg2mge",
    metadataCid: "bafkreidprzvvbqzgw7hvfbf6mooltmqpvplroidqyn4msmogthuvytar4y",
    txHash: "0xa03a43ff58e6f12ff5c18c2b75157b087999ba5ad4282b6ccaa6fc91483bed1e"
  },
  {
    tokenId: 6,
    name: "Luxury Resort Development",
    imageCid: "bafkreicn3aaqcqcsq4vywnsjmviwkdw73d2npchrnrohnsckoeknbme6j4",
    metadataCid: "bafkreif2ddon4gaplzcqyfeyaecpqcnaoixf3u6egwkwvm6uzr4cszpazq",
    txHash: "0x5dc492546024606e0c547a2bec81b6ffeb803e128fe431d48041b21378c5aab5"
  }
];

// Contract ABIs
const STAKING_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "targetAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "listingPrice", "type": "uint256"}
    ],
    "name": "createStakingContract",
    "outputs": [],
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

async function setupStakingAndMarketplace() {
  console.log('🚀 Starting Staking Contract Setup and Marketplace Listing...\n');

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

    console.log(`📋 Setting up staking contracts for ${NFT_DATA.length} NFTs`);
    console.log(`💰 Listing price: ${ethers.formatUnits(LISTING_PRICE, 18)} LKUSD each`);
    console.log(`🎯 Target amount: ${ethers.formatUnits(TARGET_AMOUNT, 18)} LKUSD each`);
    console.log(`👤 Owner: ${wallet.address}\n`);

    const results = [];
    const errors = [];

    for (let i = 0; i < NFT_DATA.length; i++) {
      const nft = NFT_DATA[i];
      
      console.log(`\n🏠 Processing NFT ${i + 1}/${NFT_DATA.length}:`);
      console.log(`   🏷️  Token ID: ${nft.tokenId}`);
      console.log(`   📝 Name: ${nft.name}`);

      try {
        // Check if NFT owner is correct
        const nftOwner = await nftContract.ownerOf(nft.tokenId);
        if (nftOwner.toLowerCase() !== wallet.address.toLowerCase()) {
          throw new Error(`NFT ${nft.tokenId} not owned by deployer. Owner: ${nftOwner}`);
        }
        console.log(`   ✅ NFT ownership verified`);

        // Check if staking contract already exists
        let stakingContractAddress;
        try {
          stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
          if (stakingContractAddress !== '0x0000000000000000000000000000000000000000') {
            console.log(`   ⚠️  Staking contract already exists: ${stakingContractAddress}`);
            results.push({
              tokenId: nft.tokenId,
              name: nft.name,
              stakingContract: stakingContractAddress,
              status: 'already_exists'
            });
            continue;
          }
        } catch (error) {
          // Ignore error, contract doesn't exist
        }

        // Approve StakingFactory to transfer NFT
        console.log(`   🔓 Approving StakingFactory to transfer NFT...`);
        const approveTx = await nftContract.approve(config.stakingFactoryAddress, nft.tokenId);
        await approveTx.wait();
        console.log(`   ✅ Approval confirmed: ${approveTx.hash}`);

        // Create staking contract
        console.log(`   🏭 Creating staking contract...`);
        const createTx = await stakingFactory.createStakingContract(
          nft.tokenId,
          TARGET_AMOUNT,
          LISTING_PRICE
        );

        console.log(`   ⏳ Transaction sent: ${createTx.hash}`);
        const receipt = await createTx.wait();
        console.log(`   ✅ Staking contract created in block ${receipt.blockNumber}`);

        // Get the staking contract address
        stakingContractAddress = await stakingFactory.getStakingContractForNFT(nft.tokenId);
        console.log(`   🏭 Staking contract address: ${stakingContractAddress}`);

        results.push({
          tokenId: nft.tokenId,
          name: nft.name,
          stakingContract: stakingContractAddress,
          createTxHash: createTx.hash,
          approveTxHash: approveTx.hash,
          status: 'created'
        });

        console.log(`   🎉 NFT ${nft.tokenId} successfully setup and listed!`);

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
          error: error.message
        });
      }
    }

    // Summary report
    console.log('\n' + '='.repeat(80));
    console.log('🎉 STAKING SETUP AND MARKETPLACE LISTING COMPLETED!');
    console.log('='.repeat(80));
    console.log(`📊 Total NFTs: ${NFT_DATA.length}`);
    console.log(`✅ Successfully Setup: ${results.filter(r => r.status === 'created').length}`);
    console.log(`⚠️  Already Existed: ${results.filter(r => r.status === 'already_exists').length}`);
    console.log(`❌ Failed: ${errors.length}`);

    if (results.length > 0) {
      console.log('\n✅ SUCCESSFUL SETUPS:');
      results.forEach(result => {
        console.log(`   🏠 Token #${result.tokenId}: ${result.name}`);
        console.log(`      🏭 Staking Contract: ${result.stakingContract}`);
        if (result.createTxHash) {
          console.log(`      🔗 Create TX: ${result.createTxHash}`);
        }
        console.log(`      📈 Status: ${result.status.toUpperCase()}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ FAILED SETUPS:');
      errors.forEach(error => {
        console.log(`   🏠 Token #${error.tokenId}: ${error.name}`);
        console.log(`      ❌ Error: ${error.error}`);
      });
    }

    // Save results
    const reportData = {
      timestamp: new Date().toISOString(),
      listingPrice: ethers.formatUnits(LISTING_PRICE, 18),
      targetAmount: ethers.formatUnits(TARGET_AMOUNT, 18),
      total: NFT_DATA.length,
      successful: results.filter(r => r.status === 'created').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      failed: errors.length,
      results,
      errors
    };

    const fs = require('fs');
    const reportPath = './staking-marketplace-setup-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);

    return reportData;

  } catch (error) {
    console.error('\n💥 Setup process failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  setupStakingAndMarketplace()
    .then(report => {
      console.log('\n🎊 Setup process completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Setup process failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStakingAndMarketplace };
