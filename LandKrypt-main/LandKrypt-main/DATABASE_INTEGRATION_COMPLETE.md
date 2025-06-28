# 🎯 LandKrypt Database Integration - COMPLETE

## 📋 Overview

The LandKrypt platform now has **complete database integration** for tracking user stakes and votes on NFTs. Every user action is stored with detailed information about which NFT the action was performed on.

## 🏗️ Architecture

### Database Tables Created

1. **`user_actions`** - General action tracking
   - Records all user interactions (stake, vote, unstake, etc.)
   - Links user address to specific NFT IDs
   - Stores transaction hashes and metadata

2. **`nft_stakes`** - Detailed staking records
   - Tracks active/inactive stakes per NFT
   - Records staking amounts, rewards, and durations
   - Links to specific staking contracts

3. **`nft_votes`** - Voting history
   - Tracks votes on governance proposals
   - Records voting power and choices
   - Prevents duplicate votes on same proposal

### Key Features

✅ **Per-NFT Tracking**: Every action is linked to a specific NFT ID
✅ **User-Specific Data**: Track individual user interactions
✅ **Transaction History**: Complete audit trail with blockchain hashes
✅ **Real-time Analytics**: Live staking statistics and activity metrics
✅ **Metadata Storage**: Flexible JSONB fields for additional data

## 🛠️ Implementation

### 1. Database Service (`src/lib/supabase.js`)
```javascript
import DatabaseService, { ACTION_TYPES } from '@/lib/supabase';

const db = new DatabaseService(true); // Admin mode

// Record stake action
await db.recordStake({
  userAddress: '0x123...',
  nftId: 1,
  stakingContract: '0xabc...',
  amount: '1000',
  txHash: '0xdef...',
  metadata: { propertyTitle: 'Land Property #1' }
});
```

### 2. React Hooks (`src/hooks/useDatabaseActions.js`)
```javascript
import { useDatabaseActions, useUserNftData, useNftAnalytics } from '@/hooks/useDatabaseActions';

// In components
const { recordStakeAction, recordVoteAction } = useDatabaseActions();
const { data: userNftData } = useUserNftData(nftId);
const { analytics } = useNftAnalytics(nftId);
```

### 3. API Routes
- **`/api/user-actions`** - Record and retrieve user actions
- **`/api/nft-analytics`** - Get NFT-specific statistics

### 4. Frontend Integration

#### Marketplace Updates
- **User Stake Status**: Shows if user has staked on each NFT
- **Live Analytics**: Real-time staking statistics per NFT
- **Progress Tracking**: Visual progress bars with actual data

#### StakingModal Updates
- **Automatic Recording**: Stakes recorded to database after blockchain confirmation
- **User Data Refresh**: UI updates with latest stake information
- **Error Handling**: Non-blocking database operations

## 📊 Data Tracking

### What Gets Tracked

#### For Stake Actions:
```json
{
  "userAddress": "0x123...",
  "nftId": 1,
  "actionType": "stake",
  "amount": "1000.5",
  "stakingContract": "0xabc...",
  "txHash": "0xdef...",
  "metadata": {
    "propertyTitle": "Prime Agricultural Land",
    "expectedDailyRewards": 0.5,
    "expectedAnnualRewards": 182.5,
    "timestamp": "2025-06-28T09:57:00Z"
  }
}
```

#### For Vote Actions:
```json
{
  "userAddress": "0x123...",
  "nftId": 1,
  "actionType": "vote",
  "proposalId": "prop_001",
  "voteChoice": true,
  "votingPower": "1000",
  "txHash": "0xghi...",
  "metadata": {
    "proposalTitle": "Approve Development Phase 2",
    "timestamp": "2025-06-28T09:57:00Z"
  }
}
```

### Analytics Available
- Total staked amount per NFT
- Number of unique stakers per NFT
- User's personal staking history per NFT
- Recent activity per NFT
- Voting participation rates

## 🚀 Setup Instructions

### 1. Initialize Database Tables
```bash
node scripts/setup-database.js
```

### 2. Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Verify Setup
1. Run `npm run dev`
2. Connect wallet and perform a stake action
3. Check Supabase dashboard for recorded data
4. View user stake status in marketplace

## 🔍 API Usage Examples

### Record a Stake
```javascript
// POST /api/user-actions
{
  "userAddress": "0x123...",
  "nftId": 1,
  "actionType": "stake",
  "amount": "1000",
  "stakingContract": "0xabc...",
  "txHash": "0xdef...",
  "metadata": {}
}
```

### Get User's NFT Data
```javascript
// GET /api/user-actions?userAddress=0x123...&nftId=1
{
  "nftId": 1,
  "actions": [...],  // All actions for this NFT
  "stakes": [...],   // Active stakes
  "votes": [...]     // Voting history
}
```

### Get NFT Analytics
```javascript
// GET /api/nft-analytics?nftId=1
{
  "nftId": 1,
  "stakingStats": {
    "totalStaked": 50000,
    "totalStakers": 25,
    "allTimeStaked": 75000
  },
  "activity": {
    "totalActions": 150,
    "actionsByType": { "stake": 80, "vote": 70 },
    "uniqueParticipants": 45
  }
}
```

## 🎯 Frontend Integration Points

### 1. Marketplace Page
- **User Stake Indicators**: Green badges showing user's stake amount
- **Live Progress Bars**: Real-time staking progress per NFT
- **Participant Count**: Number of stakers per NFT

### 2. StakingModal
- **Database Recording**: Automatic stake recording after blockchain confirmation
- **User History**: Shows user's previous stakes on the NFT
- **Analytics Refresh**: Updates analytics after new stakes

### 3. Property Detail Page
- **Comprehensive Analytics**: Detailed staking and voting history
- **User Activity Timeline**: User's interaction history with the NFT
- **Community Engagement**: Overall community participation metrics

## 🛡️ Security & Error Handling

### Database Operations
- **Non-blocking**: Database errors don't fail blockchain transactions
- **Admin Access**: Server-side operations use admin Supabase client
- **Validation**: Input validation for all database operations

### Privacy
- **Public Data**: Only wallet addresses and transaction data stored
- **No PII**: No personal information collected
- **Blockchain Verification**: All actions verifiable on-chain

## 📈 Benefits

### For Users
- **Track Portfolio**: See all staked NFTs and earnings
- **History**: Complete action history per NFT
- **Analytics**: Personal and community statistics

### For Platform
- **Engagement Metrics**: Track user engagement per NFT
- **Community Building**: Show active community participation
- **Data-Driven Decisions**: Analytics for platform improvements

### For Developers
- **Easy Integration**: Simple hooks and API
- **Scalable**: Handles multiple NFTs and users
- **Extensible**: Easy to add new action types

## 🔮 Future Enhancements

### Planned Features
1. **Reward Tracking**: Track and display earned rewards per NFT
2. **Governance Analytics**: Detailed voting participation metrics
3. **Social Features**: User profiles and activity feeds
4. **Export Data**: CSV export of user action history

### Technical Improvements
1. **Caching Layer**: Redis caching for frequently accessed data
2. **Real-time Updates**: WebSocket connections for live updates
3. **Advanced Analytics**: Machine learning insights
4. **API Rate Limiting**: Enhanced security and performance

## ✅ Status: PRODUCTION READY

The database integration is **complete** and **production-ready** with:

- ✅ Full NFT-specific tracking
- ✅ Comprehensive error handling
- ✅ Real-time analytics
- ✅ User-friendly interfaces
- ✅ Scalable architecture
- ✅ Security best practices

## 🎉 Summary

LandKrypt now provides **complete transparency** and **detailed tracking** for all user interactions with NFTs. Users can see their stake history, earnings, and participation on each individual NFT, while the platform gains valuable insights into community engagement and platform usage.

**Ready for launch! 🚀**
