"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { GradientButton } from "./GradientButton";
import { GradientButton2 } from "./GradientButton2";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import CustomConnectButton from "./CustomConnectButton";
import CustomConnectButtonMobile from "./CustomConnectButtonMobile";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="flex items-center space-x-1 h-8">
        <img
          className="h-full w-auto object-contain"
          src="/images/logo.png"
          alt="LandKrypt Logo"
        />
        <div className="text-md font-semibold tracking-tight leading-none">
          <span className="text-gray-300">Land</span>
          <br />
          <span className="text-red-200">Krypt</span>
        </div>
      </div>
    </Link>
  );
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animationState, setAnimationState] = useState("closed"); // 'closed', 'opening', 'open', 'closing'

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      // Closing animation
      setAnimationState("closing");
      setTimeout(() => {
        setIsMobileMenuOpen(false);
        setAnimationState("closed");
      }, 400); // Match the animation duration
    } else {
      // Opening animation
      setIsMobileMenuOpen(true);
      setAnimationState("opening");
      setTimeout(() => {
        setAnimationState("open");
      }, 50); // Small delay to ensure DOM is updated
    }
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const getBackdropClasses = () => {
    if (animationState === "opening") {
      return "fixed inset-0  z-30 md:hidden transition-all duration-500 ease-out bg-opacity-0 backdrop-blur-sm animate-in fade-in-0";
    }
    if (animationState === "open") {
      return "fixed inset-0  bg-opacity-40 z-30 md:hidden transition-all duration-300 ease-out backdrop-blur-sm";
    }
    if (animationState === "closing") {
      return "fixed inset-0  z-30 md:hidden transition-all duration-400 ease-in bg-opacity-0";
    }
    return "";
  };

  const getSidebarClasses = () => {
    const baseClasses =
      "fixed top-0 right-0 w-80 h-full bg-slate-900/95 backdrop-blur-xl z-50 md:hidden shadow-2xl border-l border-slate-700/50";

    if (animationState === "opening") {
      return `${baseClasses} transform translate-x-full transition-transform duration-600 ease-out animate-in slide-in-from-right-full`;
    }
    if (animationState === "open") {
      return `${baseClasses} transform translate-x-0 transition-transform duration-300 ease-out`;
    }
    if (animationState === "closing") {
      return `${baseClasses} transform translate-x-full transition-transform duration-400 ease-in`;
    }
    return `${baseClasses} transform translate-x-full`;
  };

  const getContentClasses = (delay = 0) => {
    if (animationState === "opening") {
      return `transform translate-x-8 opacity-0 transition-all duration-500 ease-out animate-in slide-in-from-right-4 fade-in-0`;
    }
    if (animationState === "open") {
      return `transform translate-x-0 opacity-100 transition-all duration-400 ease-out delay-${delay}`;
    }
    if (animationState === "closing") {
      return `transform translate-x-4 opacity-0 transition-all duration-200 ease-in`;
    }
    return "transform translate-x-8 opacity-0";
  };

  return (
    <>
      <header className="bg-neutral-600/40 backdrop-blur-lg border-b border-slate-800 rounded-full shadow-inner">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex text-lg items-center space-x-8">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/anthos"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Anthos
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Marketplace
            </Link>
            <Link
              href="/governmentdao"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              DAO
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Dashboard
            </Link>
          </div>

          <div className="hidden md:flex">
            <CustomConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${
                isMobileMenuOpen ? "rotate-90" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Sidebar Menu */}
      {/* // Updated mobile menu section - replace your existing mobile menu code with this */}

      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div className={getBackdropClasses()} onClick={toggleMobileMenu} />

          {/* Sidebar */}
          <div className={getSidebarClasses()}>
            <div className="flex flex-col h-full bg-neutral-800">
              {/* Header with Logo and Close Button */}
              <div
                className={`flex items-center justify-between p-6 border-b border-slate-700/50 ${getContentClasses(
                  0
                )}`}
              >
                <Logo />
                <button
                  onClick={toggleMobileMenu}
                  className="text-orange-500 p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6 transition-transform duration-300 hover:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <div
                className={`flex flex-col space-y-6 p-6 ${getContentClasses(
                  100
                )}`}
              >
                <Link
                  className="text-white text-lg font-medium hover:text-orange-500 transition-all duration-300 hover:translate-x-2 hover:scale-105"
                  href="/anthos"
                  onClick={toggleMobileMenu}
                >
                  Anthos
                </Link>
                <Link
                  className="text-white text-lg font-medium hover:text-orange-500 transition-all duration-300 hover:translate-x-2 hover:scale-105"
                  href="/marketplace"
                  onClick={toggleMobileMenu}
                >
                  Marketplace
                </Link>
                <Link
                  className="text-white text-lg font-medium hover:text-orange-500 transition-all duration-300 hover:translate-x-2 hover:scale-105"
                  href="/dashboard"
                  onClick={toggleMobileMenu}
                >
                  Dashboard
                </Link>
              </div>

              {/* Bottom Section with Wallet */}
              <div className={`mt-auto ${getContentClasses(200)}`}>
                {/* Custom Connect Button - replaces the hardcoded wallet card */}
                <div className="mx-6 mb-6">
                  <CustomConnectButtonMobile
                    onDisconnect={() => {
                      // Optional: Handle any additional disconnect logic
                      console.log("Wallet disconnected from mobile menu");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
