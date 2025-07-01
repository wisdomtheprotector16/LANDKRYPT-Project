import { NextResponse } from 'next/server';

import DatabaseService from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nftId = searchParams.get('nftId');
    const creatorAddress = searchParams.get('creatorAddress');


    const db = new DatabaseService(true);

    if (nftId) {
      // Get proposals for specific NFT
      const proposals = await db.getNftProposals(parseInt(nftId));
      return NextResponse.json({ proposals });
    } else if (status === 'active') {
      // Get active proposals
      const proposals = await db.getActiveProposals();
      return NextResponse.json({ proposals });
    } else if (creatorAddress) {
      // Get proposals by creator
      const proposals = await db.getAllProposals();
      const filteredProposals = proposals.filter(p => 
        p.creator_address.toLowerCase() === creatorAddress.toLowerCase()
      );
      return NextResponse.json({ proposals: filteredProposals });
    } else {
      // Get all proposals
      const proposals = await db.getAllProposals(status);
      return NextResponse.json({ proposals });
    }

  } catch (error) {
    console.error('Error fetching proposals:', error);
    // Return fallback mock data on error
    return NextResponse.json({
      proposals: [
        {
          id: 1,
          nft_id: 1,
          title: 'Fallback Proposal',
          description: 'Mock proposal due to database error',
          creator_address: '0x1234567890abcdef',
          status: 'active',
          ownership_percentage: 50,
          timeframe: '12 months',
          voting_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          yes_votes: 0,
          no_votes: 0,
          total_votes: 0,
          created_at: new Date().toISOString(),
          metadata: { type: 'fallback' }
        }
      ],
      error: 'Database unavailable, showing mock data'
    });
  }
}

export async function POST(request) {
  try {
    const {
      nftId,
      title,
      description,
      creatorAddress,
      ownershipPercentage,
      timeframe,
      votingDeadline,
      proposalContract,
      txHash,
      nftImageUri,
      nftTitle,
      nftLocation,
      stakingContract,
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!nftId || !title || !description || !creatorAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, title, description, creatorAddress, txHash' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true);

    // Create the proposal with enhanced metadata
    const proposal = await db.createProposal({
      nftId,
      title,
      description,
      creatorAddress,
      ownershipPercentage,
      timeframe,
      votingDeadline: votingDeadline ? new Date(votingDeadline).toISOString() : null,
      proposalContract,
      txHash,
      nftImageUri,
      nftTitle,
      nftLocation,
      stakingContract,
      metadata
    });

    return NextResponse.json(
      {
        message: 'Proposal created successfully',
        proposal
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const {
      proposalId,
      status,
      yesVotes,
      noVotes,
      totalVotes,
      metadata = {}
    } = await request.json();

    if (!proposalId) {
      return NextResponse.json(
        { error: 'Missing required field: proposalId' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true);

    let result;
    if (status) {
      // Update proposal status
      result = await db.updateProposalStatus(proposalId, status, metadata);
    } else if (yesVotes !== undefined || noVotes !== undefined || totalVotes !== undefined) {
      // Update vote counts
      result = await db.updateProposalVotes(proposalId, yesVotes, noVotes, totalVotes);
    } else {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Proposal updated successfully',
      proposal: result
    });

  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
