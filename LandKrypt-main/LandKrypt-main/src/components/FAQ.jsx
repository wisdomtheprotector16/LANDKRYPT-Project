"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

const faqItems = [
  {
    question: "What is LandKrypt?",
    answer:
      "LandKrypt is a platform that enables users to own, invest in, and govern virtual real estate through fractional NFT ownership, staking, and DAO-based decision-making.",
  },
  {
    question: "How do I rank up and increase my tier?",
    answer:
      "Your rank increases by staking more assets, participating in governance, and engaging in verified land ownership. Higher tiers unlock exclusive benefits and voting power.",
  },
  {
    question: "How do I sell my land?",
    answer:
      "Once verified, your property NFT can be listed on the LandKrypt Marketplace with custom pricing and staking status.",
  },
  {
    question: "How do I create proposals?",
    answer:
      "Verified stakeholders with a minimum required voting power can draft and submit proposals through the DAO interface, where the community votes on key decisions.",
  },
  {
    question: "When do I get my return on stakes?",
    answer:
      "Returns are distributed periodically based on the performance of the property and the amount staked. You can track earnings and unlock rewards via the dashboard.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-8 w-full max-w-7xl mx-auto z-50">
      <div className="w-full px-4  ">
        <header className="text-left space-y-2 mx-auto w-full">
          <h2 className="text-4xl md:text-5xl font-bold">
            Frequently Asked Questions
          </h2>
          <p>
            Explore the most common questions about ownership, staking,
            verification, and governance—so you can move forward with
            confidence.
          </p>
        </header>
        <div className="w-full py-5">
          <div className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="w-full  backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden transition-all duration-300 hover:bg-gray-800/70"
              >
                <div
                  className="flex items-start justify-between p-6 cursor-pointer"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-orange-600 font-bold text-lg leading-none bg-neutral-700 p-4 rounded-md">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-orange-400 font-semibold text-lg leading-tight">
                      {item.question}
                    </h3>
                  </div>
                  <button className="text-orange-400 hover:text-orange-300 transition-colors ml-4">
                    {openIndex === index ? (
                      <X className="w-5 h-5 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                    )}
                  </button>
                </div>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openIndex === index ? "max-h-[500px]" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className="ml-8 text-gray-300 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
