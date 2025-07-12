// API endpoint for daily reward claiming
// POST /api/tier/daily-reward - Claim daily XP reward

import tierService from '../../../src/lib/blockchain/tier-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const result = await tierService.claimDailyReward(walletAddress);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
