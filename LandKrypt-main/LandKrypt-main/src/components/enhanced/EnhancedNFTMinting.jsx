// Enhanced NFT Minting Component
// Supports batch minting and gas optimization features

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { useGasOptimizedNFT } from '../../hooks/useEnhancedContracts';
import { useEnhancedTierSystem } from '../../hooks/useEnhancedTierSystem';
import { toast } from 'react-hot-toast';
import { parseEther, formatEther } from 'viem';
import { 
  Zap, 
  Plus, 
  Minus, 
  Info, 
  Star, 
  MapPin, 
  Home, 
  TrendingUp,
  Sparkles,
  Clock,
  DollarSign
} from 'lucide-react';

const PROPERTY_TYPES = {
  1: { name: 'Villa', icon: Home, color: 'bg-blue-500' },
  2: { name: 'Apartment', icon: Home, color: 'bg-green-500' },
  3: { name: 'Commercial', icon: TrendingUp, color: 'bg-purple-500' },
  4: { name: 'Land', icon: MapPin, color: 'bg-yellow-500' },
};

const LOCATIONS = {
  1: { name: 'Lagos', country: 'Nigeria' },
  2: { name: 'Abuja', country: 'Nigeria' },
  3: { name: 'Kano', country: 'Nigeria' },
  4: { name: 'Port Harcourt', country: 'Nigeria' },
};

const RARITY_LEVELS = {
  1: { name: 'Common', color: 'bg-gray-500', multiplier: 1.0 },
  2: { name: 'Uncommon', color: 'bg-green-500', multiplier: 1.2 },
  3: { name: 'Rare', color: 'bg-blue-500', multiplier: 1.5 },
  4: { name: 'Epic', color: 'bg-purple-500', multiplier: 2.0 },
  5: { name: 'Legendary', color: 'bg-yellow-500', multiplier: 3.0 },
};

export default function EnhancedNFTMinting() {
  const { 
    mintNFT, 
    batchMintNFTs, 
    isLoading, 
    canBatchMint, 
    maxBatchSize 
  } = useGasOptimizedNFT();
  
  const { 
    currentTier, 
    getTierBenefits, 
    canAccessFeature 
  } = useEnhancedTierSystem();

  const [mintMode, setMintMode] = useState('single');
  const [batchCount, setBatchCount] = useState(1);
  const [formData, setFormData] = useState({
    recipient: '',
    price: '',
    propertyType: 1,
    location: 1,
    rarity: 1,
    royaltyFee: 250, // 2.5%
    metadataURI: '',
  });
  const [batchForms, setBatchForms] = useState([{ ...formData }]);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [gasSavings, setGasSavings] = useState(null);

  const tierBenefits = getTierBenefits();

  // Update batch forms when count changes
  useEffect(() => {
    if (batchCount > batchForms.length) {
      const newForms = [...batchForms];
      for (let i = batchForms.length; i < batchCount; i++) {
        newForms.push({ ...formData });
      }
      setBatchForms(newForms);
    } else if (batchCount < batchForms.length) {
      setBatchForms(batchForms.slice(0, batchCount));
    }
  }, [batchCount, batchForms.length]);

  // Calculate gas estimates
  useEffect(() => {
    if (mintMode === 'batch' && batchCount > 1) {
      const singleGas = 120000; // Optimized single mint gas
      const batchGas = 800000; // Batch mint gas for 10 NFTs
      const estimatedBatchGas = Math.floor(batchGas * (batchCount / 10));
      const estimatedSingleGas = singleGas * batchCount;
      const savings = estimatedSingleGas - estimatedBatchGas;
      const savingsPercentage = Math.floor((savings / estimatedSingleGas) * 100);

      setGasEstimate(estimatedBatchGas);
      setGasSavings({
        absolute: savings,
        percentage: savingsPercentage,
        singleTotal: estimatedSingleGas,
      });
    } else {
      setGasEstimate(120000);
      setGasSavings(null);
    }
  }, [mintMode, batchCount]);

  const handleInputChange = (field, value, index = null) => {
    if (index !== null) {
      // Batch form update
      const newForms = [...batchForms];
      newForms[index] = { ...newForms[index], [field]: value };
      setBatchForms(newForms);
    } else {
      // Single form update
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSingleMint = async () => {
    try {
      if (!formData.recipient || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      const propertyData = {
        price: parseEther(formData.price),
        propertyType: formData.propertyType,
        location: formData.location,
        rarity: formData.rarity,
        attributes: 0, // Can be expanded for additional attributes
        timestamp: Math.floor(Date.now() / 1000),
      };

      await mintNFT(
        formData.recipient,
        formData.metadataURI || `ipfs://default-${Date.now()}`,
        propertyData,
        formData.royaltyFee
      );

      // Reset form
      setFormData({
        recipient: '',
        price: '',
        propertyType: 1,
        location: 1,
        rarity: 1,
        royaltyFee: 250,
        metadataURI: '',
      });

      toast.success('NFT minted successfully!');
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint NFT');
    }
  };

  const handleBatchMint = async () => {
    try {
      if (!canBatchMint) {
        toast.error('Batch minting requires tier 2 or higher');
        return;
      }

      const batchData = batchForms.map((form, index) => ({
        to: form.recipient,
        uri: form.metadataURI || `ipfs://batch-${Date.now()}-${index}`,
        propertyData: {
          price: parseEther(form.price),
          propertyType: form.propertyType,
          location: form.location,
          rarity: form.rarity,
          attributes: 0,
          timestamp: Math.floor(Date.now() / 1000),
        },
        royaltyFee: form.royaltyFee,
      }));

      await batchMintNFTs(batchData);

      // Reset forms
      setBatchForms([{ ...formData }]);
      setBatchCount(1);

      toast.success(`${batchCount} NFTs minted successfully!`);
    } catch (error) {
      console.error('Batch minting error:', error);
      toast.error('Failed to batch mint NFTs');
    }
  };

  const renderPropertyForm = (data, index = null) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`recipient-${index}`}>Recipient Address</Label>
          <Input
            id={`recipient-${index}`}
            placeholder="0x..."
            value={data.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value, index)}
          />
        </div>
        <div>
          <Label htmlFor={`price-${index}`}>Price (ETH)</Label>
          <Input
            id={`price-${index}`}
            type="number"
            step="0.001"
            placeholder="0.0"
            value={data.price}
            onChange={(e) => handleInputChange('price', e.target.value, index)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`propertyType-${index}`}>Property Type</Label>
          <Select
            value={data.propertyType.toString()}
            onValueChange={(value) => handleInputChange('propertyType', parseInt(value), index)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROPERTY_TYPES).map(([id, type]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`location-${index}`}>Location</Label>
          <Select
            value={data.location.toString()}
            onValueChange={(value) => handleInputChange('location', parseInt(value), index)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOCATIONS).map(([id, location]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {location.name}, {location.country}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`rarity-${index}`}>Rarity</Label>
          <Select
            value={data.rarity.toString()}
            onValueChange={(value) => handleInputChange('rarity', parseInt(value), index)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RARITY_LEVELS).map(([id, rarity]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${rarity.color}`} />
                    {rarity.name}
                    <Badge variant="outline">{rarity.multiplier}x</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`royalty-${index}`}>Royalty Fee (%)</Label>
          <Input
            id={`royalty-${index}`}
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={data.royaltyFee / 100}
            onChange={(e) => handleInputChange('royaltyFee', parseFloat(e.target.value) * 100, index)}
          />
        </div>
        <div>
          <Label htmlFor={`metadata-${index}`}>Metadata URI (Optional)</Label>
          <Input
            id={`metadata-${index}`}
            placeholder="ipfs://..."
            value={data.metadataURI}
            onChange={(e) => handleInputChange('metadataURI', e.target.value, index)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Enhanced NFT Minting
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Tier {currentTier}
            </Badge>
            {canBatchMint && (
              <Badge className="flex items-center gap-1 bg-green-500">
                <Zap className="w-3 h-3" />
                Batch Enabled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tier Benefits Display */}
        {tierBenefits && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-500" />
                Your Tier Benefits
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>Max Batch: {tierBenefits.maxBatchMintSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span>Fee Discount: {tierBenefits.marketplaceFeeDiscount}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span>Royalty Bonus: +{tierBenefits.royaltyBonus}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Priority: {tierBenefits.priorityProcessing ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minting Mode Selection */}
        <Tabs value={mintMode} onValueChange={setMintMode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Mint</TabsTrigger>
            <TabsTrigger value="batch" disabled={!canBatchMint}>
              Batch Mint
              {!canBatchMint && (
                <Badge variant="outline" className="ml-2">Tier 2+</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            {renderPropertyForm(formData)}
            
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Estimated Gas: ~{gasEstimate?.toLocaleString()} units
                </div>
              </div>
              <Button 
                onClick={handleSingleMint} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Mint NFT
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            {/* Batch Size Control */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label>Batch Size</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                      disabled={batchCount <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{batchCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchCount(Math.min(maxBatchSize, batchCount + 1))}
                      disabled={batchCount >= maxBatchSize}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={(batchCount / maxBatchSize) * 100} className="mb-2" />
                <p className="text-sm text-gray-600">
                  {batchCount} of {maxBatchSize} maximum NFTs
                </p>
              </CardContent>
            </Card>

            {/* Gas Savings Display */}
            {gasSavings && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                    <Zap className="w-4 h-4" />
                    Gas Optimization
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Individual Mints</p>
                      <p className="font-semibold">{gasSavings.singleTotal.toLocaleString()} gas</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Batch Mint</p>
                      <p className="font-semibold text-green-600">{gasEstimate.toLocaleString()} gas</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Savings</p>
                      <p className="font-semibold text-green-600">
                        {gasSavings.percentage}% ({gasSavings.absolute.toLocaleString()} gas)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Batch Forms */}
            <div className="space-y-4">
              {batchForms.map((form, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">NFT #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderPropertyForm(form, index)}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Estimated Gas: ~{gasEstimate?.toLocaleString()} units
                  {gasSavings && (
                    <Badge className="bg-green-500">
                      {gasSavings.percentage}% savings
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={handleBatchMint}
                disabled={isLoading || batchForms.some(form => !form.recipient || !form.price)}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Batch Minting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Batch Mint {batchCount} NFTs
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
