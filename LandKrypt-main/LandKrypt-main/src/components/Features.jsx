import React from "react";
import { Card, CardContent } from "./ui/card";
import { FiShield, FiLock, FiGlobe, FiBarChart2 } from "react-icons/fi";
import SemiFeatures from "./SemiFeatures";
import Timeline from "./Timeline";

const features = [
  {
    icon: <FiShield className="w-8 h-8 text-white" />,
    title: "Secure Ownership",
    description:
      "Immutable blockchain records ensure your property rights are protected and verifiable.",
  },
  {
    icon: <FiLock className="w-8 h-8 text-white" />,
    title: "Fraud Prevention",
    description:
      "Eliminate title fraud with transparent transaction history and smart contract verification.",
  },
  {
    icon: <FiGlobe className="w-8 h-8 text-white" />,
    title: "Global Access",
    description:
      "Manage and verify properties from anywhere in the world with our decentralized platform.",
  },
  {
    icon: <FiBarChart2 className="w-8 h-8 text-white" />,
    title: "Increased Liquidity",
    description:
      "Tokenization enables fractional ownership and opens new investment opportunities.",
  },
];

const Features = () => {
  return (
    <div className="text-white md:px-7 px-5">
      <SemiFeatures />
      <h2 className="text-4xl md:text-5xl font-bold  mb-5">Why LandKrypt?</h2>
      <p className="md:max-w-[80%]">
        LandKrpty redefines digital ownership by blending real-world
        verification, community governance, and profit-driveninvestment into one
        powerful platform. Whether you’re securing virtual developments,
        LandKrpt puts control and value in your hands.
      </p>

      <Timeline />
      <section className="relative z-10 md:px-6 py-6 md:py-20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
