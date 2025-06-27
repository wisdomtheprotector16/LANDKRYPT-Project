"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import Link from "next/link";
import { GradientButton } from "./GradientButton";
import { GradientButton2 } from "./GradientButton2";
import SwapModal from "./SwapModal";
// import StatItem from "@/components/StatItem"; // adjust the path if needed

const StatItem = ({ value, label, color = "text-white" }) => {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>
        {value}
        <span className="text-yellow-400">+</span>
      </div>
      <div className="text-gray-200">{label}</div>
    </div>
  );
};

const Hero = () => {
  const [showSwapPopUp, setshowSwapPopUp] = useState(false);
  return (
    <div className="relative min-h-screen overflow-hidden py-9 bg-black">
      <div className="absolute top-0">
        {" "}
        {showSwapPopUp && <SwapModal onClose={() => setshowSwapPopUp(false)} />}
      </div>
      <img
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        src="/images/hero.png"
        alt="hero image"
      />

      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div
            onClick={() => {
              setshowSwapPopUp(true); // Fixed this line
            }}
            className="inline-flex items-center gap-x-2 border border-yellow-400 text-xs text-gray-200  p-2 px-3 rounded-full transition hover:border-gray-300 focus:outline-hidden focus:border-gray-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:focus:border-neutral-600"
          >
            <span className="border-s border-gray-200 text-white dark:border-neutral-700 bg-amber-600 px-2 py-1 rounded-2xl">
              LandKrypt
            </span>
            <span className="underline"> Swap your ETH to LKUSD</span>
            <span className="flex items-center gap-x-1">
              <svg
                width="20"
                height="18"
                viewBox="0 0 20 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.16667 9H15.8333M15.8333 9L10 3.75M15.8333 9L10 14.25"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Beyond Play:
            <br />
            Own The World
          </h1>

          <p className="text-[10px] md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Fractional NFT ownership turns virtual real estate into your
            personal asset. Stake, Vote, and Reap Rewards as the property
            develops. Stake to Own.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <div className="flex items-center">
              <Link href="/marketplace">
                <GradientButton>Explore Marketplace</GradientButton>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <StatItem value="24" label="Properties Fractionalized" />
            <StatItem value="20,000" label="Investors" />
            <div className="max-md:col-span-2">
              <StatItem value="20" label="Properties" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
