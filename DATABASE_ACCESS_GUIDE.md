# 🔗 LANDKRYPT Database Access Guide

## 📋 Project Overview

**LANDKRYPT** is a blockchain-based real estate tokenization platform that uses **multiple database layers**:

- **🔗 Blockchain**: Ethereum Sepolia (Smart contracts & NFT data)
- **☁️ Supabase**: Cloud PostgreSQL (User actions & metadata)  
- **📁 JSON Files**: Local storage (Marketplace listings & static data)

---

## 🗄️ Database Architecture

### **1. Smart Contracts (Blockchain)**
```
Network: Ethereum Sepolia Testnet (Chain ID: 11155111)
Contract Addresses:
├── Real Estate NFT: 0x50b2F7125E5a67da6bbf8F72A6355199D5B2378c
├── NFT Marketplace: 0x74C6DE54f9B1BFDC905dC0384d1616064F92396C
├── Staking Factory: 0xDE127d9c649EC55D815eE409d2A5fFBA425cd7A7
├── DAO Contract: 0x57d1F46F7CCa5c4969C2B7FC09E3765fD86c36c7
└── Exchange: 0xe6157315A65BE8e78cef14EA2d36a18b66b5ac5d
```

### **2. Supabase Database (Cloud PostgreSQL)**
```
URL: https://kvqdbtqvttiibpyqsviq.supabase.co
Status: ✅ Active & Configured
```

**Tables:**
- `users` - Wallet addresses and user documents
- `nfts` - NFT metadata and ownership tracking
- `user_actions` - Transaction history and user activities
- `marketplace_listings` - Extended marketplace data

### **3. JSON Data Files**
```
Location: LandKrypt-main/LandKrypt-main/data/
Files:
├── marketplace-listings.json (6 records) ✅
├── nft-listings.json ❌
├── all-listings.json ❌
├── commercial-listings.json ✅
├── residential-listings.json ✅
└── digital-asset-listings.json ✅
```

---

## 🚀 Quick Access Commands

I've created a **database access utility** (`database-access.js`) for easy data management:

### **Basic Commands:**
```bash
# Test Supabase connection
node database-access.js connect

# View database statistics
node database-access.js stats

# Read JSON marketplace data
node database-access.js json marketplace-listings.json

# Get all marketplace listings (Supabase)
node database-access.js listings

# Get user transaction history
node database-access.js actions 0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC
```

### **Setup Commands:**
```bash
# Create database tables in Supabase
node database-access.js setup

# Import JSON data to Supabase
node database-access.js import
```

---

## 🔐 Database Access Methods

### **Method 1: Supabase Dashboard (Web Interface)**

1. **Access URL:** https://supabase.com/dashboard
2. **Login with:** The account that created the project
3. **Project:** kvqdbtqvttiibpyqsviq
4. **Features:**
   - SQL Editor for custom queries
   - Table Editor for data management
   - Real-time data viewing
   - API documentation

### **Method 2: Direct API Access (JavaScript)**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kvqdbtqvttiibpyqsviq.supabase.co',
  'YOUR_ANON_KEY' // From .env file
)

// Get marketplace listings
const { data, error } = await supabase
  .from('marketplace_listings')
  .select('*')
```

### **Method 3: JSON File Access**

```javascript
const fs = require('fs');
const listings = JSON.parse(
  fs.readFileSync('./LandKrypt-main/LandKrypt-main/data/marketplace-listings.json', 'utf8')
);
console.log(listings);
```

### **Method 4: Blockchain Data Access**

```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(
  'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
);

const nftContract = new ethers.Contract(
  '0x50b2F7125E5a67da6bbf8F72A6355199D5B2378c',
  NFT_ABI,
  provider
);

// Get NFT owner
const owner = await nftContract.ownerOf(1);
```

---

## 📊 Current Data Status

**Last Updated:** 2025-06-27

### **Marketplace Listings (6 Properties)**
```
Token ID | Title                          | Category     | Price         | Status
---------|--------------------------------|--------------|---------------|--------
1        | Luxury Modern Apartment Complex| residential  | 200 ETH       | Listed
2        | Executive Commercial Building  | commercial   | 200 ETH       | Listed  
3        | Waterfront Villa Estate        | residential  | 200 ETH       | Listed
4        | Urban Residential Tower        | commercial   | 200 ETH       | Listed
5        | Commercial Shopping Plaza      | residential  | 200 ETH       | Listed
6        | Luxury Resort Development      | commercial   | 200 ETH       | Listed
```

### **Staking Contracts**
Each property has its own staking contract:
- Property 1: `0x893F1a964e685919726CfF26D3804a9B1cd4d951`
- Property 2: `0x224db06A75584e9d35EcDCDd579d857Bb39760b2`
- Property 3: `0xaD544572A903F9052f86d69b1b8126484A4f86EE`
- Property 4: `0x3B3EBC45a3255923b9b624c0E5979De13B8B344d`
- Property 5: `0x42b4f6974177bc70854bb2B7eD130120638990fD`
- Property 6: `0xd2be75885f0162ae5D888757a41f0D55cf4DCcA5`

---

## 🛠️ Database Operations

### **Adding New Data**

```javascript
// Add user action to Supabase
const LandKryptDB = require('./database-access.js');
const db = new LandKryptDB();

await db.addUserAction(
  '0x1234...', // wallet address
  'stake',     // action type
  '0xabcd...' // transaction hash
);
```

### **Querying Data**

```javascript
// Get specific user's actions
const actions = await db.getUserActions('0x18A16EfC5A7fb2FC9B21894011a0b429d30f08FC');

// Get all marketplace listings
const listings = await db.getMarketplaceListings();
```

### **Updating Marketplace Data**

1. **Update JSON files** in `data/` folder
2. **Run import command**: `node database-access.js import`
3. **Verify with**: `node database-access.js stats`

---

## 🔧 Environment Configuration

**Required Environment Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kvqdbtqvttiibpyqsviq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Blockchain Configuration  
ALCHEMY_API_KEY=6H8cy5JmV9VHPvMFYaK9C
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/6H8cy5JmV9VHPvMFYaK9C

# Contract Addresses (Auto-populated)
NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS=0x50b2F7125E5a67da6bbf8F72A6355199D5B2378c
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=0x74C6DE54f9B1BFDC905dC0384d1616064F92396C
# ... (other contract addresses)
```

---

## 🔍 Troubleshooting

### **Common Issues:**

1. **Supabase Connection Failed**
   - Check your internet connection
   - Verify SUPABASE_URL and keys in .env
   - Ensure Supabase project is active

2. **JSON File Not Found**
   - Run marketplace generation: `npm run generate:marketplace`
   - Check file paths in data/ folder

3. **Blockchain Data Issues**
   - Verify Alchemy API key is valid
   - Check if contracts are deployed on Sepolia
   - Ensure wallet has testnet ETH

### **Debug Commands:**
```bash
# Check environment variables
node database-access.js

# Test individual components
node database-access.js connect
node database-access.js stats
node database-access.js json marketplace-listings.json
```

---

## 📱 Frontend Integration

The Next.js frontend connects to databases through:

1. **API Routes**: `/api/user-actions/route.js`
2. **React Hooks**: `useContractInteraction.js`
3. **State Management**: Zustand stores
4. **Blockchain**: Wagmi + RainbowKit

### **Example Frontend Usage:**

```javascript
// In a React component
import { useContractRead } from 'wagmi'

const { data: owner } = useContractRead({
  address: '0x50b2F7125E5a67da6bbf8F72A6355199D5B2378c',
  abi: NFT_ABI,
  functionName: 'ownerOf',
  args: [tokenId]
})
```

---

## 🚀 Next Steps

1. **Setup Database Tables**: `node database-access.js setup`
2. **Import Current Data**: `node database-access.js import`  
3. **Start Development Server**: `npm run dev`
4. **Access Frontend**: http://localhost:3000

---

## 📞 Support

For database-related issues:
1. Check this guide first
2. Run diagnostic commands
3. Review logs in the terminal
4. Check Supabase dashboard for errors

**Happy building! 🏗️**
