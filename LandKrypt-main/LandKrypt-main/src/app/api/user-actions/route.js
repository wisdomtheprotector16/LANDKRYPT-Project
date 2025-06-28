import { NextResponse } from 'next/server';
import DatabaseService, { ACTION_TYPES } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { 
      userAddress, 
      nftId, 
      actionType, 
      txHash, 
      blockNumber, 
      amount, 
      stakingContract,
      proposalId,
      voteChoice,
      votingPower,
      metadata = {} 
    } = await request.json();

    // Validate required fields
    if (!userAddress || !nftId || !actionType || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, nftId, actionType, txHash' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true); // Use admin client for server operations
    let result;

    // Handle different action types
    switch (actionType) {
      case ACTION_TYPES.STAKE:
        if (!stakingContract || !amount) {
          return NextResponse.json(
            { error: 'Stake action requires stakingContract and amount' },
            { status: 400 }
          );
        }
        result = await db.recordStake({
          userAddress,
          nftId,
          stakingContract,
          amount,
          txHash,
          metadata
        });
        break;

      case ACTION_TYPES.VOTE:
        if (proposalId === undefined || voteChoice === undefined || !votingPower) {
          return NextResponse.json(
            { error: 'Vote action requires proposalId, voteChoice, and votingPower' },
            { status: 400 }
          );
        }
        result = await db.recordVote({
          userAddress,
          nftId,
          proposalId,
          voteChoice,
          votingPower,
          txHash,
          metadata
        });
        break;

      case ACTION_TYPES.UNSTAKE:
        result = await db.endStake(userAddress, nftId, txHash);
        break;

      default:
        // For other action types (purchase, list, approve)
        result = await db.recordUserAction({
          userAddress,
          nftId,
          actionType,
          txHash,
          blockNumber,
          amount,
          metadata
        });
        break;
    }

    return NextResponse.json(
      { 
        message: `${actionType} action recorded successfully`,
        data: result
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error recording user action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const nftId = searchParams.get('nftId');
    const actionType = searchParams.get('actionType');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true); // Use admin client for server operations
    let result = {};

    // Get user actions for specific NFT if nftId is provided
    if (nftId) {
      const actions = await db.getUserNftActions(userAddress, parseInt(nftId));
      const stakes = await db.getUserNftStakes(userAddress, parseInt(nftId));
      const votes = await db.getUserNftVotes(userAddress, parseInt(nftId));
      
      result = {
        nftId: parseInt(nftId),
        actions,
        stakes,
        votes
      };
    } else {
      // Get all active stakes for user
      const activeStakes = await db.getUserActiveStakes(userAddress);
      result = {
        activeStakes
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching user actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
