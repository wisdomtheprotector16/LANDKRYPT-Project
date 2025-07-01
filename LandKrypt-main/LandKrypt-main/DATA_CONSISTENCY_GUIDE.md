# LandKrypt Data Consistency Guide

This guide ensures complete data consistency between frontend and backend components.

## Overview

LandKrypt uses a multi-layered approach to ensure data consistency:

1. **Data Validation Layer** - Schema validation for all data types
2. **Database Integration** - Supabase database with structured tables
3. **Smart Contract Integration** - Ethereum contracts with validated ABIs
4. **Frontend Hooks** - React hooks with error handling and validation
5. **Testing Framework** - Comprehensive tests for all components

## Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Smart         │    │   Supabase      │    │   JSON Files    │
│   Contracts     │ ── │   Database      │ ── │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Contract      │    │   API Routes    │    │   React         │
│   Operations    │ ── │   (Backend)     │ ── │   Components    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Types and Validation

### 1. User Actions

**Schema**: `UserActionSchema`
**Required Fields**:
- `user_address`: Valid Ethereum address (42 chars, starts with 0x)
- `nft_id`: Positive integer
- `action_type`: One of ['stake', 'unstake', 'vote', 'purchase', 'list', 'approve']
- `tx_hash`: Valid transaction hash (66 chars, starts with 0x)
- `timestamp`: ISO 8601 date string

**Frontend Usage**:
```javascript
import { validateUserAction } from '@/utils/dataValidation';

const action = {
  user_address: '0x1234567890123456789012345678901234567890',
  nft_id: 1,
  action_type: 'stake',
  tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  amount: '1000.5',
  timestamp: new Date().toISOString()
};

try {
  const validatedAction = validateUserAction(action);
  // Use validated action
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### 2. NFT Stakes

**Schema**: `NFTStakeSchema`
**Required Fields**:
- `user_address`: Valid Ethereum address
- `nft_id`: Positive integer
- `staking_contract`: Valid contract address
- `amount`: String representation of decimal number
- `is_active`: Boolean
- `tx_hash`: Valid transaction hash

**Database Table**: `nft_stakes`
**API Endpoint**: `/api/user-actions`

### 3. Marketplace Listings

**Schema**: `MarketplaceListingSchema`
**Required Fields**:
- `id`: Unique identifier
- `tokenId`: String representation of token ID
- `title`: Property title
- `stakingContract`: Valid contract address
- `originalPrice`: String representation of price
- `type`: One of ['rwa', 'digital asset']
- `category`: One of ['residential', 'commercial', 'office space', 'luxury villa']

**JSON File**: `src/data/all-listings.json`
**Validation**:
```javascript
import { validateMarketplaceListing } from '@/utils/dataValidation';

listings.forEach(listing => {
  try {
    validateMarketplaceListing(listing);
  } catch (error) {
    console.error(`Listing ${listing.id} invalid:`, error.message);
  }
});
```

### 4. Smart Contract Data

**Contract Addresses Validation**:
```javascript
import { ContractDataValidator } from '@/utils/dataValidation';

// Validate staking contract
ContractDataValidator.validateStakingContract('0x123...abc');

// Validate token amount
ContractDataValidator.validateTokenAmount('1000.5');

// Validate token ID
ContractDataValidator.validateTokenId('1');

// Validate transaction hash
ContractDataValidator.validateTransactionHash('0x123...def');
```

## API Consistency

### User Actions API (`/api/user-actions`)

**POST Request**:
```javascript
{
  "userAddress": "0x1234567890123456789012345678901234567890",
  "nftId": 1,
  "actionType": "stake",
  "amount": "1000",
  "stakingContract": "0xabcdef1234567890123456789012345678901234",
  "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "metadata": {}
}
```

**Response**:
```javascript
{
  "message": "stake action recorded successfully",
  "data": {
    "id": 1,
    "user_address": "0x1234567890123456789012345678901234567890",
    "nft_id": 1,
    "action_type": "stake",
    "amount": "1000",
    "created_at": "2025-06-30T22:15:00Z"
  }
}
```

**GET Request**:
```
/api/user-actions?userAddress=0x123...&nftId=1
```

**Response**:
```javascript
{
  "nftId": 1,
  "actions": [...],  // Array of UserAction objects
  "stakes": [...],   // Array of NFTStake objects
  "votes": [...]     // Array of NFTVote objects
}
```

### NFT Analytics API (`/api/nft-analytics`)

**GET Request**:
```
/api/nft-analytics?nftId=1
```

**Response**:
```javascript
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
    "uniqueParticipants": 45,
    "last24Hours": 10,
    "last7Days": 45
  },
  "recentActions": [...] // Array of recent UserAction objects
}
```

## Database Schema Consistency

### Core Tables

1. **user_actions**
   - Primary key: `id`
   - Foreign relations: Links to `nft_stakes` and `nft_votes`
   - Indexes: `user_address`, `nft_id`, `action_type`

2. **nft_stakes**
   - Primary key: `id`
   - Foreign key: References `user_actions`
   - Active tracking: `is_active` boolean
   - Indexes: `user_address`, `nft_id`, `is_active`

3. **nft_votes**
   - Primary key: `id`
   - Unique constraint: `(user_address, nft_id, proposal_id)`
   - Foreign key: References `user_actions`

4. **proposals**
   - Primary key: `id`
   - Foreign relations: Links to `nft_ownership`
   - Status tracking: `status` enum

### Database Integrity Rules

1. **Referential Integrity**:
   - Every stake must have a corresponding user action
   - Every vote must have a corresponding user action
   - Every proposal must reference a valid NFT

2. **Data Consistency**:
   - User addresses must be valid Ethereum addresses
   - Transaction hashes must be unique and valid
   - Amounts must be positive numbers
   - Timestamps must be valid ISO 8601 dates

3. **Business Logic**:
   - Users cannot vote twice on the same proposal
   - Stakes can only be active or inactive
   - Proposals can only be in valid states

## Frontend Hooks Consistency

### useDatabaseActions Hook

**Purpose**: Record user actions in database
**Validation**: Automatic validation of all parameters
**Error Handling**: Graceful degradation on database errors

```javascript
import { useDatabaseActions } from '@/hooks/useDatabaseActions';

const { recordStakeAction, isLoading, error } = useDatabaseActions();

// Record stake with validation
try {
  await recordStakeAction({
    nftId: 1,
    amount: '1000',
    stakingContract: '0x123...abc',
    txHash: '0x456...def',
    metadata: { timestamp: new Date().toISOString() }
  });
} catch (error) {
  console.error('Failed to record stake:', error.message);
}
```

### useUserActiveStakes Hook

**Purpose**: Fetch user's active stakes
**Validation**: Validates returned data structure
**Fallback**: Returns empty array on errors

```javascript
import { useUserActiveStakes } from '@/hooks/useDatabaseActions';

const { stakes, isLoading, error, refetch } = useUserActiveStakes();

// stakes is guaranteed to be an array of validated NFTStake objects
stakes.forEach(stake => {
  console.log(`Stake ${stake.id}: ${stake.amount} LKUSD`);
});
```

### useNftAnalytics Hook

**Purpose**: Fetch NFT staking analytics
**Validation**: Validates analytics data structure
**Fallback**: Returns default values on errors

```javascript
import { useNftAnalytics } from '@/hooks/useDatabaseActions';

const { analytics, isLoading, error } = useNftAnalytics(nftId);

// analytics.stakingStats is guaranteed to have correct structure
const { totalStaked, totalStakers } = analytics.stakingStats;
```

## Data Synchronization

### Automatic Synchronization

The `scripts/sync-data.js` script ensures data consistency:

```bash
# Validate data consistency
npm run validate:data

# Sync all data sources
npm run sync:data

# Sync marketplace data only
node scripts/sync-data.js marketplace

# Sync user data only
node scripts/sync-data.js users

# Validate existing data
node scripts/sync-data.js validate
```

### Sync Process

1. **Marketplace Data Sync**:
   - Fetches listings from database (if available)
   - Validates all listing data
   - Updates JSON files with consistent format
   - Generates summary statistics

2. **User Data Sync**:
   - Aggregates user statistics from database
   - Creates user data summaries
   - Validates data integrity

3. **Validation Process**:
   - Checks file existence and structure
   - Validates all data against schemas
   - Reports inconsistencies
   - Suggests fixes

### Manual Validation

```javascript
import { DatabaseConsistencyChecker } from '@/utils/dataValidation';

const checker = new DatabaseConsistencyChecker();

// Check user actions consistency
const userCheck = await checker.checkUserActionsConsistency(
  '0x123...abc', // user address
  1 // nft id
);

if (!userCheck.isConsistent) {
  console.error('Inconsistencies found:', userCheck.discrepancies);
}

// Check marketplace data consistency
const marketplaceCheck = await checker.checkMarketplaceConsistency();

if (!marketplaceCheck.isConsistent) {
  console.error('Marketplace data inconsistent:', marketplaceCheck.error);
}
```

## Error Handling Strategies

### 1. Graceful Degradation

```javascript
// Database operations never block UI
try {
  await recordStakeAction(data);
} catch (error) {
  // Log error but continue with smart contract operation
  console.warn('Database recording failed:', error.message);
  // Smart contract transaction still proceeds
}
```

### 2. Fallback Data

```javascript
// Provide fallback analytics data
const analytics = useNftAnalytics(nftId);

// If database fails, show default values
const displayData = analytics || {
  stakingStats: {
    totalStakers: 0,
    totalStaked: 0
  }
};
```

### 3. Retry Mechanisms

```javascript
// Automatic retry with exponential backoff
const { data, refetch } = useUserActiveStakes();

// Manual retry on error
if (error) {
  setTimeout(() => refetch(), 5000);
}
```

## Testing Framework

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="Data Validation"
npm test -- --testNamePattern="Contract Integration"
npm test -- --testNamePattern="User Flow"
```

### Test Coverage

1. **Data Validation Tests**:
   - Schema validation for all data types
   - Error handling for invalid data
   - Edge cases and boundary conditions

2. **Contract Integration Tests**:
   - ABI validation
   - Address validation
   - Function signature verification

3. **API Consistency Tests**:
   - Request/response validation
   - Error handling
   - Data transformation accuracy

4. **End-to-End Tests**:
   - Complete user workflows
   - Frontend-backend integration
   - Error recovery scenarios

### Continuous Validation

```javascript
// Add validation middleware to API routes
import { validateUserAction } from '@/utils/dataValidation';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate input data
    const validatedData = validateUserAction(data);
    
    // Process with validated data
    const result = await processUserAction(validatedData);
    
    return NextResponse.json(result);
  } catch (validationError) {
    return NextResponse.json(
      { error: validationError.message },
      { status: 400 }
    );
  }
}
```

## Monitoring and Alerts

### Data Quality Monitoring

1. **Automated Checks**:
   - Daily data consistency validation
   - Contract address verification
   - Database integrity checks

2. **Alert Conditions**:
   - Invalid data detected
   - Contract address mismatches
   - Database connection failures
   - API response validation failures

3. **Recovery Procedures**:
   - Automatic data correction
   - Fallback to cached data
   - Manual intervention protocols

### Performance Monitoring

1. **Database Query Performance**:
   - Query execution time tracking
   - Index usage optimization
   - Connection pool monitoring

2. **API Response Times**:
   - Endpoint performance tracking
   - Error rate monitoring
   - Throughput analysis

3. **Frontend Performance**:
   - Hook execution timing
   - Component render performance
   - Data loading efficiency

## Best Practices

### 1. Always Validate Input

```javascript
// Bad: Trust input data
const result = await processStake(inputData);

// Good: Validate first
try {
  const validatedData = validateStakeData(inputData);
  const result = await processStake(validatedData);
} catch (error) {
  handleValidationError(error);
}
```

### 2. Handle Errors Gracefully

```javascript
// Bad: Let errors crash the app
const stakes = await fetchUserStakes(address);

// Good: Provide fallbacks
const stakes = await fetchUserStakes(address).catch(error => {
  console.warn('Stakes fetch failed:', error.message);
  return []; // Empty array as fallback
});
```

### 3. Use TypeScript for Better Validation

```typescript
interface UserAction {
  user_address: string;
  nft_id: number;
  action_type: 'stake' | 'unstake' | 'vote';
  tx_hash: string;
  amount?: string;
}

function validateUserAction(data: unknown): UserAction {
  // Runtime validation with compile-time types
  return UserActionSchema.parse(data);
}
```

### 4. Test Data Consistency

```javascript
describe('Data Consistency', () => {
  test('Frontend and backend data match', async () => {
    const frontendData = await fetchFrontendData();
    const backendData = await fetchBackendData();
    
    expect(frontendData).toMatchObject(backendData);
  });
});
```

### 5. Document Data Dependencies

```javascript
/**
 * Stake recording function
 * 
 * @param {Object} stakeData - Stake information
 * @param {string} stakeData.userAddress - Ethereum address (42 chars)
 * @param {number} stakeData.nftId - NFT identifier (positive integer)
 * @param {string} stakeData.amount - Stake amount (decimal string)
 * @param {string} stakeData.stakingContract - Contract address (42 chars)
 * @param {string} stakeData.txHash - Transaction hash (66 chars)
 * 
 * @requires Database connection
 * @requires Valid contract addresses
 * @returns {Promise<Object>} Recorded stake data
 */
async function recordStake(stakeData) {
  // Implementation
}
```

## Conclusion

This data consistency framework ensures:

1. **Reliable Data Flow**: All data is validated at every step
2. **Error Resilience**: Graceful handling of failures
3. **Type Safety**: Schema validation prevents runtime errors
4. **Testing Coverage**: Comprehensive test suite catches issues
5. **Monitoring**: Continuous validation and alerting

By following these guidelines, LandKrypt maintains data integrity across all components while providing a robust user experience.
