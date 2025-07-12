# LandKrypt API Documentation

Comprehensive API documentation for the LandKrypt real estate NFT platform.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://landkrypt.com/api`

## Authentication

Most endpoints require wallet-based authentication using signed messages.

### Authentication Flow

1. **Get Nonce**: Request a nonce for signing
2. **Sign Message**: Sign the nonce with your wallet
3. **Verify Signature**: Submit signature for verification
4. **Use Token**: Include JWT token in subsequent requests

```javascript
// Example authentication flow
const nonce = await fetch('/api/auth/nonce').then(r => r.json());
const signature = await wallet.signMessage(nonce.message);
const auth = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ signature, address: wallet.address })
});
const { token } = await auth.json();

// Use token in subsequent requests
const response = await fetch('/api/protected-endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## NFT Management

### Generate NFT

Generate a new NFT using predefined templates.

**Endpoint**: `POST /api/nft/generate`

**Authentication**: Required

**Request Body**:
```json
{
  "recipient": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
  "template": "residential.villa",
  "location": "lagos",
  "rarity": "rare",
  "customAttributes": {
    "bedrooms": 4,
    "bathrooms": 3,
    "squareFeet": 2500
  }
}
```

**Response**:
```json
{
  "success": true,
  "nft": {
    "token_id": 12345,
    "owner_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "metadata": {
      "name": "Lagos Villa #12345",
      "description": "A luxurious villa in Lagos",
      "image": "QmHash123...",
      "attributes": [
        {
          "trait_type": "Property Type",
          "value": "Villa"
        },
        {
          "trait_type": "Location",
          "value": "Lagos"
        },
        {
          "trait_type": "Rarity",
          "value": "Rare"
        }
      ]
    },
    "estimated_value": 2500000,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get NFT Details

Retrieve detailed information about a specific NFT.

**Endpoint**: `GET /api/nft/{tokenId}`

**Parameters**:
- `tokenId` (path): The NFT token ID

**Response**:
```json
{
  "success": true,
  "nft": {
    "token_id": 12345,
    "owner_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "metadata": { /* NFT metadata */ },
    "is_listed": false,
    "current_price": null,
    "estimated_value": 2500000,
    "staking_info": {
      "is_staked": false,
      "staking_contract": null,
      "staking_rewards": 0
    },
    "transaction_history": [
      {
        "type": "mint",
        "from": null,
        "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
        "transaction_hash": "0xabc123...",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### List User NFTs

Get all NFTs owned by a specific address.

**Endpoint**: `GET /api/nft/user/{address}`

**Parameters**:
- `address` (path): Wallet address
- `page` (query): Page number (default: 1)
- `limit` (query): Items per page (default: 20, max: 100)
- `filter` (query): Filter by property type, location, or rarity

**Response**:
```json
{
  "success": true,
  "nfts": [
    { /* NFT object */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "stats": {
    "totalValue": 15000000,
    "totalNFTs": 45,
    "listedNFTs": 3,
    "stakedNFTs": 12
  }
}
```

## Marketplace

### Create Listing

List an NFT for sale on the marketplace.

**Endpoint**: `POST /api/marketplace/list`

**Authentication**: Required

**Request Body**:
```json
{
  "tokenId": 12345,
  "price": "2500000",
  "currency": "LKUSD",
  "duration": 30
}
```

**Response**:
```json
{
  "success": true,
  "listing": {
    "id": "listing-123",
    "token_id": 12345,
    "seller_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "price": "2500000",
    "currency": "LKUSD",
    "status": "active",
    "expires_at": "2024-02-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Marketplace Listings

Retrieve marketplace listings with filtering and pagination.

**Endpoint**: `GET /api/marketplace/listings`

**Parameters**:
- `page` (query): Page number
- `limit` (query): Items per page
- `minPrice` (query): Minimum price filter
- `maxPrice` (query): Maximum price filter
- `location` (query): Location filter
- `propertyType` (query): Property type filter
- `rarity` (query): Rarity filter
- `sortBy` (query): Sort field (price, created_at, rarity)
- `sortOrder` (query): Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "listings": [
    {
      "id": "listing-123",
      "nft": { /* NFT details */ },
      "price": "2500000",
      "currency": "LKUSD",
      "seller_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { /* pagination info */ },
  "filters": {
    "priceRange": { "min": 100000, "max": 50000000 },
    "locations": ["Lagos", "Abuja", "Port Harcourt"],
    "propertyTypes": ["Villa", "Apartment", "Office"],
    "rarities": ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
  }
}
```

### Purchase NFT

Purchase an NFT from the marketplace.

**Endpoint**: `POST /api/marketplace/purchase`

**Authentication**: Required

**Request Body**:
```json
{
  "listingId": "listing-123",
  "transactionHash": "0xdef456..."
}
```

**Response**:
```json
{
  "success": true,
  "purchase": {
    "id": "purchase-456",
    "listing_id": "listing-123",
    "buyer_address": "0x8ba1f109551bD432803012645Hac136c9c1e3a9",
    "seller_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "price": "2500000",
    "currency": "LKUSD",
    "transaction_hash": "0xdef456...",
    "marketplace_fee": "62500",
    "seller_proceeds": "2437500",
    "completed_at": "2024-01-15T11:00:00Z"
  }
}
```

## Tier System

### Get User Tier Data

Retrieve comprehensive tier information for a user.

**Endpoint**: `GET /api/tier/user/{address}`

**Parameters**:
- `address` (path): Wallet address

**Response**:
```json
{
  "success": true,
  "tierData": {
    "wallet_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "current_tier": 3,
    "total_xp": 2750,
    "tier_progress": 75,
    "last_daily_xp_claim": "2024-01-15",
    "currentTierInfo": {
      "level": 3,
      "name": "Investor",
      "description": "Active participant in the ecosystem",
      "color": "#3B82F6",
      "icon": "💼",
      "benefits": {
        "stakingMultiplier": 1.25,
        "marketplaceFeeDiscount": 10,
        "earlyAccess": true,
        "votingPower": 1.5,
        "maxNFTsPerTransaction": 5
      }
    },
    "nextTier": {
      "isMaxTier": false,
      "xpNeeded": 2250,
      "nextTier": {
        "level": 4,
        "name": "Developer",
        "benefits": { /* tier 4 benefits */ }
      }
    },
    "progress": {
      "progress": 75,
      "currentTierXP": 2000,
      "nextTierXP": 5000,
      "progressXP": 750,
      "totalXPNeeded": 3000
    }
  }
}
```

### Award XP

Award experience points to a user for completing activities.

**Endpoint**: `POST /api/tier/award-xp`

**Authentication**: Required (Admin or System)

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
  "activityKey": "nftMint",
  "amount": null,
  "metadata": {
    "tokenId": 12345,
    "template": "residential.villa"
  }
}
```

**Response**:
```json
{
  "success": true,
  "xpAwarded": 120,
  "bonusMultiplier": 1.2,
  "newTotalXP": 2870,
  "tierUpgraded": false,
  "newTier": null,
  "milestones": [],
  "activity": "NFT Minting"
}
```

### Claim Daily Reward

Claim daily XP reward.

**Endpoint**: `POST /api/tier/daily-reward`

**Authentication**: Required

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A"
}
```

**Response**:
```json
{
  "success": true,
  "xpAwarded": 15,
  "bonusMultiplier": 1.5,
  "newTotalXP": 2885,
  "dailyReward": true,
  "nextClaimTime": "2024-01-16T10:30:00Z"
}
```

### Get Leaderboard

Retrieve tier system leaderboard.

**Endpoint**: `GET /api/tier/leaderboard`

**Parameters**:
- `limit` (query): Number of entries (default: 100, max: 1000)

**Response**:
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
      "totalXP": 25000,
      "currentTier": 5,
      "tierInfo": {
        "name": "Mogul",
        "color": "#F59E0B",
        "icon": "👑"
      }
    }
  ]
}
```

## Analytics

### Get NFT Analytics

Retrieve analytics data for a specific NFT.

**Endpoint**: `GET /api/analytics/nft/{tokenId}`

**Parameters**:
- `tokenId` (path): NFT token ID
- `timeframe` (query): Time period (24h, 7d, 30d, 90d, 1y, all)

**Response**:
```json
{
  "success": true,
  "analytics": {
    "nftId": 12345,
    "stakingStats": {
      "totalStaked": 150000,
      "totalStakers": 25,
      "averageStake": 6000,
      "stakingAPY": 18.5
    },
    "priceHistory": [
      {
        "date": "2024-01-01",
        "price": 2000000,
        "volume": 1
      }
    ],
    "activity": {
      "totalTransactions": 15,
      "uniqueParticipants": 12,
      "last24Hours": 3,
      "last7Days": 8
    },
    "governance": {
      "totalProposals": 2,
      "totalVotes": 45,
      "participationRate": 0.75
    }
  }
}
```

### Get Market Analytics

Retrieve overall market analytics.

**Endpoint**: `GET /api/analytics/market`

**Parameters**:
- `timeframe` (query): Time period

**Response**:
```json
{
  "success": true,
  "analytics": {
    "overview": {
      "totalNFTs": 1247,
      "totalVolume": "125000000",
      "averagePrice": "1850000",
      "activeUsers": 892,
      "totalStaked": "45000000"
    },
    "trends": {
      "priceChange24h": 5.2,
      "volumeChange24h": 12.8,
      "newListings24h": 15,
      "salesCount24h": 8
    },
    "topCollections": [
      {
        "location": "Lagos",
        "count": 425,
        "volume": "52000000",
        "averagePrice": "2200000"
      }
    ]
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid wallet address format",
    "details": {
      "field": "address",
      "provided": "invalid-address",
      "expected": "0x prefixed 40 character hex string"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456"
}
```

### Error Types

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required or failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `CONFLICT_ERROR`: Resource conflict (e.g., duplicate)
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `BLOCKCHAIN_ERROR`: Blockchain interaction failed
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_API_ERROR`: External service error
- `INTERNAL_ERROR`: Internal server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Sensitive operations**: 10 requests per 15 minutes per IP
- **NFT minting**: 20 requests per hour per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks

LandKrypt supports webhooks for real-time notifications:

### Webhook Events

- `nft.minted`: New NFT created
- `nft.transferred`: NFT ownership changed
- `marketplace.listed`: NFT listed for sale
- `marketplace.sold`: NFT sold
- `tier.upgraded`: User tier upgraded
- `staking.deposited`: Tokens staked
- `governance.proposal_created`: New proposal created
- `governance.vote_cast`: Vote cast on proposal

### Webhook Payload

```json
{
  "event": "nft.minted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "tokenId": 12345,
    "owner": "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
    "metadata": { /* NFT metadata */ }
  }
}
```

## SDK and Libraries

### JavaScript SDK

```bash
npm install @landkrypt/sdk
```

```javascript
import { LandKryptSDK } from '@landkrypt/sdk';

const sdk = new LandKryptSDK({
  apiUrl: 'https://api.landkrypt.com',
  apiKey: 'your-api-key'
});

// Generate NFT
const nft = await sdk.nft.generate({
  recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
  template: 'residential.villa',
  location: 'lagos',
  rarity: 'rare'
});

// Get user tier data
const tierData = await sdk.tier.getUserData('0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A');
```

### Python SDK

```bash
pip install landkrypt-sdk
```

```python
from landkrypt import LandKryptSDK

sdk = LandKryptSDK(
    api_url='https://api.landkrypt.com',
    api_key='your-api-key'
)

# Generate NFT
nft = sdk.nft.generate(
    recipient='0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
    template='residential.villa',
    location='lagos',
    rarity='rare'
)
```

## Support

For API support and questions:

- **Documentation**: [https://docs.landkrypt.com](https://docs.landkrypt.com)
- **Discord**: [https://discord.gg/landkrypt](https://discord.gg/landkrypt)
- **Email**: api-support@landkrypt.com
- **GitHub Issues**: [https://github.com/landkrypt/landkrypt/issues](https://github.com/landkrypt/landkrypt/issues)
