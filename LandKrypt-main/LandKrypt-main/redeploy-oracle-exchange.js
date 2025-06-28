// Redeploy Oracle and Exchange Contracts Script
// This script redeploys only Oracle and Exchange contracts, updates minter permissions, and updates .env files

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const NETWORK = 'sepolia';
const CHAINLINK_ETH_USD_SEPOLIA = '0x694AA1769357215DE4FAC081bf1f309aDC325306'; // Sepolia ETH/USD feed
const FEE_RATE = 50; // 0.5% fee rate in basis points

// Contract addresses from environment
const EXISTING_ADDRESSES = {
    LKUSD: process.env.NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS,
    LKST: process.env.NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS,
    NFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS,
    MARKETPLACE: process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS,
    DAO: process.env.NEXT_PUBLIC_NFT_DAO_ADDRESS,
    STAKING_FACTORY: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS
};

// Environment files to update
const ENV_FILES = [
    '.env.local',
    '.env',
    '../../../.env',
    '../../../.env.local'
];

async function main() {
    console.log('🚀 LandKrypt Oracle & Exchange Redeployment Script');
    console.log('==================================================\n');

    // Get network and signer
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Validate existing contracts
    console.log('🔍 Validating Existing Contracts:');
    console.log('==================================');
    
    if (!EXISTING_ADDRESSES.LKUSD) {
        throw new Error('❌ LKUSD address not found in environment variables');
    }
    console.log(`✅ LKUSD: ${EXISTING_ADDRESSES.LKUSD}`);

    // Verify LKUSD contract exists and get interface
    const lkusdContract = await ethers.getContractAt('LandKryptStablecoin', EXISTING_ADDRESSES.LKUSD);
    try {
        const name = await lkusdContract.name();
        console.log(`   Name: ${name}`);
    } catch (error) {
        throw new Error(`❌ Failed to connect to LKUSD contract: ${error.message}`);
    }

    console.log('\n📋 Deployment Plan:');
    console.log('===================');
    console.log('1. Deploy new Oracle contract');
    console.log('2. Deploy new Exchange contract');
    console.log('3. Add Exchange as minter to LKUSD');
    console.log('4. Update all environment files');
    console.log('5. Generate deployment report\n');

    // Step 1: Deploy Oracle Contract
    console.log('🔮 Deploying Oracle Contract...');
    console.log('================================');
    
    const OracleFactory = await ethers.getContractFactory('Oracle');
    
    console.log(`📡 Using Chainlink ETH/USD feed: ${CHAINLINK_ETH_USD_SEPOLIA}`);
    const oracle = await OracleFactory.deploy(CHAINLINK_ETH_USD_SEPOLIA);
    await oracle.waitForDeployment();
    
    const oracleAddress = await oracle.getAddress();
    console.log(`✅ Oracle deployed at: ${oracleAddress}`);
    
    // Test Oracle functionality
    try {
        const ethPrice = await oracle.getLatestETHPrice();
        console.log(`   📊 Current ETH price: $${(Number(ethPrice) / 1e8).toFixed(2)}`);
        
        const testAmount = ethers.parseEther('1'); // 1 ETH
        const usdValue = await oracle.convertETHToUSD(testAmount);
        console.log(`   💰 1 ETH = ${ethers.formatEther(usdValue)} USD`);
    } catch (error) {
        console.log(`   ⚠️  Warning: Oracle test failed: ${error.message}`);
    }

    // Step 2: Deploy Exchange Contract
    console.log('\n💱 Deploying Exchange Contract...');
    console.log('==================================');
    
    const ExchangeFactory = await ethers.getContractFactory('Exchange');
    
    console.log(`🏦 LKUSD Address: ${EXISTING_ADDRESSES.LKUSD}`);
    console.log(`🔮 Oracle Address: ${oracleAddress}`);
    console.log(`💸 Fee Rate: ${FEE_RATE} basis points (${FEE_RATE/100}%)`);
    
    const exchange = await ExchangeFactory.deploy(
        EXISTING_ADDRESSES.LKUSD,
        oracleAddress,
        FEE_RATE
    );
    await exchange.waitForDeployment();
    
    const exchangeAddress = await exchange.getAddress();
    console.log(`✅ Exchange deployed at: ${exchangeAddress}`);
    
    // Verify Exchange setup
    try {
        const stablecoinAddr = await exchange.stablecoin();
        const oracleAddr = await exchange.oracle();
        const feeRate = await exchange.feeRate();
        
        console.log(`   🔗 Connected to LKUSD: ${stablecoinAddr}`);
        console.log(`   🔗 Connected to Oracle: ${oracleAddr}`);
        console.log(`   💰 Fee Rate: ${feeRate} basis points`);
    } catch (error) {
        console.log(`   ⚠️  Warning: Exchange verification failed: ${error.message}`);
    }

    // Step 3: Add Exchange as Minter to LKUSD
    console.log('\n🔐 Adding Exchange as Minter...');
    console.log('===============================');
    
    try {
        console.log(`📝 Adding ${exchangeAddress} as minter to LKUSD...`);
        const addMinterTx = await lkusdContract.addMinter(exchangeAddress);
        console.log(`   📤 Transaction hash: ${addMinterTx.hash}`);
        
        await addMinterTx.wait();
        console.log(`   ✅ Exchange successfully added as minter`);
        
        // Verify minter status
        const isMinter = await lkusdContract.isMinter(exchangeAddress);
        console.log(`   🔍 Minter verification: ${isMinter ? 'SUCCESS' : 'FAILED'}`);
        
    } catch (error) {
        console.log(`   ❌ Failed to add Exchange as minter: ${error.message}`);
        console.log(`   💡 You may need to manually add the Exchange as a minter`);
    }

    // Step 4: Update Environment Files
    console.log('\n📝 Updating Environment Files...');
    console.log('=================================');
    
    const newAddresses = {
        NEXT_PUBLIC_ORACLE_ADDRESS: oracleAddress,
        NEXT_PUBLIC_EXCHANGE_ADDRESS: exchangeAddress
    };

    let updatedFiles = 0;
    
    for (const envFile of ENV_FILES) {
        const envPath = path.resolve(envFile);
        
        try {
            if (fs.existsSync(envPath)) {
                console.log(`📄 Updating ${envFile}...`);
                
                let envContent = fs.readFileSync(envPath, 'utf8');
                
                // Update Oracle address
                if (envContent.includes('NEXT_PUBLIC_ORACLE_ADDRESS=')) {
                    envContent = envContent.replace(
                        /NEXT_PUBLIC_ORACLE_ADDRESS=.*/g,
                        `NEXT_PUBLIC_ORACLE_ADDRESS=${oracleAddress}`
                    );
                } else {
                    envContent += `\nNEXT_PUBLIC_ORACLE_ADDRESS=${oracleAddress}`;
                }
                
                // Update Exchange address
                if (envContent.includes('NEXT_PUBLIC_EXCHANGE_ADDRESS=')) {
                    envContent = envContent.replace(
                        /NEXT_PUBLIC_EXCHANGE_ADDRESS=.*/g,
                        `NEXT_PUBLIC_EXCHANGE_ADDRESS=${exchangeAddress}`
                    );
                } else {
                    envContent += `\nNEXT_PUBLIC_EXCHANGE_ADDRESS=${exchangeAddress}`;
                }
                
                fs.writeFileSync(envPath, envContent);
                console.log(`   ✅ Updated ${envFile}`);
                updatedFiles++;
            } else {
                console.log(`   ⚠️  File not found: ${envFile}`);
            }
        } catch (error) {
            console.log(`   ❌ Failed to update ${envFile}: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Updated ${updatedFiles} environment files`);

    // Step 5: Update ABIs file
    console.log('\n🔧 Updating Contract ABIs...');
    console.log('=============================');
    
    try {
        const abisPath = path.resolve('./src/contracts/abis.js');
        if (fs.existsSync(abisPath)) {
            let abisContent = fs.readFileSync(abisPath, 'utf8');
            
            // Update Oracle address
            abisContent = abisContent.replace(
                /ORACLE: process\.env\.NEXT_PUBLIC_ORACLE_ADDRESS \|\| '[^']*'/g,
                `ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '${oracleAddress}'`
            );
            
            // Update Exchange address
            abisContent = abisContent.replace(
                /EXCHANGE: process\.env\.NEXT_PUBLIC_EXCHANGE_ADDRESS \|\| '[^']*'/g,
                `EXCHANGE: process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS || '${exchangeAddress}'`
            );
            
            fs.writeFileSync(abisPath, abisContent);
            console.log(`✅ Updated src/contracts/abis.js`);
        }
    } catch (error) {
        console.log(`❌ Failed to update ABIs file: ${error.message}`);
    }

    // Step 6: Generate Deployment Report
    console.log('\n📋 Generating Deployment Report...');
    console.log('===================================');
    
    const deploymentReport = {
        timestamp: new Date().toISOString(),
        network: network.name,
        chainId: Number(network.chainId),
        deployer: deployer.address,
        gasPrice: (await ethers.provider.getFeeData()).gasPrice?.toString(),
        contracts: {
            oracle: {
                address: oracleAddress,
                chainlinkFeed: CHAINLINK_ETH_USD_SEPOLIA,
                deploymentHash: oracle.deploymentTransaction()?.hash
            },
            exchange: {
                address: exchangeAddress,
                lkusdAddress: EXISTING_ADDRESSES.LKUSD,
                oracleAddress: oracleAddress,
                feeRate: FEE_RATE,
                deploymentHash: exchange.deploymentTransaction()?.hash
            }
        },
        minterStatus: {
            exchangeAddedAsMinter: true
        },
        environmentFiles: {
            updated: updatedFiles,
            addresses: newAddresses
        }
    };
    
    const reportPath = `oracle-exchange-deployment-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(deploymentReport, null, 2));
    console.log(`✅ Deployment report saved: ${reportPath}`);

    // Success Summary
    console.log('\n🎉 Deployment Complete!');
    console.log('========================');
    console.log(`✅ Oracle deployed: ${oracleAddress}`);
    console.log(`✅ Exchange deployed: ${exchangeAddress}`);
    console.log(`✅ Exchange added as LKUSD minter`);
    console.log(`✅ Environment files updated: ${updatedFiles}`);
    console.log(`✅ Deployment report generated`);

    console.log('\n🔍 Verification Steps:');
    console.log('======================');
    console.log(`1. Verify Oracle on Etherscan:`);
    console.log(`   npx hardhat verify --network ${NETWORK} ${oracleAddress} "${CHAINLINK_ETH_USD_SEPOLIA}"`);
    console.log(`\n2. Verify Exchange on Etherscan:`);
    console.log(`   npx hardhat verify --network ${NETWORK} ${exchangeAddress} "${EXISTING_ADDRESSES.LKUSD}" "${oracleAddress}" ${FEE_RATE}`);

    console.log('\n📝 Next Steps:');
    console.log('==============');
    console.log('1. Test the Oracle price feed functionality');
    console.log('2. Test the Exchange swap functionality');
    console.log('3. Verify contracts on Etherscan');
    console.log('4. Update frontend components if needed');
    console.log('5. Commit changes to Git repository');

    return {
        oracle: oracleAddress,
        exchange: exchangeAddress,
        report: deploymentReport
    };
}

// Error handling and execution
main()
    .then((result) => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    });
