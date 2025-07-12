// API endpoint for tier leaderboard
// GET /api/tier/leaderboard - Get tier system leaderboard

import tierService from '../../../src/lib/blockchain/tier-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 100 } = req.query;

    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return res.status(400).json({ error: 'Limit must be between 1 and 1000' });
    }

    const leaderboard = await tierService.getLeaderboard(parsedLimit);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
