// NFT Configuration Templates
// Simplifies NFT creation with predefined templates and automated metadata generation

const NFT_TEMPLATES = {
  // Residential Properties
  residential: {
    villa: {
      name: "Luxury Villa #{tokenId}",
      description: "An exquisite luxury villa featuring modern amenities and premium finishes. This property represents a unique investment opportunity in the LandKrypt ecosystem.",
      category: "Residential",
      subcategory: "Villa",
      baseAttributes: [
        { trait_type: "Property Type", value: "Villa" },
        { trait_type: "Category", value: "Residential" },
        { trait_type: "Luxury Level", value: "Premium" },
        { trait_type: "Investment Grade", value: "A+" }
      ],
      defaultImage: "villa-default.jpg",
      priceRange: { min: 500000, max: 2000000 },
      stakingMultiplier: 1.5
    },
    apartment: {
      name: "Modern Apartment #{tokenId}",
      description: "A contemporary apartment in a prime location, offering comfort and convenience for modern living. Perfect for both residential use and rental investment.",
      category: "Residential",
      subcategory: "Apartment",
      baseAttributes: [
        { trait_type: "Property Type", value: "Apartment" },
        { trait_type: "Category", value: "Residential" },
        { trait_type: "Luxury Level", value: "Standard" },
        { trait_type: "Investment Grade", value: "A" }
      ],
      defaultImage: "apartment-default.jpg",
      priceRange: { min: 200000, max: 800000 },
      stakingMultiplier: 1.2
    },
    townhouse: {
      name: "Executive Townhouse #{tokenId}",
      description: "A spacious townhouse designed for executive living, combining privacy with community amenities. Ideal for families and professionals.",
      category: "Residential",
      subcategory: "Townhouse",
      baseAttributes: [
        { trait_type: "Property Type", value: "Townhouse" },
        { trait_type: "Category", value: "Residential" },
        { trait_type: "Luxury Level", value: "Executive" },
        { trait_type: "Investment Grade", value: "A" }
      ],
      defaultImage: "townhouse-default.jpg",
      priceRange: { min: 300000, max: 1200000 },
      stakingMultiplier: 1.3
    }
  },

  // Commercial Properties
  commercial: {
    office: {
      name: "Commercial Office #{tokenId}",
      description: "A premium office space in a strategic business location, designed for modern enterprises and offering excellent rental yields.",
      category: "Commercial",
      subcategory: "Office",
      baseAttributes: [
        { trait_type: "Property Type", value: "Office" },
        { trait_type: "Category", value: "Commercial" },
        { trait_type: "Business Grade", value: "Class A" },
        { trait_type: "Investment Grade", value: "A+" }
      ],
      defaultImage: "office-default.jpg",
      priceRange: { min: 800000, max: 5000000 },
      stakingMultiplier: 1.8
    },
    retail: {
      name: "Retail Space #{tokenId}",
      description: "A prime retail location with high foot traffic and excellent visibility. Perfect for businesses looking to establish a strong market presence.",
      category: "Commercial",
      subcategory: "Retail",
      baseAttributes: [
        { trait_type: "Property Type", value: "Retail" },
        { trait_type: "Category", value: "Commercial" },
        { trait_type: "Traffic Level", value: "High" },
        { trait_type: "Investment Grade", value: "A" }
      ],
      defaultImage: "retail-default.jpg",
      priceRange: { min: 400000, max: 2500000 },
      stakingMultiplier: 1.6
    },
    warehouse: {
      name: "Industrial Warehouse #{tokenId}",
      description: "A modern warehouse facility with excellent logistics access, suitable for distribution, manufacturing, and storage operations.",
      category: "Commercial",
      subcategory: "Industrial",
      baseAttributes: [
        { trait_type: "Property Type", value: "Warehouse" },
        { trait_type: "Category", value: "Industrial" },
        { trait_type: "Logistics Grade", value: "Premium" },
        { trait_type: "Investment Grade", value: "B+" }
      ],
      defaultImage: "warehouse-default.jpg",
      priceRange: { min: 1000000, max: 8000000 },
      stakingMultiplier: 1.4
    }
  },

  // Land Properties
  land: {
    residential_plot: {
      name: "Residential Land Plot #{tokenId}",
      description: "A prime residential land plot ready for development. Located in a growing area with excellent infrastructure and future appreciation potential.",
      category: "Land",
      subcategory: "Residential Plot",
      baseAttributes: [
        { trait_type: "Property Type", value: "Land" },
        { trait_type: "Category", value: "Residential Development" },
        { trait_type: "Development Status", value: "Ready" },
        { trait_type: "Investment Grade", value: "B+" }
      ],
      defaultImage: "land-residential-default.jpg",
      priceRange: { min: 100000, max: 1000000 },
      stakingMultiplier: 1.1
    },
    commercial_plot: {
      name: "Commercial Land Plot #{tokenId}",
      description: "A strategically located commercial land plot with high development potential. Perfect for retail, office, or mixed-use development projects.",
      category: "Land",
      subcategory: "Commercial Plot",
      baseAttributes: [
        { trait_type: "Property Type", value: "Land" },
        { trait_type: "Category", value: "Commercial Development" },
        { trait_type: "Development Status", value: "Ready" },
        { trait_type: "Investment Grade", value: "A-" }
      ],
      defaultImage: "land-commercial-default.jpg",
      priceRange: { min: 500000, max: 5000000 },
      stakingMultiplier: 1.3
    },
    agricultural: {
      name: "Agricultural Land #{tokenId}",
      description: "Fertile agricultural land suitable for farming, livestock, or agribusiness ventures. Offers sustainable investment opportunities in the agricultural sector.",
      category: "Land",
      subcategory: "Agricultural",
      baseAttributes: [
        { trait_type: "Property Type", value: "Agricultural Land" },
        { trait_type: "Category", value: "Agriculture" },
        { trait_type: "Soil Quality", value: "Premium" },
        { trait_type: "Investment Grade", value: "B" }
      ],
      defaultImage: "land-agricultural-default.jpg",
      priceRange: { min: 50000, max: 500000 },
      stakingMultiplier: 1.0
    }
  }
};

// Location-based modifiers
const LOCATION_MODIFIERS = {
  lagos: {
    name: "Lagos",
    country: "Nigeria",
    priceMultiplier: 1.5,
    stakingBonus: 0.2,
    attributes: [
      { trait_type: "Location", value: "Lagos" },
      { trait_type: "Country", value: "Nigeria" },
      { trait_type: "Market Tier", value: "Tier 1" }
    ]
  },
  abuja: {
    name: "Abuja",
    country: "Nigeria",
    priceMultiplier: 1.3,
    stakingBonus: 0.15,
    attributes: [
      { trait_type: "Location", value: "Abuja" },
      { trait_type: "Country", value: "Nigeria" },
      { trait_type: "Market Tier", value: "Tier 1" }
    ]
  },
  kano: {
    name: "Kano",
    country: "Nigeria",
    priceMultiplier: 0.8,
    stakingBonus: 0.1,
    attributes: [
      { trait_type: "Location", value: "Kano" },
      { trait_type: "Country", value: "Nigeria" },
      { trait_type: "Market Tier", value: "Tier 2" }
    ]
  },
  port_harcourt: {
    name: "Port Harcourt",
    country: "Nigeria",
    priceMultiplier: 1.1,
    stakingBonus: 0.12,
    attributes: [
      { trait_type: "Location", value: "Port Harcourt" },
      { trait_type: "Country", value: "Nigeria" },
      { trait_type: "Market Tier", value: "Tier 2" }
    ]
  }
};

// Rarity and special features
const RARITY_FEATURES = {
  common: {
    rarity: "Common",
    stakingBonus: 0,
    attributes: [
      { trait_type: "Rarity", value: "Common" }
    ]
  },
  uncommon: {
    rarity: "Uncommon",
    stakingBonus: 0.1,
    attributes: [
      { trait_type: "Rarity", value: "Uncommon" },
      { trait_type: "Special Feature", value: "Enhanced Amenities" }
    ]
  },
  rare: {
    rarity: "Rare",
    stakingBonus: 0.25,
    attributes: [
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Special Feature", value: "Premium Location" },
      { trait_type: "Exclusive Access", value: "VIP Services" }
    ]
  },
  epic: {
    rarity: "Epic",
    stakingBonus: 0.5,
    attributes: [
      { trait_type: "Rarity", value: "Epic" },
      { trait_type: "Special Feature", value: "Landmark Property" },
      { trait_type: "Exclusive Access", value: "Elite Services" },
      { trait_type: "Historical Significance", value: "Heritage Site" }
    ]
  },
  legendary: {
    rarity: "Legendary",
    stakingBonus: 1.0,
    attributes: [
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Special Feature", value: "Iconic Property" },
      { trait_type: "Exclusive Access", value: "Ultra-Elite Services" },
      { trait_type: "Historical Significance", value: "National Monument" },
      { trait_type: "Investment Status", value: "Blue Chip" }
    ]
  }
};

// Utility functions for NFT generation
class NFTTemplateEngine {
  static generateMetadata(templateKey, locationKey, rarityKey, customData = {}) {
    const [category, type] = templateKey.split('.');
    const template = NFT_TEMPLATES[category]?.[type];
    const location = LOCATION_MODIFIERS[locationKey];
    const rarity = RARITY_FEATURES[rarityKey];

    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    if (!location) {
      throw new Error(`Location not found: ${locationKey}`);
    }

    if (!rarity) {
      throw new Error(`Rarity not found: ${rarityKey}`);
    }

    // Generate base metadata
    const metadata = {
      name: template.name.replace('#{tokenId}', customData.tokenId || 'TBD'),
      description: template.description,
      category: template.category,
      subcategory: template.subcategory,
      attributes: [
        ...template.baseAttributes,
        ...location.attributes,
        ...rarity.attributes,
        { trait_type: "Generation", value: "LandKrypt Gen 1" },
        { trait_type: "Minted Date", value: new Date().toISOString().split('T')[0] }
      ],
      properties: {
        template: templateKey,
        location: locationKey,
        rarity: rarityKey,
        stakingMultiplier: this.calculateStakingMultiplier(template, location, rarity),
        estimatedValue: this.calculateEstimatedValue(template, location, rarity, customData),
        defaultImage: template.defaultImage
      }
    };

    // Add custom attributes
    if (customData.attributes) {
      metadata.attributes.push(...customData.attributes);
    }

    // Add custom properties
    if (customData.properties) {
      Object.assign(metadata.properties, customData.properties);
    }

    return metadata;
  }

  static calculateStakingMultiplier(template, location, rarity) {
    return template.stakingMultiplier * (1 + location.stakingBonus + rarity.stakingBonus);
  }

  static calculateEstimatedValue(template, location, rarity, customData) {
    const baseValue = customData.baseValue || 
      (template.priceRange.min + template.priceRange.max) / 2;
    
    return Math.round(baseValue * location.priceMultiplier * (1 + rarity.stakingBonus));
  }

  static getAvailableTemplates() {
    const templates = [];
    
    for (const [category, types] of Object.entries(NFT_TEMPLATES)) {
      for (const [type, template] of Object.entries(types)) {
        templates.push({
          key: `${category}.${type}`,
          name: template.name.replace(' #{tokenId}', ''),
          category: template.category,
          subcategory: template.subcategory,
          priceRange: template.priceRange,
          stakingMultiplier: template.stakingMultiplier
        });
      }
    }
    
    return templates;
  }

  static getAvailableLocations() {
    return Object.entries(LOCATION_MODIFIERS).map(([key, location]) => ({
      key,
      name: location.name,
      country: location.country,
      priceMultiplier: location.priceMultiplier,
      stakingBonus: location.stakingBonus
    }));
  }

  static getAvailableRarities() {
    return Object.entries(RARITY_FEATURES).map(([key, rarity]) => ({
      key,
      rarity: rarity.rarity,
      stakingBonus: rarity.stakingBonus
    }));
  }

  static validateTemplate(templateKey) {
    const [category, type] = templateKey.split('.');
    return NFT_TEMPLATES[category]?.[type] !== undefined;
  }

  static validateLocation(locationKey) {
    return LOCATION_MODIFIERS[locationKey] !== undefined;
  }

  static validateRarity(rarityKey) {
    return RARITY_FEATURES[rarityKey] !== undefined;
  }
}

module.exports = {
  NFT_TEMPLATES,
  LOCATION_MODIFIERS,
  RARITY_FEATURES,
  NFTTemplateEngine
};
