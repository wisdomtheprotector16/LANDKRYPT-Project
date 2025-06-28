import { NextResponse } from 'next/server';
import { DatabaseService, TABLES } from '@/lib/supabase';
import { verifyMessage } from 'viem';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      companyName,
      email,
      phone,
      businessLicense,
      yearsExperience,
      specialization,
      portfolioUrl,
      verificationDocuments,
      signature,
      message
    } = body;

    // Validate required fields
    if (!walletAddress || !companyName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, companyName, email' },
        { status: 400 }
      );
    }

    // Optional: Verify wallet signature for authentication
    if (signature && message) {
      try {
        const isValid = await verifyMessage({
          address: walletAddress,
          message,
          signature,
        });
        
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid wallet signature' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('Signature verification error:', error);
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    }

    const db = new DatabaseService(true); // Use admin client

    // Check if developer already exists
    const { data: existingDeveloper, error: checkError } = await db.client
      .from(TABLES.DEVELOPERS)
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingDeveloper) {
      return NextResponse.json(
        { error: 'Developer already registered with this wallet address' },
        { status: 409 }
      );
    }

    // Create new developer registration
    const { data: newDeveloper, error: insertError } = await db.client
      .from(TABLES.DEVELOPERS)
      .insert([{
        wallet_address: walletAddress,
        company_name: companyName,
        email: email,
        phone: phone || null,
        business_license: businessLicense || null,
        years_experience: yearsExperience || null,
        specialization: specialization || [],
        portfolio_url: portfolioUrl || null,
        verification_documents: verificationDocuments || {},
        status: 'pending',
        verified: false,
        metadata: {
          registrationSource: 'frontend',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          registeredAt: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      developer: {
        id: newDeveloper.id,
        walletAddress: newDeveloper.wallet_address,
        companyName: newDeveloper.company_name,
        email: newDeveloper.email,
        status: newDeveloper.status,
        verified: newDeveloper.verified,
        registeredAt: newDeveloper.registered_at
      },
      message: 'Developer registration submitted successfully. Verification is pending.'
    });

  } catch (error) {
    console.error('Developer registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register developer', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const status = searchParams.get('status');
    const verified = searchParams.get('verified');

    const db = new DatabaseService(true); // Use admin client

    let query = db.client.from(TABLES.DEVELOPERS).select('*');

    // Filter by wallet address
    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by verification status
    if (verified !== null) {
      query = query.eq('verified', verified === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data: developers, error } = await query;

    if (error) {
      throw error;
    }

    // Remove sensitive information from response
    const safeDevelopers = developers.map(dev => ({
      id: dev.id,
      walletAddress: dev.wallet_address,
      companyName: dev.company_name,
      email: dev.email,
      yearsExperience: dev.years_experience,
      specialization: dev.specialization,
      portfolioUrl: dev.portfolio_url,
      verified: dev.verified,
      status: dev.status,
      registeredAt: dev.registered_at,
      verifiedAt: dev.verified_at
    }));

    return NextResponse.json({
      success: true,
      developers: safeDevelopers,
      count: safeDevelopers.length
    });

  } catch (error) {
    console.error('Get developers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developers', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, verified, verificationNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true); // Use admin client

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verified_at = new Date().toISOString();
      }
    }

    if (verificationNotes) {
      updateData.metadata = {
        verificationNotes,
        verifiedBy: 'admin', // In a real app, get this from auth
        verificationDate: new Date().toISOString()
      };
    }

    const { data: updatedDeveloper, error } = await db.client
      .from(TABLES.DEVELOPERS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      developer: {
        id: updatedDeveloper.id,
        walletAddress: updatedDeveloper.wallet_address,
        companyName: updatedDeveloper.company_name,
        status: updatedDeveloper.status,
        verified: updatedDeveloper.verified,
        verifiedAt: updatedDeveloper.verified_at
      },
      message: 'Developer status updated successfully'
    });

  } catch (error) {
    console.error('Update developer error:', error);
    return NextResponse.json(
      { error: 'Failed to update developer', details: error.message },
      { status: 500 }
    );
  }
}
