// API endpoint for awarding XP
// POST /api/tier/award-xp - Award XP to a user for an activity

import tierService from '../../../src/lib/blockchain/tier-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, activityKey, amount, metadata = {} } = req.body;

    // Validation
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!activityKey) {
      return res.status(400).json({ error: 'Activity key is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Validate amount if provided
    if (amount !== null && amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
    }

    const result = await tierService.awardXP(walletAddress, activityKey, amount, metadata);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
