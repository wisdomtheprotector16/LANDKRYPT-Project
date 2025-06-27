"use client";
import { CheckCircle } from "lucide-react";
import { useMarketplaceStore } from "@/stores/useMarketplaceStore";
import { GradientButton } from "@/components/GradientButton";

export const CompleteStep = () => {
  const { handleNext } = useMarketplaceStore();

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
          {/* <CheckCircle className="w-16 h-16 text-green-500" /> */}
          <img src="/icons/celebrate.png" className="w-16 h-16" alt="" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">
        Verification Request Submitted!
      </h2>

      <p className="text-gray-300 mb-8 max-w-md mx-auto">
        Your document has been submitted for verification. This process
        typically
        <br />
        takes 24-48 hours to complete.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 ">
        <div>
          <GradientButton
            onClick={() => {
              // Reset the process to verify another property
              // You might want to add a reset function to your store
              window.location.reload();
            }}
            className=""
          >
            Verify Another Property
          </GradientButton>
        </div>

        <div>
          <GradientButton
            gradientFrom=""
            gradientTo=""
            onClick={() => {
              // Navigate to dashboard
              // You'll need to implement your navigation logic here
              // console.log("Navigate to dashboard");
            }}
            className="border border-amber-500 "
          >
            View Status in Dashboard
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
