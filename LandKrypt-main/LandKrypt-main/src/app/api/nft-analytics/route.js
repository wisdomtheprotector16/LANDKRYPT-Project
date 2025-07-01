import { NextResponse } from 'next/server';

import DatabaseService from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nftId = searchParams.get('nftId');

    if (!nftId) {
      return NextResponse.json(
        { error: 'NFT ID is required' },
        { status: 400 }
      );
    }


    const db = new DatabaseService(true); // Use admin client for server operations
    
    // Get staking statistics
    const stakingStats = await db.getNftStakingStats(parseInt(nftId));
    
    // Get recent actions
    const recentActions = await db.getNftActions(parseInt(nftId), 50);
    
    // Process actions by type
    const actionsByType = recentActions.reduce((acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    }, {});

    // Get unique participants
    const uniqueParticipants = new Set(recentActions.map(action => action.user_address)).size;

    // Calculate activity metrics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent24hActions = recentActions.filter(
      action => new Date(action.timestamp) > last24Hours
    );
    const recent7dActions = recentActions.filter(
      action => new Date(action.timestamp) > last7Days
    );

    const analytics = {
      nftId: parseInt(nftId),
      stakingStats,
      activity: {
        totalActions: recentActions.length,
        actionsByType,
        uniqueParticipants,
        last24Hours: recent24hActions.length,
        last7Days: recent7dActions.length
      },
      recentActions: recentActions.slice(0, 10) // Last 10 actions
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching NFT analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
