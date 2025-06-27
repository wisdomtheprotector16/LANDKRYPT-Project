import { NextResponse } from 'next/server';

// Mock database connection - replace with your actual database client
// import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userAddress, actionType, txHash } = await request.json();

    // Validate required fields
    if (!userAddress || !actionType || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock database insert - replace with actual database logic
    const userAction = {
      id: Date.now(),
      user_address: userAddress,
      action_type: actionType,
      tx_hash: txHash,
      timestamp: new Date().toISOString()
    };

    // Example with Supabase:
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY
    // );
    // 
    // const { data, error } = await supabase
    //   .from('user_actions')
    //   .insert([userAction])
    //   .select();
    //
    // if (error) throw error;

    return NextResponse.json(
      { 
        message: 'User action recorded successfully',
        data: userAction
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

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    // Mock database query - replace with actual database logic
    const mockActions = [
      {
        id: 1,
        user_address: userAddress,
        action_type: 'stake',
        tx_hash: '0x123...abc',
        timestamp: new Date().toISOString()
      }
    ];

    // Example with Supabase:
    // const { data, error } = await supabase
    //   .from('user_actions')
    //   .select('*')
    //   .eq('user_address', userAddress)
    //   .order('timestamp', { ascending: false });
    //
    // if (error) throw error;

    return NextResponse.json({
      actions: mockActions
    });

  } catch (error) {
    console.error('Error fetching user actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
