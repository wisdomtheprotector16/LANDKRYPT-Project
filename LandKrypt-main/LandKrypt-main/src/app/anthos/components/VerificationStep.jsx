"use client"
import { useMarketplaceStore } from '@/stores/useMarketplaceStore';

export const VerificationStep = () => {
  const { 
    propertyDetails, 
    setPropertyDetails,
    toggleMintOption,
    toggleListingOption,
    handleNext,
    handleBack 
  } = useMarketplaceStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPropertyDetails({ [name]: value });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-gray-300 mb-2">Property Title</label>
          <input
            type="text"
            name="title"
            value={propertyDetails.title}
            onChange={handleChange}
            placeholder="e.g. Oceanfront Villa"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={propertyDetails.location}
            onChange={handleChange}
            placeholder="e.g. Miami, FL"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Property Size</label>
          <input
            type="text"
            name="size"
            value={propertyDetails.size}
            onChange={handleChange}
            placeholder="e.g. 2.5 Villa"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">Estimated Value (LKUSD)</label>
          <input
            type="text"
            name="estimatedValue"
            value={propertyDetails.estimatedValue}
            onChange={handleChange}
            placeholder="e.g. 250000"
            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="mb-8">
        <label className="block text-gray-300 mb-2">Property Description</label>
        <textarea
          name="description"
          value={propertyDetails.description}
          onChange={handleChange}
          placeholder="Describe your property including key features, condition, etc."
          rows="4"
          className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500"
        />
      </div>
      
      <div className="flex flex-wrap gap-6 mb-8">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={propertyDetails.mintAsNFT}
            onChange={toggleMintOption}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-300"> Mint as NFT Verification</span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={propertyDetails.listOnMarketplace}
            onChange={toggleListingOption}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-300"> List On Marketplace After Minting</span>
        </label>
      </div>
      
      
    </div>
  );
};