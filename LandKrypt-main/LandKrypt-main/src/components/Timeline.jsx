"use client";

import React, { useState, useEffect, useRef } from "react";
import { GradientButton2 } from "./GradientButton2";
import { GradientButton } from "./GradientButton";

// Reusable TimelineItem component
const TimelineItem = ({ title, content, index, inView, isEven, button }) => {
  return (
    <div
      className={`timeline-item relative flex items-center justify-center mb-16 ${
        isEven ? "md:justify-start" : "md:justify-end"
      }`}
    >
      {/* Timeline Dot with Glow */}
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full z-10 transition-all duration-700 ${
          inView ? "bg-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-gray-600"
        }`}
      >
        {/* Outer glow ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            inView ? "animate-pulse bg-cyan-400/30 scale-150" : "bg-transparent"
          }`}
        ></div>
      </div>

      {/* Content Card Container */}
      <div className={`relative max-w-sm w-full mx-4 md:mx-0`}>
        {/* Content Card */}
        <div
          className={`relative w-full p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg transition-all duration-700 z-10 backdrop-blur-sm ${
            inView
              ? `opacity-100 visible transform translate-x-0`
              : `opacity-0 invisible transform ${
                  isEven
                    ? "translate-x-48 md:translate-x-48"
                    : "translate-x-48 md:-translate-x-48"
                }`
          }`}
        >
          {/* Gradient Border using pseudo-element */}
          {inView && (
            <div
              className={`absolute -inset-3 rounded-lg overflow-hidden pointer-events-none ${
                isEven ? "bg-gradient-to-r" : "bg-gradient-to-l"
              } from-transparent via-[#FFA617] to-[#D91B5A]`}
            >
              <div className="absolute inset-[2px] rounded-[calc(0.5rem-2px)] bg-gradient-to-br from-gray-900 to-gray-800"></div>
            </div>
          )}

          {/* Inner content */}
          <div className="relative z-10">
            <time className="block text-2xl font-bold mb-3 text-orange-400">
              {title}
            </time>
            <p className="text-gray-300 text-sm leading-relaxed">{content}</p>

            <div className="mt-2">
              <GradientButton2
              className={`transition-all duration-300 ${
                inView
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/25"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {button}
            </GradientButton2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timeline = () => {
  const [inViewItems, setInViewItems] = useState(new Set());
  const timelineRef = useRef(null);

  const timelineData = [
    {
      title: "Start Verification",
      content:
        "Secure your stake in the metaverse through document-backed NFT verification on AnthOS.",
      button: "Start Verification"
    },
    {
      title: "Govern the Platform",
      content:
        "Shape the future of LandKrypt by voting on proposals and managing collective property development.",
      button: "Vote on Proposals"
    },
    {
      title: "Invest in Properties",
      content:
        "Access a transparent marketplace to co-own premium virtual lands and earn staking rewards.",
      button: "Explore Marketplace"
    },
    {
      title: "Join a Thriving Network",
      content:
        "Connect with a growing global community of digital landowners, builders, and investors.",
      button: "Join the Network"
    },
  ];

  const isElementInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    return rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2;
  };

  const checkInView = () => {
    const items = document.querySelectorAll(".timeline-item");
    const newInViewItems = new Set();

    items.forEach((item, index) => {
      if (isElementInViewport(item)) {
        newInViewItems.add(index);
      }
    });

    setInViewItems(newInViewItems);
  };

  useEffect(() => {
    checkInView();

    const handleScroll = () => checkInView();
    const handleResize = () => checkInView();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Timeline Section */}
      <main className="relative z-10 pt-12 " ref={timelineRef}>
        <div className="relative">
          {/* Central Line with Glow */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-cyan-400/50 via-purple-500/30 to-orange-500/50"></div>

          <div className="max-w-6xl mx-auto md:px-4">
            {timelineData.map((item, index) => (
              <TimelineItem
                key={index}
                title={item.title}
                content={item.content}
                index={index}
                inView={inViewItems.has(index)}
                isEven={index % 2 === 0}
                button={item.button}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Timeline;