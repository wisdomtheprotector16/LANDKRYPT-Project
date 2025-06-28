// Update Contract Addresses in All Environment Files
// This script updates contract addresses in all .env files after deployment

const fs = require('fs');
const path = require('path');

// Paths to environment files
const ENV_FILES = [
  '.env',                                           // Root .env
  'LandKrypt-main/LandKrypt-main/.env.local',      // Frontend .env.local
  'landkrypt-core/.env'                            // Core .env
];

function updateEnvironmentFiles(contractAddresses) {
  console.log('🔄 Updating contract addresses in all environment files...\n');

  // Contract address mappings
  const addressMappings = {
    'NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS': contractAddresses.CORE.RealEstateNFT,
    'NEXT_PUBLIC_LANDKRYPT_STABLECOIN_ADDRESS': contractAddresses.CORE.LKUSD,
    'NEXT_PUBLIC_LANDKRYPT_STAKING_TOKEN_ADDRESS': contractAddresses.CORE.LKST,
    'NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS': contractAddresses.OPERATIONAL.Marketplace,
    'NEXT_PUBLIC_NFT_DAO_ADDRESS': contractAddresses.GOVERNANCE.DAO,
    'NEXT_PUBLIC_STAKING_FACTORY_ADDRESS': contractAddresses.OPERATIONAL.StakingFactory,
    'NEXT_PUBLIC_EXCHANGE_ADDRESS': contractAddresses.CORE.Exchange,
    'NEXT_PUBLIC_ORACLE_ADDRESS': contractAddresses.CORE.Oracle,
    'NEXT_PUBLIC_DEVELOPMENT_CONTRACT_ADDRESS': contractAddresses.OPERATIONAL.DevelopmentContract
  };

  ENV_FILES.forEach(filePath => {
    const fullPath = path.resolve(filePath);
    
    console.log(`📝 Updating: ${filePath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath} - Skipping`);
      return;
    }

    try {
      let envContent = fs.readFileSync(fullPath, 'utf8');
      let updateCount = 0;

      // Update each contract address
      Object.entries(addressMappings).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          const oldLine = envContent.match(regex)[0];
          envContent = envContent.replace(regex, `${key}=${value}`);
          console.log(`   ✅ Updated ${key}`);
          updateCount++;
        } else {
          // Add new line if not found
          envContent += `\n${key}=${value}`;
          console.log(`   ➕ Added ${key}`);
          updateCount++;
        }
      });

      // Write updated content back to file
      fs.writeFileSync(fullPath, envContent);
      console.log(`   📁 File updated with ${updateCount} contract addresses\n`);

    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  });

  console.log('✅ All environment files updated successfully!\n');
}

// Read deployment manifest from latest deployment file
function getLatestDeployment() {
  const deploymentsDir = path.join(__dirname, 'LandKrypt-main', 'LandKrypt-main', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error('No deployments directory found. Please run deployment first.');
  }

  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.startsWith('deployment-') && file.endsWith('.json'))
    .sort()
    .reverse(); // Get latest

  if (deploymentFiles.length === 0) {
    throw new Error('No deployment files found. Please run deployment first.');
  }

  const latestFile = path.join(deploymentsDir, deploymentFiles[0]);
  const deployment = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  
  console.log(`📖 Reading deployment from: ${deploymentFiles[0]}`);
  console.log(`🕐 Deployment time: ${deployment.timestamp}`);
  console.log(`👤 Deployer: ${deployment.deployer}\n`);
  
  return deployment;
}

// Main execution
function main() {
  try {
    console.log('🚀 Starting contract address update process...\n');
    
    // Check if command line arguments provided
    const args = process.argv.slice(2);
    let contractAddresses;

    if (args.length > 0 && args[0] === '--from-deployment') {
      // Read from latest deployment file
      const deployment = getLatestDeployment();
      contractAddresses = deployment.contracts;
    } else {
      // Manual contract addresses (can be passed as argument)
      console.log('❌ No deployment source specified.');
      console.log('Usage: node update-contract-addresses-all.js --from-deployment');
      console.log('   or: node update-contract-addresses-all.js --manual <addresses>');
      process.exit(1);
    }

    // Display addresses to be updated
    console.log('📋 Contract addresses to update:');
    console.log(JSON.stringify(contractAddresses, null, 2));
    console.log('');

    // Update all environment files
    updateEnvironmentFiles(contractAddresses);

    console.log('🎉 Contract address update completed successfully!');
    
  } catch (error) {
    console.error('💥 Update failed:', error.message);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  main();
}

module.exports = { updateEnvironmentFiles, getLatestDeployment };
