"use client"
import { FileText } from 'lucide-react';

export const ProcessingStep = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <FileText className="w-24 h-24 text-blue-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-4">Processing Documents</h2>
      <p className="text-gray-300 mb-8">
        Creating your blockchain certificate and preparing NFT metadata. 
        Almost ready for minting!
      </p>
      <div className="animate-pulse">
        <div className="h-2 bg-blue-500 rounded-full w-48 mx-auto"></div>
      </div>
    </div>
  );
};