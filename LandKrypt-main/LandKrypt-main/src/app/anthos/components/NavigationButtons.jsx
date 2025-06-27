import { GradientButton } from "@/components/GradientButton";

export const NavigationButtons = ({
  currentStep,
  handleBack,
  handleNext,
  totalSteps,
}) => {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  // Return nothing when it's the last step (step 4)
  if (isLastStep) {
    return null;
  }

  return (
    <div className="flex justify-between items-center mt-12  mx-auto">
      {/* Back Button */}
      <div>
        <GradientButton
          // className="border border-amber-500 "
       
          onClick={handleBack}
          disabled={isFirstStep}
          className={` ${
            isFirstStep
            // ? "bg-gray-700 text-gray-200 cursor-not-allowed"
            // : "bg-gray-600 text-white hover:bg-gray-500"
          }`}
        >
          Back
        </GradientButton>
      </div>
      {/* Next Button */}
      <div>
        <GradientButton
          gradientFrom=""
          gradientTo=""
          onClick={handleNext}
          className="border border-amber-500"
        >
          Next
        </GradientButton>
      </div>
    </div>
  );
};
