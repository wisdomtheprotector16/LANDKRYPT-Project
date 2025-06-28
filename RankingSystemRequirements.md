# Tier Ranking System Requirements

## Overview

Implement a 5-tier ranking system where users progress through tiers based on XP earned from platform activities. The system must:

1. Track XP from staking, voting, and logins
2. Store data in database
3. Display user tier & progress on frontend
4. Use tier-specific avatars
5. Maintain existing project functionality

TierBadge Component (Persistent on all pages)
a little animition when the daily xp is added to the users balance and animation as his progress bar increases

---

## Tier Structure

| Tier | Name              | Required XP | Avatar Path     |
| ---- | ----------------- | ----------- | --------------- |
| 1    | Territory Trainee | 0           | `/tier-avatars/ |
| 2    | Plot Pioneer      | 5,000       | `/tier-avatars/ |
| 3    | Estate Architect  | 10,000      | `/tier-avatars/ |
| 4    | Dominion Magnate  | 15,000      | `/tier-avatars/ |
| 5    | Realm Sovereign   | 20,000      | `/tier-avatars/ |

---

## XP Earning Mechanism

| Action      | XP Formula                    | Conditions                      |
| ----------- | ----------------------------- | ------------------------------- |
| Daily Login | +30 XP                        | Once per 24 hours per wallet    |
| Staking     | +10% of staked amount (in XP) | Applied when stake is confirmed |
| Voting      | +3% of vote weight (in XP)    | Applied when vote is cast       |

---

## Database Requirements

### Schema: `UserTierProgress`

```javascript
{
  walletAddress: String, // Primary key
  totalXP: Number,       // Current total XP
  tierProgress: Number,  // XP in current tier (0-5000)
  currentTier: Number,   // 1-5
  lastLogin: Date        // For daily login check
}
```

Very important UI implementations must do
TierBadge Component (Persistent on all pages)
a little animition when the daily xp is added to the users balance and animation as his progress bar increases
