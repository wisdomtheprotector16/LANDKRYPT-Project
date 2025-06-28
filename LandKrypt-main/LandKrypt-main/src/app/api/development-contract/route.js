import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/supabase';

export async function POST(request) {
  try {
    const {
      nftId,
      developmentContract,
      txHash,
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!nftId || !developmentContract || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: nftId, developmentContract, txHash' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true);

    // Record development contract minting and clean up proposals
    const result = await db.recordDevelopmentContractMint({
      nftId,
      developmentContract,
      txHash,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });

    return NextResponse.json(
      {
        message: 'Development contract minted and proposals cleaned up successfully',
        result
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing development contract mint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const db = new DatabaseService(true);

    // Get NFT ownership details to check if development contract exists
    const ownership = await db.getNftOwnership(parseInt(nftId));

    if (!ownership) {
      return NextResponse.json(
        { error: 'NFT ownership record not found' },
        { status: 404 }
      );
    }

    const hasDevelopmentContract = ownership.metadata?.developmentContractMinted || false;

    return NextResponse.json({
      nftId: parseInt(nftId),
      hasDevelopmentContract,
      developmentContract: ownership.metadata?.developmentContract || null,
      ownership
    });

  } catch (error) {
    console.error('Error checking development contract status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
