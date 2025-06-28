// Update Oracle and Exchange Addresses in All .env Files
// This script updates the newly deployed contract addresses across all environment files

const fs = require('fs');
const path = require('path');

// New contract addresses from deployment
const NEW_ADDRESSES = {
    ORACLE: '0x164833417fe9D9b1B97EC1b381D1Ece8f8FAcAf9',
    EXCHANGE: '0x5D1ABE4139938AE3c78fda44D761d4d665F97816'
};

// Environment files to search and update (relative to current directory)
const ENV_SEARCH_PATHS = [
    // Current directory
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    
    // Parent directories
    '../.env',
    '../.env.local',
    '../../.env',
    '../../.env.local',
    '../../../.env',
    '../../../.env.local',
    
    // LandKrypt-main directory
    '../LandKrypt-main/.env',
    '../LandKrypt-main/.env.local',
    
    // Root project directory
    '../../../../.env',
    '../../../../.env.local',
    
    // Potential subdirectories
    './frontend/.env',
    './frontend/.env.local',
    './client/.env',
    './client/.env.local',
    './web/.env',
    './web/.env.local'
];

function updateEnvironmentFile(filePath, addresses) {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, reason: 'File not found' };
        }

        console.log(`📄 Processing: ${filePath}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Update Oracle address
        const oraclePattern = /NEXT_PUBLIC_ORACLE_ADDRESS=.*/g;
        if (content.match(oraclePattern)) {
            content = content.replace(oraclePattern, `NEXT_PUBLIC_ORACLE_ADDRESS=${addresses.ORACLE}`);
            modified = true;
            console.log(`   🔮 Updated Oracle address: ${addresses.ORACLE}`);
        } else if (content.includes('ORACLE_ADDRESS') || content.includes('oracle')) {
            // Add if not exists
            content += `\nNEXT_PUBLIC_ORACLE_ADDRESS=${addresses.ORACLE}`;
            modified = true;
            console.log(`   🔮 Added Oracle address: ${addresses.ORACLE}`);
        }

        // Update Exchange address
        const exchangePattern = /NEXT_PUBLIC_EXCHANGE_ADDRESS=.*/g;
        if (content.match(exchangePattern)) {
            content = content.replace(exchangePattern, `NEXT_PUBLIC_EXCHANGE_ADDRESS=${addresses.EXCHANGE}`);
            modified = true;
            console.log(`   💱 Updated Exchange address: ${addresses.EXCHANGE}`);
        } else if (content.includes('EXCHANGE_ADDRESS') || content.includes('exchange')) {
            // Add if not exists
            content += `\nNEXT_PUBLIC_EXCHANGE_ADDRESS=${addresses.EXCHANGE}`;
            modified = true;
            console.log(`   💱 Added Exchange address: ${addresses.EXCHANGE}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`   ✅ File updated successfully`);
            return { success: true, modified: true };
        } else {
            console.log(`   ℹ️  No relevant addresses found to update`);
            return { success: true, modified: false };
        }

    } catch (error) {
        console.log(`   ❌ Error updating file: ${error.message}`);
        return { success: false, reason: error.message };
    }
}

function findAllEnvFiles(searchPaths) {
    const foundFiles = [];
    
    for (const searchPath of searchPaths) {
        const fullPath = path.resolve(searchPath);
        
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                foundFiles.push({
                    path: searchPath,
                    fullPath: fullPath,
                    size: stats.size
                });
            }
        }
    }
    
    return foundFiles;
}

async function main() {
    console.log('🔄 LandKrypt Environment Files Update Script');
    console.log('=============================================\n');

    console.log('📝 New Contract Addresses:');
    console.log('===========================');
    console.log(`🔮 Oracle:   ${NEW_ADDRESSES.ORACLE}`);
    console.log(`💱 Exchange: ${NEW_ADDRESSES.EXCHANGE}\n`);

    // Find all environment files
    console.log('🔍 Searching for environment files...');
    console.log('======================================');
    
    const envFiles = findAllEnvFiles(ENV_SEARCH_PATHS);
    
    if (envFiles.length === 0) {
        console.log('❌ No environment files found!');
        return;
    }

    console.log(`📋 Found ${envFiles.length} environment files:\n`);
    
    // Display found files
    envFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} (${file.size} bytes)`);
    });

    console.log('\n🚀 Starting updates...');
    console.log('=======================\n');

    // Update each file
    const results = {
        total: envFiles.length,
        updated: 0,
        skipped: 0,
        errors: 0
    };

    for (const file of envFiles) {
        const result = updateEnvironmentFile(file.fullPath, NEW_ADDRESSES);
        
        if (result.success) {
            if (result.modified) {
                results.updated++;
            } else {
                results.skipped++;
            }
        } else {
            results.errors++;
        }
        
        console.log(); // Empty line for readability
    }

    // Summary
    console.log('📊 Update Summary:');
    console.log('==================');
    console.log(`📁 Total files processed: ${results.total}`);
    console.log(`✅ Files updated: ${results.updated}`);
    console.log(`ℹ️  Files skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);

    if (results.updated > 0) {
        console.log('\n🎉 Update completed successfully!');
        console.log('\n📝 Updated addresses:');
        console.log(`   🔮 Oracle: ${NEW_ADDRESSES.ORACLE}`);
        console.log(`   💱 Exchange: ${NEW_ADDRESSES.EXCHANGE}`);
        
        console.log('\n📋 Next steps:');
        console.log('==============');
        console.log('1. Restart your development server');
        console.log('2. Clear browser cache if needed');
        console.log('3. Test the Oracle and Exchange functionality');
        console.log('4. Verify contracts on Etherscan');
        console.log('5. Commit changes to Git repository');
    } else {
        console.log('\n⚠️  No files were updated. Check if the addresses already exist or if files contain relevant content.');
    }
}

// Additional function to update specific frontend config files
function updateFrontendConfigs() {
    console.log('\n🎨 Updating Frontend Configuration Files...');
    console.log('===========================================');

    const configFiles = [
        './src/contracts/abis.js',
        './src/config/contracts.js',
        './config/contracts.js',
        './contracts.config.js'
    ];

    for (const configFile of configFiles) {
        if (fs.existsSync(configFile)) {
            try {
                let content = fs.readFileSync(configFile, 'utf8');
                let modified = false;

                // Update Oracle address in contract configs
                if (content.includes('ORACLE') || content.includes('Oracle')) {
                    content = content.replace(
                        /ORACLE:\s*process\.env\.NEXT_PUBLIC_ORACLE_ADDRESS\s*\|\|\s*['"][^'"]*['"]/g,
                        `ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '${NEW_ADDRESSES.ORACLE}'`
                    );
                    modified = true;
                }

                // Update Exchange address in contract configs
                if (content.includes('EXCHANGE') || content.includes('Exchange')) {
                    content = content.replace(
                        /EXCHANGE:\s*process\.env\.NEXT_PUBLIC_EXCHANGE_ADDRESS\s*\|\|\s*['"][^'"]*['"]/g,
                        `EXCHANGE: process.env.NEXT_PUBLIC_EXCHANGE_ADDRESS || '${NEW_ADDRESSES.EXCHANGE}'`
                    );
                    modified = true;
                }

                if (modified) {
                    fs.writeFileSync(configFile, content);
                    console.log(`✅ Updated ${configFile}`);
                }
            } catch (error) {
                console.log(`❌ Error updating ${configFile}: ${error.message}`);
            }
        }
    }
}

// Run the main function
main()
    .then(() => {
        updateFrontendConfigs();
        console.log('\n✨ All updates completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Update failed:', error);
        process.exit(1);
    });
