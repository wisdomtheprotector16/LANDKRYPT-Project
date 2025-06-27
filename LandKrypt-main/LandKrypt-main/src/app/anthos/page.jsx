"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import { UploadStep } from "./components/UploadStep";
import { VerificationStep } from "./components/VerificationStep";
import { ProcessingStep } from "./components/ProcessingStep";
import { CompleteStep } from "./components/CompleteStep";
import { NavigationButtons } from "./components/NavigationButtons";

import { Upload, FileText, Shield, CheckCircle } from "lucide-react";
import Header from "@/components/Header";

export const Stepper = ({ currentStep }) => {
  const steps = [
    { number: 1, title: "Upload", icon: Upload },
    { number: 2, title: "Verify", icon: Shield },
    { number: 3, title: "Process", icon: FileText },
    { number: 4, title: "Complete", icon: CheckCircle },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mb-8 lg:mb-12">
      {/* Desktop Stepper - Horizontal */}
      <div className=" md:block">
        <div className="relative flex justify-between items-center max-w-4xl mx-auto">
          {/* Progress Line Background */}
          <div className="w-[95%] absolute top-6 left-0 right-0 h-0.5 bg-gray-700 rounded-full " />

          {/* Animated Progress Line */}
          <motion.div
            className="absolute top-6   h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "33.33%"
                  : currentStep === 3
                  ? "66.66%"
                  : "95%",
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <motion.div
                key={step.number}
                className="relative flex flex-col items-center z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <motion.div
                  className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ease-out shadow-lg ${
                    isCompleted
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-500/30"
                      : isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-500/30"
                      : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.span
                  className={`mt-3 text-sm lg:text-base font-medium text-center transition-colors duration-300 ${
                    isActive || isCompleted ? "text-blue-400" : "text-gray-400"
                  }`}
                  animate={isActive ? { y: [0, -2, 0] } : { y: 0 }}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Infinity : 0,
                    repeatDelay: 2,
                  }}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper - Vertical */}
      {/* <div className="block md:hidden">
        <div className="relative flex flex-col items-center max-w-xs mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={step.number}
                className="relative flex items-center w-full"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ease-out shadow-lg ${
                      isCompleted
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-500/30"
                        : isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-500/30"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  {!isLast && (
                    <div className="relative mt-2 mb-2">
                      <div className="w-0.5 h-8 bg-gray-700 rounded-full" />
                      <motion.div
                        className="absolute top-0 left-0 w-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"
                        initial={{ height: "0%" }}
                        animate={{ 
                          height: isCompleted ? "100%" : "0%"
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <motion.span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isActive || isCompleted 
                        ? "text-blue-400" 
                        : "text-gray-400"
                    }`}
                    animate={isActive ? { x: [0, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
                  >
                    {step.title}
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div> */}
    </div>
  );
};

const Anthos = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const steps = [
    { number: 1, title: "Upload", icon: Upload },
    { number: 2, title: "Verify", icon: Shield },
    { number: 3, title: "Process", icon: FileText },
    { number: 4, title: "Complete", icon: CheckCircle },
  ];

  const stepContent = {
    1: {
      heading: "Upload Your Documents",
      details:
        "Upload legally valid land ownership documents",
    },
    2: {
      heading: "Submit  Details",
      details:
        "Provide additional information about your property",
    },
    3: {
      heading: "Processing Your Certificate",
      details:
        "We're creating your blockchain-backed land ownership certificate.",
    },
    4: {
      heading: "Verification Complete!",
      details:
        "Your land ownership has been successfully verified and recorded on the blockchain.",
    },
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07000b] via-[#06000b] to-black relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      {/* Header */}
      <div className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Header />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-20 sm:pt-24 lg:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title Section */}
          <motion.div
            className="text-center mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-white">
                Anthos
              </span>
            </motion.h1>
            <motion.p
              className="text-gray-300 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Anthos is our secure verification system that validates your land
              ownership documents and creates blockchain-backed certificates.
              Once verified, you can mint your land as an NFT and optionally
              list it on our marketplace.
            </motion.p>
          </motion.div>

          {/* Step Content Header */}
          <motion.div
            className="max-w-4xl mx-auto text-center mb-8 lg:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-gray-900/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8  ">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    {stepContent[currentStep].heading}
                  </h2>
                  <p className="text-gray-300 text-base sm:text-lg">
                    {stepContent[currentStep].details}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Stepper currentStep={currentStep} />
          </motion.div>

          {/* Content Area */}
          <motion.div
            className="max-w-4xl mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <UploadStep
                      dragOver={dragOver}
                      uploadedFiles={uploadedFiles}
                      handleDragOver={handleDragOver}
                      handleDragLeave={handleDragLeave}
                      handleDrop={handleDrop}
                      handleFileSelect={handleFileSelect}
                    />
                  )}

                  {currentStep === 2 && <VerificationStep />}
                  {currentStep === 3 && <ProcessingStep />}
                  {currentStep === 4 && <CompleteStep />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <NavigationButtons
              currentStep={currentStep}
              handleBack={handleBack}
              handleNext={handleNext}
              totalSteps={steps.length}
            />
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Anthos;
