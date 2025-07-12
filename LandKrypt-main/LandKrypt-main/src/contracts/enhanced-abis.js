// Enhanced Contract ABIs for LandKrypt Upgrades
// This file contains ABIs for all upgraded smart contracts

export const CONTRACT_ADDRESSES = {
  // Original Contracts (Sepolia Testnet)
  REAL_ESTATE_NFT: "0x742d35Cc6634C0532925a3b8D4C9db96c4b5Da5e",
  NFT_MARKETPLACE: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
  LAND_KRYPT_STABLE_COIN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  NFT_STAKING: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  NFT_DAO: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  
  // Upgraded Contracts (To be deployed)
  GAS_OPTIMIZED_NFT: process.env.NEXT_PUBLIC_GAS_OPTIMIZED_NFT || "0x0000000000000000000000000000000000000000",
  ENHANCED_MARKETPLACE: process.env.NEXT_PUBLIC_ENHANCED_MARKETPLACE || "0x0000000000000000000000000000000000000000",
  ADVANCED_STAKING: process.env.NEXT_PUBLIC_ADVANCED_STAKING || "0x0000000000000000000000000000000000000000",
  QUADRATIC_GOVERNANCE: process.env.NEXT_PUBLIC_QUADRATIC_GOVERNANCE || "0x0000000000000000000000000000000000000000",
  
  // Mock Contracts (For testing)
  MOCK_ERC20: process.env.NEXT_PUBLIC_MOCK_ERC20 || "0x0000000000000000000000000000000000000000",
  MOCK_NFT: process.env.NEXT_PUBLIC_MOCK_NFT || "0x0000000000000000000000000000000000000000"
};

// Gas Optimized NFT ABI
export const GAS_OPTIMIZED_NFT_ABI = [
  // ERC721 Standard Functions
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Enhanced Minting Functions
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "uri", "type": "string"},
      {"name": "propertyData", "type": "tuple", "components": [
        {"name": "price", "type": "uint64"},
        {"name": "propertyType", "type": "uint32"},
        {"name": "location", "type": "uint32"},
        {"name": "rarity", "type": "uint16"},
        {"name": "attributes", "type": "uint16"},
        {"name": "timestamp", "type": "uint64"}
      ]},
      {"name": "royaltyFee", "type": "uint96"}
    ],
    "name": "mint",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "mintData", "type": "tuple[]", "components": [
        {"name": "to", "type": "address"},
        {"name": "uri", "type": "string"},
        {"name": "propertyData", "type": "tuple", "components": [
          {"name": "price", "type": "uint64"},
          {"name": "propertyType", "type": "uint32"},
          {"name": "location", "type": "uint32"},
          {"name": "rarity", "type": "uint16"},
          {"name": "attributes", "type": "uint16"},
          {"name": "timestamp", "type": "uint64"}
        ]},
        {"name": "royaltyFee", "type": "uint96"}
      ]}
    ],
    "name": "batchMint",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Property Data Functions
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getPropertyData",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "price", "type": "uint64"},
      {"name": "propertyType", "type": "uint32"},
      {"name": "location", "type": "uint32"},
      {"name": "rarity", "type": "uint16"},
      {"name": "attributes", "type": "uint16"},
      {"name": "timestamp", "type": "uint64"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenIds", "type": "uint256[]"}],
    "name": "getBatchPropertyData",
    "outputs": [{"name": "", "type": "tuple[]", "components": [
      {"name": "price", "type": "uint64"},
      {"name": "propertyType", "type": "uint32"},
      {"name": "location", "type": "uint32"},
      {"name": "rarity", "type": "uint16"},
      {"name": "attributes", "type": "uint16"},
      {"name": "timestamp", "type": "uint64"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Batch Transfer
  {
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "tokenIds", "type": "uint256[]"}
    ],
    "name": "batchTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Royalty Functions (EIP-2981)
  {
    "inputs": [
      {"name": "tokenId", "type": "uint256"},
      {"name": "salePrice", "type": "uint256"}
    ],
    "name": "royaltyInfo",
    "outputs": [
      {"name": "receiver", "type": "address"},
      {"name": "royaltyAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "price", "type": "uint256"},
      {"indexed": false, "name": "propertyType", "type": "uint32"},
      {"indexed": false, "name": "location", "type": "uint32"},
      {"indexed": false, "name": "rarity", "type": "uint16"}
    ],
    "name": "PropertyMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "tokenIds", "type": "uint256[]"}
    ],
    "name": "BatchMinted",
    "type": "event"
  }
];

// Enhanced Marketplace ABI
export const ENHANCED_MARKETPLACE_ABI = [
  // Fixed Price Listings
  {
    "inputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "price", "type": "uint256"},
      {"name": "currency", "type": "address"},
      {"name": "duration", "type": "uint256"}
    ],
    "name": "createListing",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Dutch Auctions
  {
    "inputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "startPrice", "type": "uint256"},
      {"name": "endPrice", "type": "uint256"},
      {"name": "duration", "type": "uint256"}
    ],
    "name": "createDutchAuction",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "auctionId", "type": "uint256"}],
    "name": "getCurrentDutchPrice",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Purchase Function
  {
    "inputs": [
      {"name": "listingId", "type": "uint256"},
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "currency", "type": "address"}
    ],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  
  // Offers System
  {
    "inputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "amount", "type": "uint256"},
      {"name": "currency", "type": "address"},
      {"name": "expiry", "type": "uint256"}
    ],
    "name": "makeOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "nftContract", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "offerIndex", "type": "uint256"}
    ],
    "name": "acceptOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View Functions
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "listings",
    "outputs": [
      {"name": "price", "type": "uint128"},
      {"name": "startTime", "type": "uint64"},
      {"name": "endTime", "type": "uint64"},
      {"name": "seller", "type": "address"},
      {"name": "buyer", "type": "address"},
      {"name": "listingType", "type": "uint8"},
      {"name": "status", "type": "uint8"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "listingId", "type": "uint256"},
      {"indexed": true, "name": "nftContract", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "seller", "type": "address"},
      {"indexed": false, "name": "price", "type": "uint256"},
      {"indexed": false, "name": "listingType", "type": "uint8"}
    ],
    "name": "ListingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "auctionId", "type": "uint256"},
      {"indexed": true, "name": "nftContract", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "seller", "type": "address"},
      {"indexed": false, "name": "startPrice", "type": "uint256"},
      {"indexed": false, "name": "endPrice", "type": "uint256"}
    ],
    "name": "AuctionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "nftContract", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": true, "name": "offerer", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "expiry", "type": "uint256"}
    ],
    "name": "OfferMade",
    "type": "event"
  }
];

// Advanced Staking ABI
export const ADVANCED_STAKING_ABI = [
  // Pool Management
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "poolInfo",
    "outputs": [
      {"name": "stakingToken", "type": "address"},
      {"name": "allocPoint", "type": "uint256"},
      {"name": "lastRewardBlock", "type": "uint256"},
      {"name": "accRewardPerShare", "type": "uint256"},
      {"name": "totalStaked", "type": "uint256"},
      {"name": "minStakeAmount", "type": "uint256"},
      {"name": "lockPeriod", "type": "uint256"},
      {"name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Staking Functions
  {
    "inputs": [
      {"name": "pid", "type": "uint256"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "pid", "type": "uint256"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // NFT Staking
  {
    "inputs": [
      {"name": "poolId", "type": "uint256"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "stakeNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "poolId", "type": "uint256"},
      {"name": "tokenId", "type": "uint256"}
    ],
    "name": "unstakeNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Boosters
  {
    "inputs": [
      {"name": "pid", "type": "uint256"},
      {"name": "boosterId", "type": "uint256"}
    ],
    "name": "activateBooster",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View Functions
  {
    "inputs": [
      {"name": "pid", "type": "uint256"},
      {"name": "user", "type": "address"}
    ],
    "name": "pendingReward",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "", "type": "uint256"},
      {"name": "", "type": "address"}
    ],
    "name": "userInfo",
    "outputs": [
      {"name": "amount", "type": "uint256"},
      {"name": "rewardDebt", "type": "uint256"},
      {"name": "lockEndTime", "type": "uint256"},
      {"name": "lastStakeTime", "type": "uint256"},
      {"name": "tierMultiplier", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "pid", "type": "uint256"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": true, "name": "poolId", "type": "uint256"},
      {"indexed": false, "name": "tokenId", "type": "uint256"}
    ],
    "name": "NFTStaked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "boosterId", "type": "uint256"},
      {"indexed": false, "name": "endTime", "type": "uint256"}
    ],
    "name": "BoosterActivated",
    "type": "event"
  }
];

// Export all ABIs and addresses
export const ENHANCED_CONTRACTS = {
  addresses: CONTRACT_ADDRESSES,
  abis: {
    GAS_OPTIMIZED_NFT: GAS_OPTIMIZED_NFT_ABI,
    ENHANCED_MARKETPLACE: ENHANCED_MARKETPLACE_ABI,
    ADVANCED_STAKING: ADVANCED_STAKING_ABI
  }
};
