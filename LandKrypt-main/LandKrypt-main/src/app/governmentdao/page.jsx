"use client";
import React from "react";
import { ChevronDown, Twitter, Instagram, Linkedin, Shield, AlertTriangle } from "lucide-react";
import Header, { Logo } from "@/components/Header";
import ProposalsSection from "./components/Proposals";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/GradientButton";
import { useDeveloperStatus } from "@/hooks/useDeveloperStatus";
import { useContractOperations } from "@/hooks/useContractOperations";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { formatEther } from "viem";

const GovernanceDAO = () => {
  const { isConnected } = useAccount();
  const { 
    isRegisteredDeveloper, 
    developerFee, 
    isCheckingStatus, 
    refetchStatus 
  } = useDeveloperStatus();
  const { registerDeveloper } = useContractOperations();
  
  const features = [
    {
      id: "01",
      title: "Earn Voting Power",
      description:
        "Stake LXRT tokens to earn voting power and participate in governance decisions.",
    },
    {
      id: "02",
      title: "Vote on Proposals",
      description:
        "Review and vote on development proposals. Each LXRT staked represents one vote.",
    },
    {
      id: "03",
      title: "Earn Rewards",
      description:
        "Earn rewards for participating in governance and helping shape the future.",
    },
  ];
  
  const handleDeveloperRegistration = async () => {
    try {
      await registerDeveloper();
      toast.success('Developer registration submitted! Please wait for confirmation.');
      setTimeout(() => refetchStatus(), 5000);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07000b] via-[#06000b] to-black overflow-x-hidden text-white relative">
      {/* Header */}
      <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
        <Header />
      </div>

      {/* Main Content */}
      <main className="px-6 py-28">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Governance DAO
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Participate in decentralized decision making for land development
          </p>
          
          {/* Developer Status Banner */}
          {isConnected && (
            <div className="mt-8 max-w-2xl mx-auto">
              {isCheckingStatus ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-300">Checking developer status...</span>
                  </div>
                </div>
              ) : !isRegisteredDeveloper ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <h3 className="text-white font-semibold">Register as Developer</h3>
                        <p className="text-gray-400 text-sm">
                          Registration required to create proposals • Fee: {developerFee ? formatEther(developerFee) : '0.01'} ETH
                        </p>
                      </div>
                    </div>
                    <GradientButton
                      onClick={handleDeveloperRegistration}
                      gradientFrom="bg-gradient-to-r from-purple-500"
                      gradientTo="to-purple-700"
                      className="px-4 py-2 text-sm"
                    >
                      Register Now
                    </GradientButton>
                  </div>
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-semibold">✓ Registered Developer</span>
                    <span className="text-gray-400 text-sm">You can create proposals</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How Governance Works Section */}
        <div className="mb-5 w-full">
          {/* Mobile Create Proposal Button - Only show for registered developers */}
          {isConnected && isRegisteredDeveloper && (
            <div className="w-full flex md:hidden pb-4">
              <GradientButton className="px-6 py-2 font-semibold text-sm">
                Create Proposals
              </GradientButton>
            </div>
          )}
          
          <div className="md:flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">How Governance Works</h2>
            <div className="md:flex items-center space-x-4">
              <div className="text-sm text-gray-400">21.97 LXRT</div>
              {/* Desktop Create Proposal Button - Only show for registered developers */}
              {isConnected && isRegisteredDeveloper && (
                <GradientButton className="hidden md:block">
                  Create Proposals
                </GradientButton>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {features.map((feature) => (
              <div key={feature.id} className="bg-gray-800 p-6 rounded-lg space-y-1">
                <div className="text-orange-400 text-sm font-semibold mb-4 bg-neutral-900/40 inline p-2 rounded-md">
                  {feature.id}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Proposals Section */}
        <ProposalsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GovernanceDAO;
