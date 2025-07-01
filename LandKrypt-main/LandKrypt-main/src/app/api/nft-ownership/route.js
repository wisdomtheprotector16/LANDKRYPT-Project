import { NextResponse } from 'next/server';

// Try to import database service, but handle if it's not available
let DatabaseService = null;
let isSupabaseAvailable = false;

try {
  const supabaseModule = await import('@/lib/supabase');
  DatabaseService = supabaseModule.default;
  isSupabaseAvailable = true;
} catch (error) {
  console.warn('Supabase not available, nft ownership will use fallback mode:', error.message);
  isSupabaseAvailable = false;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nftId = searchParams.get('nftId');
    const readyForProposals = searchParams.get('readyForProposals');

    // If Supabase is not available, return mock ownership data
    if (!isSupabaseAvailable || !DatabaseService) {
      const mockOwnership = {
        id: 1,
        nft_id: nftId ? parseInt(nftId) : 1,
        staking_contract: '0x1234567890123456789012345678901234567890',
        is_owned_by_staking: true,
        purchase_tx_hash: '0xabcdef1234567890',
        purchase_timestamp: new Date().toISOString(),
        has_proposal: false,
        proposal_contract: null,
        metadata: { type: 'mock' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (readyForProposals === 'true') {
        return NextResponse.json({ 
          nfts: [mockOwnership],
          message: 'Mock data - Supabase not available'
        });
      } else if (nftId) {
        return NextResponse.json({ 
          ownership: mockOwnership,
          message: 'Mock data - Supabase not available'
        });
      } else {
        return NextResponse.json(
          { error: 'Please specify nftId or set readyForProposals=true' },
          { status: 400 }
        );
      }
    }

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
