import React from "react";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Users,
  FileText,
  MessageCircle,
  HelpCircle,
  Twitter,
  Facebook,
  Linkedin,
  Lock,
  Shield,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Charts from "./components/Charts";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50 my-3 px-5">
        <Header />
      </div>

      {/* Main Content */}
      <main className="py-28 px-4">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Track your balance, monitor investments, view staking rewards, and
            manage your digital real estate, all in one place.
          </p>
        </div>

        <div className="w-full py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4  mx-auto">
            {/* LKST Balance Card */}
            <div className="bg-gradient-to-br flex gap-1.5 from-blue-500 to-blue-600 p-6 rounded-2xl text-white relative overflow-hidden">
              {/* <div className="bg-white p-4 rounded-lg shadow-sm"> */}
              <div className="flex items-center justify-between mb-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 opacity-80 text-blue-600" />
                </div>
              </div>
              {/* </div> */}
              <div>
                <div className="text-xs font-medium opacity-80 mb-1 tracking-wide">
                  LKST BALANCE
                </div>
                <div className="text-4xl font-bold mb-3">21.97</div>
                <div className="text-xs opacity-70 leading-tight">
                  Governance tokens for voting on
                  <br />
                  proposals
                </div>
              </div>
            </div>

            {/* LKUSD Balance Card */}
            <div className="bg-gradient-to-br  flex gap-1.5 from-orange-400 to-orange-500 p-6 rounded-2xl text-white relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 opacity-80 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium opacity-80 mb-1 tracking-wide">
                  LKUSD BALANCE
                </div>
                <div className="text-4xl font-bold mb-3">36.61</div>
                <div className="text-xs opacity-70 leading-tight">
                  Available for staking and transactions
                </div>
              </div>
            </div>

            {/* Total Staked Card */}
            <div className="bg-gradient-to-br  flex gap-1.5 from-pink-500 to-pink-600 p-6 rounded-2xl text-white relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 opacity-80 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium opacity-80 mb-1 tracking-wide">
                  TOTAL STAKED
                </div>
                <div className="text-4xl font-bold mb-3">110,000 LKUSD</div>
                <div className="text-xs opacity-70 leading-tight">
                  Across 3 different land NFTs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-8 mb-6 border-b border-gray-800">
          <button className="pb-2 border-b-2 border-orange-500 text-orange-500 font-medium">
            Overview
          </button>
          <button className="pb-2 text-gray-400 hover:text-white">
            Staked NFTs
          </button>
        </div>

        {/* Chart and Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chart */}
          <Charts />

          {/* Account Summary */}
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Account Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Account</span>
                <span className="text-gray-400">0x0e8f...0000</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Total Staked</span>
                <span>110,000 LKUSD</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Total Rewards</span>
                <span>2,340.5</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Staked NFTs</span>
                <span>8</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Annual Yield</span>
                <span className="text-gray-400">Annual Yield</span>
              </div>
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 py-2 px-4 rounded-lg font-medium mt-6">
              View All NFTs
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-3/4"></div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer Links */}
      <Footer />
    </div>
  );
}
