import { NextResponse } from 'next/server';
import { DatabaseService, TABLES } from '@/lib/supabase';
import { verifyMessage } from 'viem';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userAddress,
      stepData,
      currentStep,
      propertyDetails,
      uploadedFiles,
      signature,
      message
    } = body;

    // Validate required fields
    if (!userAddress || !currentStep) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, currentStep' },
        { status: 400 }
      );
    }

    // Optional: Verify wallet signature for authentication
    if (signature && message) {
      try {
        const isValid = await verifyMessage({
          address: userAddress,
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

    // Check if submission already exists for this user
    const { data: existingSubmission, error: checkError } = await db.client
      .from(TABLES.ANTHOS_SUBMISSIONS)
      .select('*')
      .eq('user_address', userAddress)
      .eq('status', 'in_progress')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let submissionData;
    
    if (existingSubmission) {
      // Update existing submission
      const updateData = {
        current_step: currentStep,
        updated_at: new Date().toISOString()
      };

      // Update step-specific data
      if (currentStep === 1 && uploadedFiles) {
        updateData.step_1_files = uploadedFiles;
      } else if (currentStep === 2 && propertyDetails) {
        updateData.step_2_data = propertyDetails;
      }

      // Add any additional metadata
      if (stepData) {
        updateData.metadata = {
          ...existingSubmission.metadata,
          [`step_${currentStep}_data`]: stepData,
          lastUpdated: new Date().toISOString()
        };
      }

      // Mark as completed if we're at step 4
      if (currentStep === 4) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedSubmission, error: updateError } = await db.client
        .from(TABLES.ANTHOS_SUBMISSIONS)
        .update(updateData)
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      submissionData = updatedSubmission;
    } else {
      // Create new submission
      const newSubmissionData = {
        user_address: userAddress,
        current_step: currentStep,
        status: 'in_progress',
        metadata: {
          startedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      };

      // Add step-specific data
      if (currentStep === 1 && uploadedFiles) {
        newSubmissionData.step_1_files = uploadedFiles;
      } else if (currentStep === 2 && propertyDetails) {
        newSubmissionData.step_2_data = propertyDetails;
      }

      if (stepData) {
        newSubmissionData.metadata[`step_${currentStep}_data`] = stepData;
      }

      const { data: newSubmission, error: insertError } = await db.client
        .from(TABLES.ANTHOS_SUBMISSIONS)
        .insert([newSubmissionData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      submissionData = newSubmission;
    }

    // If we have property details (step 2), create or update property verification record
    if (currentStep >= 2 && propertyDetails) {
      const propertyVerificationData = {
        submission_id: submissionData.id,
        property_title: propertyDetails.title || 'Untitled Property',
        property_location: propertyDetails.location || 'Location not specified',
        property_size: propertyDetails.size || null,
        estimated_value: propertyDetails.estimatedValue ? parseFloat(propertyDetails.estimatedValue) : null,
        property_description: propertyDetails.description || '',
        owner_address: userAddress,
        verification_status: 'pending',
        metadata: {
          mintAsNFT: propertyDetails.mintAsNFT || false,
          listOnMarketplace: propertyDetails.listOnMarketplace || false,
          submissionStep: currentStep,
          updatedAt: new Date().toISOString()
        }
      };

      // Check if property verification already exists
      const { data: existingVerification, error: verificationCheckError } = await db.client
        .from(TABLES.PROPERTY_VERIFICATIONS)
        .select('*')
        .eq('submission_id', submissionData.id)
        .single();

      if (verificationCheckError && verificationCheckError.code !== 'PGRST116') {
        throw verificationCheckError;
      }

      if (existingVerification) {
        // Update existing verification
        const { data: updatedVerification, error: verificationUpdateError } = await db.client
          .from(TABLES.PROPERTY_VERIFICATIONS)
          .update({
            ...propertyVerificationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVerification.id)
          .select()
          .single();

        if (verificationUpdateError) {
          throw verificationUpdateError;
        }

        submissionData.propertyVerification = updatedVerification;
      } else {
        // Create new verification
        const { data: newVerification, error: verificationInsertError } = await db.client
          .from(TABLES.PROPERTY_VERIFICATIONS)
          .insert([propertyVerificationData])
          .select()
          .single();

        if (verificationInsertError) {
          throw verificationInsertError;
        }

        // Update submission with verification reference
        await db.client
          .from(TABLES.ANTHOS_SUBMISSIONS)
          .update({ verification_id: newVerification.id })
          .eq('id', submissionData.id);

        submissionData.propertyVerification = newVerification;
      }
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submissionData.id,
        userAddress: submissionData.user_address,
        currentStep: submissionData.current_step,
        status: submissionData.status,
        startedAt: submissionData.started_at,
        completedAt: submissionData.completed_at,
        propertyVerification: submissionData.propertyVerification || null
      },
      message: `Step ${currentStep} data saved successfully`
    });

  } catch (error) {
    console.error('Anthos submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const status = searchParams.get('status');
    const submissionId = searchParams.get('submissionId');

    const db = new DatabaseService(true); // Use admin client

    if (submissionId) {
      // Get specific submission with property verification details
      const { data: submission, error: submissionError } = await db.client
        .from(TABLES.ANTHOS_SUBMISSIONS)
        .select(`
          *,
          property_verification:property_verifications(*)
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        throw submissionError;
      }

      return NextResponse.json({
        success: true,
        submission: submission
      });
    }

    let query = db.client
      .from(TABLES.ANTHOS_SUBMISSIONS)
      .select(`
        *,
        property_verification:property_verifications(*)
      `);

    // Filter by user address
    if (userAddress) {
      query = query.eq('user_address', userAddress);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: submissions, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      submissions: submissions,
      count: submissions.length
    });

  } catch (error) {
    console.error('Get Anthos submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { submissionId, verificationStatus, verificationNotes, verifiedBy, tokenId, nftMinted } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    const db = new DatabaseService(true); // Use admin client

    // Update property verification if verification status is provided
    if (verificationStatus) {
      const updateData = {
        verification_status: verificationStatus,
        updated_at: new Date().toISOString()
      };

      if (verificationNotes) {
        updateData.verification_notes = verificationNotes;
      }

      if (verifiedBy) {
        updateData.verified_by = verifiedBy;
        updateData.verified_at = new Date().toISOString();
      }

      if (tokenId) {
        updateData.token_id = tokenId;
      }

      if (nftMinted !== undefined) {
        updateData.nft_minted = nftMinted;
        if (nftMinted) {
          updateData.minted_at = new Date().toISOString();
        }
      }

      // Get submission to find verification ID
      const { data: submission, error: submissionError } = await db.client
        .from(TABLES.ANTHOS_SUBMISSIONS)
        .select('verification_id')
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        throw submissionError;
      }

      if (submission.verification_id) {
        const { data: updatedVerification, error: verificationError } = await db.client
          .from(TABLES.PROPERTY_VERIFICATIONS)
          .update(updateData)
          .eq('id', submission.verification_id)
          .select()
          .single();

        if (verificationError) {
          throw verificationError;
        }

        return NextResponse.json({
          success: true,
          verification: updatedVerification,
          message: 'Property verification updated successfully'
        });
      }
    }

    return NextResponse.json(
      { error: 'No verification record found for this submission' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Update Anthos submission error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission', details: error.message },
      { status: 500 }
    );
  }
}
