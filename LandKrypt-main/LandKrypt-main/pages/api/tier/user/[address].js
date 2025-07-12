// API endpoint for user tier data
// GET /api/tier/user/[address] - Get user's tier information

import tierService from '../../../../src/lib/blockchain/tier-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const tierData = await tierService.getUserTierData(address);

    res.status(200).json(tierData);
  } catch (error) {
    console.error('Error fetching user tier data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
