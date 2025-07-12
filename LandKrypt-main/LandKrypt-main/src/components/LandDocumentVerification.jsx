// Land Document Verification Component
// Handles document verification, NFT minting, and marketplace listing

'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLandDocumentVerification } from '../hooks/useLandDocumentVerification';
import { AdminAccessWrapper, AdminStatusIndicator } from '../hooks/useAdminAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'react-hot-toast';
import {
  DocumentCheckIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function LandDocumentVerification() {
  const { address } = useAccount();
  const {
    isVerifying,
    isMinting,
    isListing,
    isAdmin,
    isAuthorized,
    adminLevel,
    canVerifyDocuments,
    canMintNFTs,
    verifiedDocuments,
    ownedLandNFTs,
    availableImages,
    verifyLandDocument,
    mintLandNFT,
    listLandNFTOnMarketplace,
    verifyAndMintWorkflow,
    getNextAvailableImage
  } = useLandDocumentVerification();

  const [documentForm, setDocumentForm] = useState({
    ownerAddress: '',
    location: '',
    size: '',
    landType: 'Residential',
    documentNumber: '',
    description: ''
  });

  const [listingForm, setListingForm] = useState({
    tokenId: '',
    price: ''
  });

  const [showMintSection, setShowMintSection] = useState(false);

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    
    if (!documentForm.ownerAddress || !documentForm.location || !documentForm.size) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await verifyLandDocument(documentForm);
      setShowMintSection(true);
    } catch (error) {
      console.error('Document verification failed:', error);
    }
  };

  const handleMintNFT = async (verifiedDoc) => {
    try {
      await mintLandNFT(verifiedDoc, verifiedDoc.ownerAddress || documentForm.ownerAddress);
      setShowMintSection(false);
      setDocumentForm({
        ownerAddress: '',
        location: '',
        size: '',
        landType: 'Residential',
        documentNumber: '',
        description: ''
      });
    } catch (error) {
      console.error('NFT minting failed:', error);
    }
  };

  const handleCompleteWorkflow = async (e) => {
    e.preventDefault();
    
    if (!documentForm.ownerAddress || !documentForm.location || !documentForm.size) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await verifyAndMintWorkflow(documentForm, documentForm.ownerAddress);
      setDocumentForm({
        ownerAddress: '',
        location: '',
        size: '',
        landType: 'Residential',
        documentNumber: '',
        description: ''
      });
    } catch (error) {
      console.error('Complete workflow failed:', error);
    }
  };

  const handleListNFT = async (e) => {
    e.preventDefault();
    
    if (!listingForm.tokenId || !listingForm.price) {
      toast.error('Please fill in token ID and price');
      return;
    }

    try {
      const priceInWei = BigInt(parseFloat(listingForm.price) * 1e18);
      await listLandNFTOnMarketplace(parseInt(listingForm.tokenId), priceInWei);
      setListingForm({ tokenId: '', price: '' });
    } catch (error) {
      console.error('NFT listing failed:', error);
    }
  };

  if (!address) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wallet Connection Required</h3>
          <p className="text-yellow-700">Please connect your wallet to access land document verification.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Land Document Verification</h1>
        <p className="text-gray-600">Verify land documents and mint NFTs to rightful owners</p>

        <div className="mt-3 flex justify-center">
          <AdminStatusIndicator />
        </div>

        {isAdmin && (
          <div className="mt-2 space-y-1">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <ShieldCheckIcon className="w-4 h-4 mr-1" />
              Admin Access Granted
            </Badge>
            {canVerifyDocuments && (
              <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                Document Verification
              </Badge>
            )}
            {canMintNFTs && (
              <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                NFT Minting
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Available Images Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-800">
            <PhotoIcon className="w-5 h-5 mr-2" />
            NFT Images Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{availableImages.length}</div>
              <div className="text-sm text-blue-700">Available Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getNextAvailableImage() ? '✓' : '✗'}
              </div>
              <div className="text-sm text-green-700">Next Image Ready</div>
            </div>
          </div>
          {getNextAvailableImage() && (
            <div className="mt-3 text-sm text-blue-600">
              Next image: {getNextAvailableImage()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Verification Form - Only for Admin */}
      <AdminAccessWrapper
        requiredPermission="verify_documents"
        fallback={
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Admin Access Required</h3>
              <p className="text-red-700 mb-4">
                Only authorized administrators can verify land documents and mint NFTs.
              </p>
              <div className="text-sm text-red-600">
                <p>Current Status: {isAdmin ? `Admin (${adminLevel})` : 'Regular User'}</p>
                <p>Required Permission: Document Verification</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        {isAuthorized && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DocumentCheckIcon className="w-5 h-5 mr-2" />
              Land Document Verification
            </CardTitle>
            <CardDescription>
              Verify land ownership documents and mint NFTs to rightful owners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompleteWorkflow} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land Owner Address *
                  </label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={documentForm.ownerAddress}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, ownerAddress: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number
                  </label>
                  <Input
                    type="text"
                    placeholder="DOC-2024-001"
                    value={documentForm.documentNumber}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <Input
                    type="text"
                    placeholder="Lagos, Nigeria"
                    value={documentForm.location}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size *
                  </label>
                  <Input
                    type="text"
                    placeholder="1000 sqm"
                    value={documentForm.size}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, size: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={documentForm.landType}
                    onChange={(e) => setDocumentForm(prev => ({ ...prev, landType: e.target.value }))}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Mixed Use">Mixed Use</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Additional details about the land property..."
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifying || isMinting || !getNextAvailableImage()}
                className="w-full"
              >
                {isVerifying || isMinting ? (
                  <>
                    <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                    {isVerifying ? 'Verifying Document...' : 'Minting NFT...'}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Verify Document & Mint NFT
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </AdminAccessWrapper>

      {/* Verified Documents */}
      {verifiedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
              Verified Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verifiedDocuments.map((doc, index) => (
                <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">{doc.location}</h4>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <div>Size: {doc.size}</div>
                    <div>Type: {doc.landType}</div>
                    <div>Owner: {doc.ownerAddress?.slice(0, 6)}...{doc.ownerAddress?.slice(-4)}</div>
                    <div>Date: {new Date(doc.verificationDate).toLocaleDateString()}</div>
                  </div>

                  {isAuthorized && showMintSection && (
                    <Button
                      onClick={() => handleMintNFT(doc)}
                      disabled={isMinting}
                      className="mt-3 w-full"
                      size="sm"
                    >
                      {isMinting ? 'Minting...' : 'Mint NFT to Owner'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Land NFTs */}
      {ownedLandNFTs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HomeIcon className="w-5 h-5 mr-2" />
              Your Land NFTs
            </CardTitle>
            <CardDescription>
              NFTs representing your verified land properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedLandNFTs.map((nft) => (
                <div key={nft.nft_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">NFT #{nft.nft_id}</h4>
                    <Badge>Owned</Badge>
                  </div>
                  
                  {nft.metadata && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {nft.metadata.properties?.location || 'Location not specified'}
                      </div>
                      <div>Size: {nft.metadata.properties?.size || 'Size not specified'}</div>
                      <div>Type: {nft.metadata.properties?.land_type || 'Type not specified'}</div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Minted: {new Date(nft.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Listing Form */}
      {ownedLandNFTs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              List NFT on Marketplace
            </CardTitle>
            <CardDescription>
              List your land NFTs for sale on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleListNFT} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token ID
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={listingForm.tokenId}
                    onChange={(e) => setListingForm(prev => ({ ...prev, tokenId: e.target.value }))}
                    required
                  >
                    <option value="">Select NFT to list</option>
                    {ownedLandNFTs.map((nft) => (
                      <option key={nft.nft_id} value={nft.nft_id}>
                        NFT #{nft.nft_id} - {nft.metadata?.properties?.location || 'Unknown Location'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (ETH)
                  </label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="1.5"
                    value={listingForm.price}
                    onChange={(e) => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isListing}
                className="w-full"
              >
                {isListing ? (
                  <>
                    <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                    Listing on Marketplace...
                  </>
                ) : (
                  <>
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    List on Marketplace
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Access Control Message */}
      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Admin Access Required</h3>
            <p className="text-orange-700 mb-4">
              Only authorized administrators can verify land documents and mint NFTs.
              You can view your owned NFTs and list them on the marketplace.
            </p>
            <div className="text-sm text-orange-600 bg-orange-100 rounded-lg p-3">
              <p><strong>Current Status:</strong> Regular User</p>
              <p><strong>Required Role:</strong> Administrator</p>
              <p><strong>Contact:</strong> System administrator for access</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insufficient Permissions Message */}
      {isAdmin && !isAuthorized && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Insufficient Permissions</h3>
            <p className="text-yellow-700 mb-4">
              Your admin account does not have sufficient permissions for land verification.
            </p>
            <div className="text-sm text-yellow-600 bg-yellow-100 rounded-lg p-3">
              <p><strong>Admin Level:</strong> {adminLevel}</p>
              <p><strong>Document Verification:</strong> {canVerifyDocuments ? '✅ Granted' : '❌ Required'}</p>
              <p><strong>NFT Minting:</strong> {canMintNFTs ? '✅ Granted' : '❌ Required'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
