const fs = require('fs');
const path = require('path');

// This script will be used to update contract addresses in all environment files
// after successful deployment

function updateEnvFile(filePath, addresses) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update contract addresses
    Object.entries(addresses.CORE || {}).forEach(([key, address]) => {
        const envKey = `NEXT_PUBLIC_${key.toUpperCase()}_ADDRESS`;
        const regex = new RegExp(`${envKey}=.*`, 'g');
        if (content.includes(envKey)) {
            content = content.replace(regex, `${envKey}=${address}`);
        } else {
            content += `\n${envKey}=${address}`;
        }
    });

    Object.entries(addresses.OPERATIONAL || {}).forEach(([key, address]) => {
        const envKey = `NEXT_PUBLIC_${key.toUpperCase()}_ADDRESS`;
        const regex = new RegExp(`${envKey}=.*`, 'g');
        if (content.includes(envKey)) {
            content = content.replace(regex, `${envKey}=${address}`);
        } else {
            content += `\n${envKey}=${address}`;
        }
    });

    Object.entries(addresses.GOVERNANCE || {}).forEach(([key, address]) => {
        const envKey = `NEXT_PUBLIC_NFT_${key.toUpperCase()}_ADDRESS`;
        const regex = new RegExp(`${envKey}=.*`, 'g');
        if (content.includes(envKey)) {
            content = content.replace(regex, `${envKey}=${address}`);
        } else {
            content += `\n${envKey}=${address}`;
        }
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
}

function updateContractAddresses(deploymentOutput) {
    const addresses = JSON.parse(deploymentOutput);
    
    console.log('\n🔄 Updating contract addresses in environment files...\n');
    
    // Files to update
    const filesToUpdate = [
        'C:\\Users\\USER\\Downloads\\LANDKRYPT\\LandKrypt-main\\LandKrypt-main\\.env',
        'C:\\Users\\USER\\Downloads\\LANDKRYPT\\LandKrypt-main\\LandKrypt-main\\.env.local',
        'C:\\Users\\USER\\Downloads\\LANDKRYPT\\LandKrypt-main\\LandKrypt-main\\.env.production',
        'C:\\Users\\USER\\Downloads\\LANDKRYPT\\landkrypt-core\\.env'
    ];

    filesToUpdate.forEach(file => {
        updateEnvFile(file, addresses);
    });

    console.log('\n✅ All environment files updated with contract addresses!');
    console.log('\n📋 Deployed Contract Addresses:');
    console.log(JSON.stringify(addresses, null, 2));
}

// Export for use in deployment script
module.exports = { updateContractAddresses };

// Allow running directly from command line
if (require.main === module) {
    const deploymentOutput = process.argv[2];
    if (!deploymentOutput) {
        console.error('Usage: node update-contract-addresses.js "<deployment-output-json>"');
        process.exit(1);
    }
    updateContractAddresses(deploymentOutput);
}
