// components/NFTCard.jsx
"use client";

import React from "react";
import { MapPin, Users, Share2, Heart, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import { GradientButton } from "@/components/GradientButton";
import IpfsImage from "@/components/IpfsImage";
import { convertIpfsToHttp } from "@/utils/ipfs";

const NFTCard = ({ item, likedItems, toggleLike, onStakeClick }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 group">
      <div className="relative overflow-hidden">
        <IpfsImage
          src={item.processedImageUrl || item.image}
          alt={item.title}
          className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800"
          placeholder="/images/nft-placeholder.jpg"
          showLoadingSpinner={true}
        />
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
        <div className="flex items-center justify-between mb-3">
          <div className="text-orange-400 font-medium">{item.price}</div>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{item.shares}</span>
          </div>
        </div>
        
        {/* Staking Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Staking Progress</span>
            <span>{item.stakingProgress || '0'}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${item.stakingProgress || 0}%` }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => onStakeClick && onStakeClick(item)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Stake & Earn
          </button>
          
          <Link href={`/marketplace/property/${item.id}`}>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;