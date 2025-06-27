import { create } from 'zustand';

export const useMarketplaceStore = create((set) => ({
  // Current step tracking (now 5 steps)
  currentStep: 1,
  
  // Document upload state
  dragOver: false,
  uploadedFiles: [],
  
  // Verification status
  verificationStatus: 'pending', // 'pending', 'verifying', 'verified', 'failed'
  
  // Property details (new fields)
  propertyDetails: {
    title: '',
    location: '',
    size: '',
    estimatedValue: '',
    description: '',
    mintAsNFT: true,
    listOnMarketplace: false
  },
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  setDragOver: (status) => set({ dragOver: status }),
  setUploadedFiles: (files) => set({ uploadedFiles: files }),
  
  // Property details actions
  setPropertyDetails: (details) => set((state) => ({
    propertyDetails: { ...state.propertyDetails, ...details }
  })),
  toggleMintOption: () => set((state) => ({
    propertyDetails: {
      ...state.propertyDetails,
      mintAsNFT: !state.propertyDetails.mintAsNFT
    }
  })),
  toggleListingOption: () => set((state) => ({
    propertyDetails: {
      ...state.propertyDetails,
      listOnMarketplace: !state.propertyDetails.listOnMarketplace
    }
  })),
  
  // Verification actions
  startVerification: () => set({ verificationStatus: 'verifying' }),
  completeVerification: () => set({ verificationStatus: 'verified' }),
  failVerification: () => set({ verificationStatus: 'failed' }),
  
  // Navigation actions
  handleNext: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 5) // Now 5 steps total
  })),
  handleBack: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
}));