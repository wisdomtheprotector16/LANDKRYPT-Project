import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nftId = searchParams.get('nftId');
    const readyForProposals = searchParams.get('readyForProposals');

    const db = new DatabaseService(true);

    if (readyForProposals === 'true') {
      // Get NFTs owned by staking contracts that don't have proposals yet
      const nfts = await db.getNftsReadyForProposals();
      return NextResponse.json({ nfts });
    } else if (nftId) {
      // Get ownership details for specific NFT
      const ownership = await db.getNftOwnership(parseInt(nftId));
      return NextResponse.json({ ownership });
    } else {
      return NextResponse.json(
        { error: 'Please specify nftId or set readyForProposals=true' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error fetching NFT ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      nftId,
      stakingContract,
      txHash,
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!nftId || !stakingContract || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, stakingContract, txHash' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true);

    // Record the NFT purchase by staking contract
    const ownership = await db.recordNftPurchase({
      nftId,
      stakingContract,
      txHash,
      metadata
    });

    return NextResponse.json(
      {
        message: 'NFT purchase recorded successfully',
        ownership
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error recording NFT purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
