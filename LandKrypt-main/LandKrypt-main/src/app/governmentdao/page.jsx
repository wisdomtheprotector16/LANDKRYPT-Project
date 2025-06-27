import React from "react";
import { ChevronDown, Twitter, Instagram, Linkedin } from "lucide-react";
import Header, { Logo } from "@/components/Header";
import ProposalsSection from "./components/Proposals";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/GradientButton";

const GovernanceDAO = () => {
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
        </div>

        {/* How Governance Works Section */}
        <div className="mb-5 w-full">
          <div className="w-full flex md:hidden pb-4">
            <GradientButton className="  px-6 py-2 font-semibold text-sm">
              Create Proposals
            </GradientButton>
          </div>
          <div className="md:flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">How Governance Works</h2>
            <div className="md:flex items-center space-x-4">
              <div className="text-sm text-gray-400">21.97 LXRT</div>
              <GradientButton className="hidden md:block ">
                Create Proposals
              </GradientButton>
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
