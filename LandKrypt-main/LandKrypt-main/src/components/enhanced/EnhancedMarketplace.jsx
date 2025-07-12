// Enhanced Marketplace Component
// Supports fixed price, Dutch auctions, English auctions, and offers

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useEnhancedMarketplace } from '../../hooks/useEnhancedContracts';
import { useEnhancedTierSystem } from '../../hooks/useEnhancedTierSystem';
import { toast } from 'react-hot-toast';
import { parseEther, formatEther } from 'viem';
import { 
  ShoppingCart, 
  Gavel, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Star,
  Zap,
  Heart,
  Eye,
  Timer,
  Percent,
  Gift,
  AlertCircle
} from 'lucide-react';

const LISTING_TYPES = {
  FIXED_PRICE: { name: 'Fixed Price', icon: DollarSign, color: 'bg-blue-500' },
  DUTCH_AUCTION: { name: 'Dutch Auction', icon: TrendingDown, color: 'bg-orange-500' },
  ENGLISH_AUCTION: { name: 'English Auction', icon: TrendingUp, color: 'bg-green-500' },
};

const CURRENCIES = {
  ETH: { name: 'ETH', address: '0x0000000000000000000000000000000000000000', symbol: 'ETH' },
  LKST: { name: 'LandKrypt Token', address: process.env.NEXT_PUBLIC_MOCK_ERC20, symbol: 'LKST' },
};

export default function EnhancedMarketplace() {
  const {
    createListing,
    createDutchAuction,
    purchaseNFT,
    makeOffer,
    acceptOffer,
    getCurrentDutchPrice,
    calculateFeeWithDiscount,
    isLoading,
    canCreateAuctions,
    canMakeOffers,
    feeDiscount,
  } = useEnhancedMarketplace();

  const {
    currentTier,
    getTierBenefits,
    canAccessFeature,
  } = useEnhancedTierSystem();

  const [activeTab, setActiveTab] = useState('browse');
  const [listingForm, setListingForm] = useState({
    nftContract: '',
    tokenId: '',
    listingType: 'FIXED_PRICE',
    price: '',
    startPrice: '',
    endPrice: '',
    duration: '7', // days
    currency: 'ETH',
  });
  const [offerForm, setOfferForm] = useState({
    nftContract: '',
    tokenId: '',
    amount: '',
    currency: 'ETH',
    expiry: '7', // days
  });
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [mockListings, setMockListings] = useState([]);

  const tierBenefits = getTierBenefits();

  // Mock data for demonstration
  useEffect(() => {
    setMockListings([
      {
        id: 1,
        nftContract: '0x123...',
        tokenId: 1,
        seller: '0xabc...',
        type: 'FIXED_PRICE',
        price: '2.5',
        currency: 'ETH',
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        image: '/api/placeholder/300/300',
        name: 'Lagos Villa #1',
        location: 'Lagos, Nigeria',
        rarity: 'Rare',
      },
      {
        id: 2,
        nftContract: '0x456...',
        tokenId: 2,
        seller: '0xdef...',
        type: 'DUTCH_AUCTION',
        startPrice: '5.0',
        currentPrice: '3.2',
        endPrice: '1.0',
        currency: 'ETH',
        endTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
        image: '/api/placeholder/300/300',
        name: 'Abuja Commercial #2',
        location: 'Abuja, Nigeria',
        rarity: 'Epic',
      },
    ]);
  }, []);

  const handleInputChange = (field, value) => {
    setListingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOfferInputChange = (field, value) => {
    setOfferForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateListing = async () => {
    try {
      const { nftContract, tokenId, listingType, price, startPrice, endPrice, duration, currency } = listingForm;

      if (!nftContract || !tokenId || !price) {
        toast.error('Please fill in all required fields');
        return;
      }

      const durationSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds
      const currencyAddress = CURRENCIES[currency].address;

      if (listingType === 'FIXED_PRICE') {
        await createListing(
          nftContract,
          parseInt(tokenId),
          parseEther(price),
          currencyAddress,
          durationSeconds
        );
      } else if (listingType === 'DUTCH_AUCTION') {
        if (!startPrice || !endPrice) {
          toast.error('Please provide start and end prices for Dutch auction');
          return;
        }
        await createDutchAuction(
          nftContract,
          parseInt(tokenId),
          parseEther(startPrice),
          parseEther(endPrice),
          durationSeconds
        );
      }

      // Reset form
      setListingForm({
        nftContract: '',
        tokenId: '',
        listingType: 'FIXED_PRICE',
        price: '',
        startPrice: '',
        endPrice: '',
        duration: '7',
        currency: 'ETH',
      });

      toast.success('Listing created successfully!');
    } catch (error) {
      console.error('Create listing error:', error);
      toast.error('Failed to create listing');
    }
  };

  const handleMakeOffer = async () => {
    try {
      const { nftContract, tokenId, amount, currency, expiry } = offerForm;

      if (!nftContract || !tokenId || !amount) {
        toast.error('Please fill in all required fields');
        return;
      }

      const expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(expiry) * 24 * 60 * 60);
      const currencyAddress = CURRENCIES[currency].address;

      await makeOffer(
        nftContract,
        parseInt(tokenId),
        parseEther(amount),
        currencyAddress,
        expiryTimestamp
      );

      setShowOfferDialog(false);
      setOfferForm({
        nftContract: '',
        tokenId: '',
        amount: '',
        currency: 'ETH',
        expiry: '7',
      });

      toast.success('Offer made successfully!');
    } catch (error) {
      console.error('Make offer error:', error);
      toast.error('Failed to make offer');
    }
  };

  const handlePurchase = async (listing) => {
    try {
      const currencyAddress = CURRENCIES[listing.currency].address;
      
      await purchaseNFT(
        listing.id,
        listing.nftContract,
        listing.tokenId,
        currencyAddress
      );

      toast.success('Purchase successful!');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase NFT');
    }
  };

  const renderListingCard = (listing) => {
    const feeInfo = calculateFeeWithDiscount(parseFloat(listing.price || listing.currentPrice));
    const timeLeft = Math.max(0, listing.endTime - Date.now());
    const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    return (
      <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={listing.image} 
            alt={listing.name}
            className="w-full h-48 object-cover"
          />
          <Badge 
            className={`absolute top-2 left-2 ${LISTING_TYPES[listing.type].color}`}
          >
            <LISTING_TYPES[listing.type].icon className="w-3 h-3 mr-1" />
            {LISTING_TYPES[listing.type].name}
          </Badge>
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 bg-white"
          >
            {listing.rarity}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{listing.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {listing.location}
              </p>
            </div>

            <div className="space-y-2">
              {listing.type === 'DUTCH_AUCTION' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-semibold text-lg text-orange-600">
                      {listing.currentPrice} {listing.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">End Price: {listing.endPrice} {listing.currency}</span>
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="font-semibold text-lg">
                    {listing.price} {listing.currency}
                  </span>
                </div>
              )}

              {feeDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Your Fee Discount
                  </span>
                  <span className="text-green-600 font-semibold">
                    -{feeDiscount}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Time Left
                </span>
                <span>
                  {daysLeft > 0 ? `${daysLeft}d ` : ''}{hoursLeft}h
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => handlePurchase(listing)}
                disabled={isLoading}
                className="flex-1 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy Now
              </Button>
              
              {canMakeOffers && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedNFT(listing);
                    setOfferForm(prev => ({
                      ...prev,
                      nftContract: listing.nftContract,
                      tokenId: listing.tokenId.toString(),
                    }));
                    setShowOfferDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Offer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-6 h-6 text-purple-500" />
              Enhanced Marketplace
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Tier {currentTier}
              </Badge>
              {feeDiscount > 0 && (
                <Badge className="flex items-center gap-1 bg-green-500">
                  <Percent className="w-3 h-3" />
                  {feeDiscount}% Fee Discount
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tier Benefits */}
      {tierBenefits && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-500" />
              Your Marketplace Benefits
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-green-500" />
                <span>Fee Discount: {tierBenefits.marketplaceFeeDiscount}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-blue-500" />
                <span>Auctions: {canCreateAuctions ? 'Enabled' : 'Tier 3+'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Offers: {canMakeOffers ? 'Enabled' : 'Tier 2+'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Priority: {tierBenefits.priorityProcessing ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Listings</TabsTrigger>
          <TabsTrigger value="create">Create Listing</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockListings.map(renderListingCard)}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nftContract">NFT Contract Address</Label>
                  <Input
                    id="nftContract"
                    placeholder="0x..."
                    value={listingForm.nftContract}
                    onChange={(e) => handleInputChange('nftContract', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    type="number"
                    placeholder="1"
                    value={listingForm.tokenId}
                    onChange={(e) => handleInputChange('tokenId', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="listingType">Listing Type</Label>
                <Select
                  value={listingForm.listingType}
                  onValueChange={(value) => handleInputChange('listingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_PRICE">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Fixed Price
                      </div>
                    </SelectItem>
                    <SelectItem value="DUTCH_AUCTION" disabled={!canCreateAuctions}>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Dutch Auction
                        {!canCreateAuctions && (
                          <Badge variant="outline" className="ml-2">Tier 3+</Badge>
                        )}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {listingForm.listingType === 'FIXED_PRICE' ? (
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={listingForm.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startPrice">Start Price</Label>
                    <Input
                      id="startPrice"
                      type="number"
                      step="0.001"
                      placeholder="5.0"
                      value={listingForm.startPrice}
                      onChange={(e) => handleInputChange('startPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endPrice">End Price</Label>
                    <Input
                      id="endPrice"
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      value={listingForm.endPrice}
                      onChange={(e) => handleInputChange('endPrice', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={listingForm.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([key, currency]) => (
                        <SelectItem key={key} value={key}>
                          {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="30"
                    value={listingForm.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateListing}
                disabled={isLoading}
                className="w-full flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    Create Listing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNFT && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <img 
                  src={selectedNFT.image} 
                  alt={selectedNFT.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{selectedNFT.name}</h3>
                  <p className="text-sm text-gray-600">{selectedNFT.location}</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="offerAmount">Offer Amount</Label>
              <Input
                id="offerAmount"
                type="number"
                step="0.001"
                placeholder="0.0"
                value={offerForm.amount}
                onChange={(e) => handleOfferInputChange('amount', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offerCurrency">Currency</Label>
                <Select
                  value={offerForm.currency}
                  onValueChange={(value) => handleOfferInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([key, currency]) => (
                      <SelectItem key={key} value={key}>
                        {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="offerExpiry">Expiry (Days)</Label>
                <Input
                  id="offerExpiry"
                  type="number"
                  min="1"
                  max="30"
                  value={offerForm.expiry}
                  onChange={(e) => handleOfferInputChange('expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowOfferDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMakeOffer}
                disabled={isLoading}
                className="flex-1 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Making Offer...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Make Offer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
