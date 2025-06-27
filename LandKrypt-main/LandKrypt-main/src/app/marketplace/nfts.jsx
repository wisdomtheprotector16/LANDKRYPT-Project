// nft.js
export const nftProperties = [
  {
    id: 1,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "200,000 LKRYPT",
    usdPrice: "$45,000",
    shares: "22 Shares",
    totalShares: 1000,
    availableShares: 780,
    currentStakers: 22,
    apy: "24.5%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft1.jpg",
    images: [
      "/nfts/nft1.jpg",
      "/nfts/nft1-2.jpg",
      "/nfts/nft1-3.jpg",
      "/nfts/nft1-4.jpg"
    ],
    video: "/nfts/video1.mp4",
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "An exclusive luxury villa situated in the prestigious Banana Island, Lagos. This premium waterfront property offers unparalleled views of the Lagos lagoon and represents the pinnacle of luxury living in Nigeria's most coveted residential area.",
    features: [
      "Waterfront Location",
      "5 Bedrooms",
      "6 Bathrooms", 
      "Swimming Pool",
      "Private Dock",
      "24/7 Security",
      "Garden & Landscaping",
      "Smart Home Features"
    ],
    specifications: {
      landSize: "2,500 sqm",
      buildingSize: "800 sqm",
      yearBuilt: "2021",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    },
    stakingHistory: [
      { date: "2024-06-01", amount: "50,000", staker: "0x1234...5678" },
      { date: "2024-05-28", amount: "75,000", staker: "0x8765...4321" },
      { date: "2024-05-25", amount: "25,000", staker: "0x9999...1111" }
    ],
    analytics: {
      totalStaked: "2,450,000",
      stakingGrowth: "+15.2%",
      averageStake: "111,364",
      topStaker: "245,000"
    }
  },
  {
    id: 2,
    title: "Commercial Plot In Victoria Island",
    location: "Victoria Island, Lagos, Nigeria",
    price: "150,000 LKRYPT",
    usdPrice: "$35,000",
    shares: "18 Shares",
    totalShares: 800,
    availableShares: 620,
    currentStakers: 18,
    apy: "22.3%",
    verified: true,
    rarity: "Rare",
    image: "/nfts/nft2.jpg",
    images: [
      "/nfts/nft2.jpg",
      "/nfts/nft2-2.jpg",
      "/nfts/nft2-3.jpg"
    ],
    tag: "COMMERCIAL",
    category: "commercial",
    staking: true,
    description: "Prime commercial plot located in the heart of Victoria Island's business district. Ideal for corporate headquarters, retail developments, or mixed-use projects in Lagos' most dynamic commercial hub.",
    features: [
      "Prime Location",
      "100% Road Access",
      "Drainage System",
      "24/7 Security",
      "High Visibility",
      "Zoned for Commercial Use"
    ],
    specifications: {
      landSize: "1,800 sqm",
      buildingSize: "0 sqm",
      yearBuilt: "N/A",
      propertyType: "Commercial Land",
      ownership: "Freehold",
      zoning: "Commercial"
    }
  },
  {
    id: 3,
    title: "Residential Development Land",
    location: "Lekki, Lagos, Nigeria",
    price: "300,000 LKRYPT",
    usdPrice: "$68,000",
    shares: "35 Shares",
    totalShares: 1200,
    availableShares: 950,
    currentStakers: 35,
    apy: "26.8%",
    verified: true,
    rarity: "Epic",
    image: "/nfts/nft3.jpg",
    images: [
      "/nfts/nft3.jpg",
      "/nfts/nft3-2.jpg",
      "/nfts/nft3-3.jpg"
    ],
    tag: "RESIDENTIAL",
    category: "residential",
    staking: true,
    description: "Premium residential development land in Lekki Phase 1, with excellent potential for high-end residential development. The plot is fully serviced and ready for construction.",
    features: [
      "Prime Location",
      "Fully Serviced Plot",
      "Gated Community",
      "24/7 Security",
      "Excellent Road Network",
      "Drainage System"
    ],
    specifications: {
      landSize: "3,000 sqm",
      buildingSize: "0 sqm",
      yearBuilt: "N/A",
      propertyType: "Residential Land",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  // Continue with the rest of your properties...
  {
    id: 4,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "250,000 LKRYPT",
    usdPrice: "$56,000",
    shares: "28 Shares",
    totalShares: 1100,
    availableShares: 850,
    currentStakers: 28,
    apy: "25.1%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft4.jpg",
    images: [
      "/nfts/nft4.jpg",
      "/nfts/nft4-2.jpg",
      "/nfts/nft4-3.jpg"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Another exquisite luxury villa in Banana Island featuring contemporary architecture and premium finishes throughout. This property boasts a private cinema and wine cellar.",
    features: [
      "Waterfront Location",
      "6 Bedrooms",
      "7 Bathrooms",
      "Home Theater",
      "Wine Cellar",
      "Smart Home System",
      "Private Gym"
    ],
    specifications: {
      landSize: "2,800 sqm",
      buildingSize: "950 sqm",
      yearBuilt: "2022",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  // Add remaining properties (5-9) following the same pattern
  {
    id: 5,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "180,000 LKRYPT",
    usdPrice: "$40,000",
    shares: "25 Shares",
    totalShares: 900,
    availableShares: 700,
    currentStakers: 25,
    apy: "23.7%",
    verified: true,
    rarity: "Epic",
    image: "/nfts/nft5.jpg",
    images: [
      "/nfts/nft5.jpg",
      "/nfts/nft5-2.jpg"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Charming luxury villa with traditional architectural elements combined with modern amenities. Features a lush tropical garden and outdoor entertainment area.",
    features: [
      "4 Bedrooms",
      "5 Bathrooms",
      "Tropical Garden",
      "Outdoor Kitchen",
      "Gazebo",
      "Solar Power System"
    ],
    specifications: {
      landSize: "2,200 sqm",
      buildingSize: "750 sqm",
      yearBuilt: "2020",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  {
    id: 6,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "320,000 LKRYPT",
    usdPrice: "$72,000",
    shares: "42 Shares",
    totalShares: 1500,
    availableShares: 1200,
    currentStakers: 42,
    apy: "27.5%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft6.jpg",
    images: [
      "/nfts/nft6.jpg",
      "/nfts/nft6-2.jpg",
      "/nfts/nft6-3.jpg",
      "/nfts/nft6-4.jpg"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Ultra-modern smart villa with cutting-edge technology and eco-friendly features. Includes a rooftop terrace with panoramic views of Lagos.",
    features: [
      "Smart Home Automation",
      "Rooftop Terrace",
      "Home Office",
      "EV Charging Station",
      "Rainwater Harvesting",
      "Solar Panels"
    ],
    specifications: {
      landSize: "3,200 sqm",
      buildingSize: "1,100 sqm",
      yearBuilt: "2023",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  {
    id: 7,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "320,000 LKRYPT",
    usdPrice: "$72,000",
    shares: "42 Shares",
    totalShares: 1500,
    availableShares: 1200,
    currentStakers: 42,
    apy: "27.5%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft7.png",
    images: [
      "/nfts/nft7.png",
      "/nfts/nft7-2.png"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Minimalist luxury villa with Japanese-inspired design elements. Features a zen garden and indoor-outdoor living spaces.",
    features: [
      "Minimalist Design",
      "Zen Garden",
      "Indoor Water Feature",
      "Tatami Room",
      "Japanese Soaking Tub",
      "Open Floor Plan"
    ],
    specifications: {
      landSize: "2,700 sqm",
      buildingSize: "900 sqm",
      yearBuilt: "2021",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  {
    id: 8,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "320,000 LKRYPT",
    usdPrice: "$72,000",
    shares: "42 Shares",
    totalShares: 1500,
    availableShares: 1200,
    currentStakers: 42,
    apy: "27.5%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft8.png",
    images: [
      "/nfts/nft8.png",
      "/nfts/nft8-2.png"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Mediterranean-style villa with whitewashed walls, arched doorways, and a central courtyard. Perfect for entertaining with multiple outdoor living areas.",
    features: [
      "Mediterranean Architecture",
      "Central Courtyard",
      "Outdoor Dining Pavilion",
      "Guest House",
      "Fountain",
      "Olive Trees"
    ],
    specifications: {
      landSize: "3,500 sqm",
      buildingSize: "1,200 sqm",
      yearBuilt: "2020",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  },
  {
    id: 9,
    title: "Luxury Villa In Banana Island",
    location: "Banana Island, Lagos, Nigeria",
    price: "320,000 LKRYPT",
    usdPrice: "$72,000",
    shares: "42 Shares",
    totalShares: 1500,
    availableShares: 1200,
    currentStakers: 42,
    apy: "27.5%",
    verified: true,
    rarity: "Legendary",
    image: "/nfts/nft9.png",
    images: [
      "/nfts/nft9.png",
      "/nfts/nft9-2.png"
    ],
    tag: "LUXURY VILLA",
    category: "residential",
    staking: true,
    description: "Contemporary art-inspired villa featuring bold architectural lines and curated art installations throughout the property. Includes a private art gallery space.",
    features: [
      "Curated Art Collection",
      "Private Gallery",
      "Sculpture Garden",
      "Infinity Pool",
      "Glass Bridge",
      "Rooftop Deck"
    ],
    specifications: {
      landSize: "3,000 sqm",
      buildingSize: "1,000 sqm",
      yearBuilt: "2022",
      propertyType: "Residential Villa",
      ownership: "Freehold",
      zoning: "Residential"
    }
  }
];

// Export for use in components
// export default nftProperties;