"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Globe,
  Building,
  Home,
  Mountain,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Wallet,
  ExternalLink,
  Camera,
  Video,
  FileText,
  Download,
  Lock,
  Unlock,
} from "lucide-react";
import { nftProperties } from "../nfts";
import Link from "next/link";

const PropertyDetailPage = ({ params }) => {
  // Get property from URL params or default to first property
  const propertyId = params?.id ? parseInt(params.id) : 1;
  const property =
    nftProperties.find((p) => p.id === propertyId) || nftProperties[0];

  // Reset states when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsVideoPlaying(false);
  }, [propertyId]);

  // State management
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [stakingAmount, setStakingAmount] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Dynamic background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const particles = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;

        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 146, 60, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Media navigation handlers
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length
    );
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleStaking = () => {
    if (stakingAmount) {
      alert(`Staking ${stakingAmount} LKRYPT tokens on ${property.title}!`);
      // In a real app, you would call your staking contract here
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={1920}
        height={1080}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/50 to-orange-900/20" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/60" />

      {/* Mouse Cursor Effect */}
      <div
        className="fixed w-6 h-6 bg-orange-500/20 rounded-full pointer-events-none z-50 transition-all duration-300 mix-blend-screen"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: isHovering ? "scale(3)" : "scale(1)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
           <Link href="/marketplace">
           
            <button className="flex items-center gap-3 text-white hover:text-orange-400 transition-all duration-300 group">
              <div className="p-2 bg-white/10 rounded-xl group-hover:bg-orange-500/20 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Marketplace</span>
            </button>
           </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                  isLiked
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-white/10 text-white hover:bg-red-500/20"
                }`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300">
                <Wallet className="w-5 h-5 inline mr-2" />
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Media */}
          <div className="space-y-6">
            {/* Main Media Display */}
            <div className="relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
                {/* Property Image */}
                <div className="relative w-full h-full">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Image Navigation */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Media Controls */}
                  <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-all">
                      <Camera className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-all">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-all">
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-orange-500 scale-125"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-white font-medium">APY</span>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {property.apy}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-medium">Stakers</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {property.currentStakers}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-8">
            {/* Property Header */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {property.verified && (
                    <div className="p-1 bg-green-500/20 rounded-full">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                    {property.rarity}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>

              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
                {property.title}
              </h1>

              <div className="flex items-center gap-2 text-gray-300 mb-6">
                <MapPin className="w-5 h-5 text-orange-400" />
                <span className="text-lg">{property.location}</span>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-orange-400">
                    {property.price}
                  </div>
                  <div className="text-gray-400">{property.usdPrice} USD</div>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <div className="text-sm text-gray-400">Available Shares</div>
                  <div className="text-xl font-semibold text-white">
                    {property.availableShares.toLocaleString()} /{" "}
                    {property.totalShares.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Interface */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-orange-400" />
                Start Staking
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Amount to Stake (LKRYPT)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakingAmount}
                      onChange={(e) => setStakingAmount(e.target.value)}
                      placeholder="Enter amount..."
                      className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-lg"
                    />
                    <button
                      onClick={() =>
                        setStakingAmount(property.availableShares.toString())
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {["1000", "5000", "10000"].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakingAmount(amount)}
                      className="py-3 bg-white/10 hover:bg-orange-500/20 text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-orange-500/50"
                    >
                      {parseInt(amount).toLocaleString()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleStaking}
                  disabled={!stakingAmount}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 shadow-lg hover:shadow-orange-500/30"
                >
                  {stakingAmount
                    ? `Stake ${parseInt(stakingAmount).toLocaleString()} LKRYPT`
                    : "Enter Amount to Stake"}
                </button>

                <div className="text-center text-sm text-gray-400">
                  Estimated returns:{" "}
                  <span className="text-green-400 font-medium">
                    +
                    {stakingAmount
                      ? (
                          parseFloat(stakingAmount) *
                          (parseFloat(property.apy) / 100)
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "0"}{" "}
                    LKRYPT/year
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Total Staked</div>
                    <div className="text-lg font-bold text-white">
                      {property.analytics?.totalStaked || "0"}
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-400" />
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Growth</div>
                    <div className="text-lg font-bold text-green-400">
                      {property.analytics?.stakingGrowth || "0%"}
                    </div>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex border-b border-white/20 mb-8">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "history", label: "Staking History", icon: Clock },
              { id: "documents", label: "Documents", icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-300 ${
                  selectedTab === id
                    ? "text-orange-400 border-b-2 border-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            {selectedTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Property Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {property.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {property.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 text-gray-300"
                        >
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">
                      Specifications
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(property.specifications).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-white font-medium">
                              {value}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "analytics" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Staking Analytics
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(property.analytics || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="text-sm text-gray-400 capitalize mb-1">
                          {key.replace(/([A-Z])/g, " $1")}
                        </div>
                        <div className="text-xl font-bold text-white">
                          {value}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {selectedTab === "history" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Recent Staking Activity
                </h3>
                {(property.stakingHistory || []).map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {entry.staker}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {entry.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-orange-400 font-bold">
                      {entry.amount} LKRYPT
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "documents" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Property Documents
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Property Title",
                      type: "PDF",
                      size: "2.4 MB",
                      verified: true,
                    },
                    {
                      name: "Survey Plan",
                      type: "PDF",
                      size: "1.8 MB",
                      verified: true,
                    },
                    {
                      name: "Building Approval",
                      type: "PDF",
                      size: "3.2 MB",
                      verified: false,
                    },
                    {
                      name: "Property Valuation",
                      type: "PDF",
                      size: "1.5 MB",
                      verified: true,
                    },
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-orange-400" />
                        <div>
                          <div className="text-white font-medium">
                            {doc.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {doc.type} • {doc.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.verified ? (
                          <Shield className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-red-400" />
                        )}
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-gray-300" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
