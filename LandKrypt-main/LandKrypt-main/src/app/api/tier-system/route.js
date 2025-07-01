import { NextResponse } from 'next/server';

import { supabaseAdmin } from '../../../lib/supabase';

// XP earning rates
const XP_RATES = {
  DAILY_LOGIN: 30,
  STAKING: (amount) => Math.floor(amount * 0.1),
  VOTING: (voteWeight) => Math.floor(voteWeight * 0.03),
};

// Calculate tier from total XP
function calculateTier(totalXP) {
  const tiers = [
    { tier: 5, requiredXP: 20000 },
    { tier: 4, requiredXP: 15000 },
    { tier: 3, requiredXP: 10000 },
    { tier: 2, requiredXP: 5000 },
    { tier: 1, requiredXP: 0 },
  ];

  for (const { tier, requiredXP } of tiers) {
    if (totalXP >= requiredXP) {
      const tierProgress = tier < 5 ? totalXP - requiredXP : 5000;
      return { currentTier: tier, tierProgress };
    }
  }

  return { currentTier: 1, tierProgress: totalXP };
}

// GET - Fetch user tier data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }


    const { data, error } = await supabaseAdmin
      .from('user_tier_progress')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create new user entry
      const newUser = {
        wallet_address: walletAddress,
        total_xp: 0,
        tier_progress: 0,
        current_tier: 1,
        last_login: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('user_tier_progress')
        .insert(newUser)
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json(createdUser);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tier data:', error);
    // Return fallback data on error
    return NextResponse.json({
      id: 1,
      wallet_address: new URL(request.url).searchParams.get('wallet'),
      total_xp: 0,
      current_tier: 1,
      tier_progress: 0,
      last_login: new Date().toISOString(),
      last_daily_xp_claim: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

// POST - Award XP or update tier data
export async function POST(request) {
  try {
    const body = await request.json();
    const { walletAddress, actionType, actionData = {} } = body;

    if (!walletAddress || !actionType) {
      return NextResponse.json(
        { error: 'Wallet address and action type are required' },
        { status: 400 }
      );
    }


    // Get current user data
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('user_tier_progress')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let xpToAward = 0;
    let updateData = {
      updated_at: new Date().toISOString(),
    };

    switch (actionType) {
      case 'DAILY_LOGIN':
        // Check if daily XP already claimed
        const lastClaim = currentUser.last_daily_xp_claim;
        const now = new Date();
        const lastClaimDate = lastClaim ? new Date(lastClaim) : null;

        if (!lastClaimDate || now - lastClaimDate >= 24 * 60 * 60 * 1000) {
          xpToAward = XP_RATES.DAILY_LOGIN;
          updateData.last_daily_xp_claim = now.toISOString();
          updateData.last_login = now.toISOString();
        } else {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Daily XP already claimed',
              nextClaimTime: new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000)
            },
            { status: 400 }
          );
        }
        break;

      case 'STAKING':
        xpToAward = XP_RATES.STAKING(actionData.amount || 0);
        break;

      case 'VOTING':
        xpToAward = XP_RATES.VOTING(actionData.voteWeight || 0);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    if (xpToAward <= 0) {
      return NextResponse.json(
        { success: false, message: 'No XP to award' },
        { status: 400 }
      );
    }

    // Calculate new totals
    const newTotalXP = currentUser.total_xp + xpToAward;
    const { currentTier, tierProgress } = calculateTier(newTotalXP);

    // Update user data
    updateData = {
      ...updateData,
      total_xp: newTotalXP,
      tier_progress: tierProgress,
      current_tier: currentTier,
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('user_tier_progress')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) throw updateError;

    // Check if tier increased
    const tierUp = currentTier > currentUser.current_tier;

    return NextResponse.json({
      success: true,
      xpAwarded: xpToAward,
      newTotalXP,
      currentTier,
      tierProgress,
      tierUp,
      userData: updatedUser,
    });

  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json(
      { error: 'Failed to award XP' },
      { status: 500 }
    );
  }
}

// PUT - Update tier data (admin only)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { walletAddress, totalXP, currentTier, tierProgress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (totalXP !== undefined) updateData.total_xp = totalXP;
    if (currentTier !== undefined) updateData.current_tier = currentTier;
    if (tierProgress !== undefined) updateData.tier_progress = tierProgress;

    const { data, error } = await supabaseAdmin
      .from('user_tier_progress')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      userData: data,
    });

  } catch (error) {
    console.error('Error updating tier data:', error);
    return NextResponse.json(
      { error: 'Failed to update tier data' },
      { status: 500 }
    );
  }
}
