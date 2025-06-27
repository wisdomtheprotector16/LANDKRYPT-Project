// components/NFTCard.jsx
"use client";

import React from "react";
import { MapPin, Users, Share2, Heart } from "lucide-react";
import Link from "next/link";
import { GradientButton } from "@/components/GradientButton";

const NFTCard = ({ item, likedItems, toggleLike }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 group">
      <div className="relative overflow-hidden">
        <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            {item.tag}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => toggleLike(item.id)}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${
              likedItems.has(item.id)
                ? "bg-red-500 text-white"
                : "bg-black/30 text-white hover:bg-red-500"
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-gray-700 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5">
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-orange-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{item.location}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-orange-400 font-medium">{item.price}</div>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{item.shares}</span>
          </div>
        </div>
        <Link href="/marketplace/1">
          <div className="w-full">
            <GradientButton className="">
              Start Staking
            </GradientButton>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default NFTCard;