import React from "react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "./GradientButton";

export default function CTA() {
  return (
    <div className=" flex items-center justify-center p-4 mb-6">
      {/* Grid pattern overlay */}
      <div
        className="absolute  opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 bg-neutral-900/80 p-16 rounded-3xl max-w-4xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Ready to transform Land
          <br />
          Ownership?
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Join property owners and investors from Lagos to Dubai already using
          LandKrypt to secure, verify, and trade land assets globally.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <GradientButton>Verify My Land</GradientButton>
            <GradientButton className="border border-amber-500 " gradientFrom="" gradientTo="">
              Verify My Land
            </GradientButton>
          </div>
          {/* <Button 
            variant="outline"
            className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-3 text-lg font-semibold rounded-md transition-all duration-200 transform hover:scale-105 bg-transparent"
            size="lg"
          >
            Explore Properties
          </Button> */}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-purple-400 opacity-30 rounded-full"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 border border-indigo-400 opacity-20 rounded-full"></div>
      <div className="absolute top-1/3 right-10 w-12 h-12 border border-purple-300 opacity-25 rounded-full"></div>
    </div>
  );
}
