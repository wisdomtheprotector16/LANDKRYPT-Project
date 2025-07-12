// Automated NFT Generation Tool
// Simplifies NFT creation using templates and automated workflows

const { NFTTemplateEngine } = require('../../config/nft-templates');
const NFTManager = require('../../scripts/metadata/nft-unified');
const supabaseConnection = require('../../src/lib/database/supabase-enhanced');
const fs = require('fs');
const path = require('path');

class AutomatedNFTGenerator {
  constructor() {
    this.nftManager = new NFTManager();
    this.outputDir = path.join(__dirname, '../../generated-nfts');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // ====== SINGLE NFT GENERATION ======

  async generateSingleNFT(config) {
    console.log('🎨 Generating single NFT...');
    
    try {
      // Validate configuration
      this.validateNFTConfig(config);
      
      // Get next token ID
      const tokenId = config.tokenId || await this.getNextTokenId();
      
      // Generate metadata using template
      const metadata = NFTTemplateEngine.generateMetadata(
        config.template,
        config.location,
        config.rarity,
        {
          tokenId,
          baseValue: config.baseValue,
          attributes: config.customAttributes || [],
          properties: config.customProperties || {}
        }
      );
      
      // Handle image
      const imagePath = await this.prepareImage(config.imagePath, metadata);
      
      // Generate NFT
      const result = await this.nftManager.mintNFT(
        config.recipient,
        tokenId,
        metadata.name,
        metadata.description,
        imagePath,
        metadata.attributes
      );
      
      // Store in database
      await this.storeNFTData(tokenId, config.recipient, metadata, result);
      
      // Save generation record
      await this.saveGenerationRecord({
        type: 'single',
        config,
        metadata,
        result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ NFT generated successfully: Token ID ${tokenId}`);
      return { tokenId, metadata, result };
      
    } catch (error) {
      console.error('❌ NFT generation failed:', error.message);
      throw error;
    }
  }

  // ====== BATCH NFT GENERATION ======

  async generateBatchNFTs(batchConfig) {
    console.log(`🎨 Generating batch of ${batchConfig.count} NFTs...`);
    
    try {
      const results = [];
      const startTokenId = batchConfig.startTokenId || await this.getNextTokenId();
      
      for (let i = 0; i < batchConfig.count; i++) {
        const tokenId = startTokenId + i;
        
        // Generate configuration for this NFT
        const nftConfig = this.generateNFTConfig(batchConfig, tokenId, i);
        
        try {
          console.log(`\n[${i + 1}/${batchConfig.count}] Generating NFT #${tokenId}...`);
          
          const result = await this.generateSingleNFT(nftConfig);
          results.push(result);
          
          // Add delay between generations
          if (i < batchConfig.count - 1) {
            console.log('⏳ Waiting 2 seconds before next generation...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`❌ Failed to generate NFT #${tokenId}:`, error.message);
          results.push({
            tokenId,
            error: error.message,
            failed: true
          });
        }
      }
      
      // Save batch report
      const batchReport = {
        type: 'batch',
        config: batchConfig,
        results,
        summary: {
          total: batchConfig.count,
          successful: results.filter(r => !r.failed).length,
          failed: results.filter(r => r.failed).length
        },
        timestamp: new Date().toISOString()
      };
      
      await this.saveGenerationRecord(batchReport);
      
      console.log(`\n📊 Batch generation complete:`);
      console.log(`   ✅ Successful: ${batchReport.summary.successful}`);
      console.log(`   ❌ Failed: ${batchReport.summary.failed}`);
      
      return batchReport;
      
    } catch (error) {
      console.error('❌ Batch generation failed:', error.message);
      throw error;
    }
  }

  // ====== COLLECTION GENERATION ======

  async generateCollection(collectionConfig) {
    console.log(`🏗️  Generating collection: ${collectionConfig.name}`);
    
    try {
      const collections = [];
      
      for (const batch of collectionConfig.batches) {
        console.log(`\n📦 Processing batch: ${batch.name}`);
        
        const batchResult = await this.generateBatchNFTs({
          ...batch,
          recipient: collectionConfig.recipient || batch.recipient
        });
        
        collections.push({
          name: batch.name,
          result: batchResult
        });
      }
      
      // Save collection report
      const collectionReport = {
        type: 'collection',
        name: collectionConfig.name,
        description: collectionConfig.description,
        collections,
        summary: {
          totalBatches: collections.length,
          totalNFTs: collections.reduce((sum, c) => sum + c.result.summary.total, 0),
          successfulNFTs: collections.reduce((sum, c) => sum + c.result.summary.successful, 0),
          failedNFTs: collections.reduce((sum, c) => sum + c.result.summary.failed, 0)
        },
        timestamp: new Date().toISOString()
      };
      
      await this.saveGenerationRecord(collectionReport);
      
      console.log(`\n🎉 Collection generation complete:`);
      console.log(`   📦 Batches: ${collectionReport.summary.totalBatches}`);
      console.log(`   🎨 Total NFTs: ${collectionReport.summary.totalNFTs}`);
      console.log(`   ✅ Successful: ${collectionReport.summary.successfulNFTs}`);
      console.log(`   ❌ Failed: ${collectionReport.summary.failedNFTs}`);
      
      return collectionReport;
      
    } catch (error) {
      console.error('❌ Collection generation failed:', error.message);
      throw error;
    }
  }

  // ====== UTILITY METHODS ======

  generateNFTConfig(batchConfig, tokenId, index) {
    const config = {
      tokenId,
      recipient: batchConfig.recipient,
      template: this.selectTemplate(batchConfig.templates, index),
      location: this.selectLocation(batchConfig.locations, index),
      rarity: this.selectRarity(batchConfig.rarities, index),
      baseValue: this.calculateBaseValue(batchConfig, index),
      imagePath: this.selectImagePath(batchConfig.imagePaths, index)
    };
    
    // Add custom attributes if specified
    if (batchConfig.customAttributes) {
      config.customAttributes = Array.isArray(batchConfig.customAttributes) 
        ? batchConfig.customAttributes 
        : [batchConfig.customAttributes];
    }
    
    return config;
  }

  selectTemplate(templates, index) {
    if (Array.isArray(templates)) {
      return templates[index % templates.length];
    }
    return templates;
  }

  selectLocation(locations, index) {
    if (Array.isArray(locations)) {
      return locations[index % locations.length];
    }
    return locations;
  }

  selectRarity(rarities, index) {
    if (Array.isArray(rarities)) {
      // Weighted selection for rarities
      const weights = {
        common: 50,
        uncommon: 30,
        rare: 15,
        epic: 4,
        legendary: 1
      };
      
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      const random = Math.random() * totalWeight;
      
      let currentWeight = 0;
      for (const [rarity, weight] of Object.entries(weights)) {
        currentWeight += weight;
        if (random <= currentWeight && rarities.includes(rarity)) {
          return rarity;
        }
      }
      
      return rarities[0]; // Fallback
    }
    return rarities;
  }

  calculateBaseValue(batchConfig, index) {
    if (batchConfig.baseValueRange) {
      const { min, max } = batchConfig.baseValueRange;
      return min + Math.random() * (max - min);
    }
    return batchConfig.baseValue;
  }

  selectImagePath(imagePaths, index) {
    if (Array.isArray(imagePaths)) {
      return imagePaths[index % imagePaths.length];
    }
    return imagePaths;
  }

  async prepareImage(imagePath, metadata) {
    // If no image path provided, use default from template
    if (!imagePath) {
      const defaultImagePath = path.join(__dirname, '../../public/nfts/defaults', metadata.properties.defaultImage);
      if (fs.existsSync(defaultImagePath)) {
        return defaultImagePath;
      } else {
        throw new Error(`Default image not found: ${metadata.properties.defaultImage}`);
      }
    }
    
    // Validate provided image path
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    return imagePath;
  }

  async getNextTokenId() {
    try {
      return await this.nftManager.getNextTokenId();
    } catch (error) {
      console.warn('Could not get next token ID from contract, using timestamp-based ID');
      return Date.now() % 1000000; // Fallback to timestamp-based ID
    }
  }

  async storeNFTData(tokenId, ownerAddress, metadata, mintResult) {
    try {
      await supabaseConnection.createNFT(tokenId, ownerAddress, {
        ...metadata,
        mintResult,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to store NFT data in database:', error.message);
    }
  }

  async saveGenerationRecord(record) {
    try {
      const filename = `generation-${record.type}-${Date.now()}.json`;
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(record, null, 2));
      console.log(`📄 Generation record saved: ${filename}`);
    } catch (error) {
      console.warn('Failed to save generation record:', error.message);
    }
  }

  validateNFTConfig(config) {
    const required = ['recipient', 'template', 'location', 'rarity'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!NFTTemplateEngine.validateTemplate(config.template)) {
      throw new Error(`Invalid template: ${config.template}`);
    }
    
    if (!NFTTemplateEngine.validateLocation(config.location)) {
      throw new Error(`Invalid location: ${config.location}`);
    }
    
    if (!NFTTemplateEngine.validateRarity(config.rarity)) {
      throw new Error(`Invalid rarity: ${config.rarity}`);
    }
  }

  // ====== HELPER METHODS FOR CLI ======

  listTemplates() {
    const templates = NFTTemplateEngine.getAvailableTemplates();
    console.log('\n📋 Available Templates:');
    templates.forEach(template => {
      console.log(`   ${template.key}: ${template.name} (${template.category})`);
    });
  }

  listLocations() {
    const locations = NFTTemplateEngine.getAvailableLocations();
    console.log('\n🌍 Available Locations:');
    locations.forEach(location => {
      console.log(`   ${location.key}: ${location.name}, ${location.country}`);
    });
  }

  listRarities() {
    const rarities = NFTTemplateEngine.getAvailableRarities();
    console.log('\n✨ Available Rarities:');
    rarities.forEach(rarity => {
      console.log(`   ${rarity.key}: ${rarity.rarity} (+${(rarity.stakingBonus * 100).toFixed(0)}% staking bonus)`);
    });
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  const generator = new AutomatedNFTGenerator();

  try {
    switch (command) {
      case 'single':
        if (args.length < 4) {
          console.log('Usage: node nft-generator.js single <recipient> <template> <location> <rarity> [imagePath] [baseValue]');
          console.log('Example: node nft-generator.js single 0x123... residential.villa lagos rare ./villa.jpg 1000000');
          return;
        }

        const [recipient, template, location, rarity, imagePath, baseValue] = args;

        const singleResult = await generator.generateSingleNFT({
          recipient,
          template,
          location,
          rarity,
          imagePath,
          baseValue: baseValue ? parseInt(baseValue) : undefined
        });

        console.log('\n🎉 NFT Generated:', singleResult);
        break;

      case 'batch':
        if (args.length < 5) {
          console.log('Usage: node nft-generator.js batch <recipient> <count> <template> <location> <rarity> [imagePath]');
          console.log('Example: node nft-generator.js batch 0x123... 10 residential.villa lagos common ./villa.jpg');
          return;
        }

        const [batchRecipient, count, batchTemplate, batchLocation, batchRarity, batchImagePath] = args;

        const batchResult = await generator.generateBatchNFTs({
          recipient: batchRecipient,
          count: parseInt(count),
          templates: batchTemplate,
          locations: batchLocation,
          rarities: batchRarity.split(','),
          imagePaths: batchImagePath
        });

        console.log('\n🎉 Batch Generated:', batchResult.summary);
        break;

      case 'collection':
        if (args.length < 1) {
          console.log('Usage: node nft-generator.js collection <configFile>');
          console.log('Example: node nft-generator.js collection ./collection-config.json');
          return;
        }

        const configFile = args[0];
        const collectionConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));

        const collectionResult = await generator.generateCollection(collectionConfig);
        console.log('\n🎉 Collection Generated:', collectionResult.summary);
        break;

      case 'templates':
        generator.listTemplates();
        break;

      case 'locations':
        generator.listLocations();
        break;

      case 'rarities':
        generator.listRarities();
        break;

      case 'preview':
        if (args.length < 3) {
          console.log('Usage: node nft-generator.js preview <template> <location> <rarity>');
          return;
        }

        const [previewTemplate, previewLocation, previewRarity] = args;
        const metadata = NFTTemplateEngine.generateMetadata(previewTemplate, previewLocation, previewRarity, { tokenId: 'PREVIEW' });

        console.log('\n🔍 NFT Preview:');
        console.log(JSON.stringify(metadata, null, 2));
        break;

      default:
        console.log(`
🎨 LandKrypt NFT Generator

Usage: node nft-generator.js <command> [args]

Commands:
  single <recipient> <template> <location> <rarity> [imagePath] [baseValue]
    Generate a single NFT

  batch <recipient> <count> <template> <location> <rarity> [imagePath]
    Generate multiple NFTs with the same configuration

  collection <configFile>
    Generate a collection from a JSON configuration file

  preview <template> <location> <rarity>
    Preview metadata for an NFT configuration

  templates
    List available NFT templates

  locations
    List available locations

  rarities
    List available rarity levels

Examples:
  node nft-generator.js single 0x123... residential.villa lagos rare
  node nft-generator.js batch 0x123... 10 commercial.office abuja common,uncommon,rare
  node nft-generator.js preview residential.apartment lagos uncommon
  node nft-generator.js templates
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

module.exports = AutomatedNFTGenerator;

// Run CLI if called directly
if (require.main === module) {
  main();
}
