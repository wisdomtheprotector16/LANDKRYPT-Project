import { Router } from 'express';
import DatabaseService from '../lib/supabase';

// Initialize the router
const router = Router();

// Initialize database service
const dbService = new DatabaseService(true);

// Route to award XP for an action (login, stake, vote)
router.post('/award-xp', async (req, res) => {
  const { userAddress, action, xp } = req.body;

  if (!userAddress || !action || !xp) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Fetch current user progress
    const { data, error } = await dbService.client
      .from('user_tier_progress')
      .select('*')
      .eq('wallet_address', userAddress)
      .single();

    if (error) throw error;

    // Calculate updated XP and tier progress
    const newTotalXP = data.total_xp + xp;
    let newTierProgress = data.tier_progress + xp;
    let newCurrentTier = data.current_tier;

    // Check for tier upgrade
    if (newTierProgress >= 5000) {
      newCurrentTier = Math.min(newCurrentTier + 1, 5);
      newTierProgress = newTierProgress % 5000;
    }

    // Update database with new XP values
    const { error: updateError } = await dbService.client
      .from('user_tier_progress')
      .update({
        total_xp: newTotalXP,
        tier_progress: newTierProgress,
        current_tier: newCurrentTier,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', userAddress);

    if (updateError) throw updateError;

    res.status(200).json({ success: true, newTier: newCurrentTier, newTotalXP });
  } catch (e) {
    console.error('Error awarding XP:', e);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

export default router;
