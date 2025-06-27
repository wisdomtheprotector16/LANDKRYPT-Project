"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowUpDown, ChevronDown, Loader2 } from "lucide-react";
import { useAccount, useBalance } from 'wagmi';
import { useContractWriteCustom } from '@/hooks/useContractInteraction';
import { CONTRACT_ADDRESSES, LANDKRYPT_STABLECOIN_ABI } from '@/contracts/abis';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';

const EXCHANGE_RATE = 3000; // 1 ETH = 3000 LKUSD

export default function SwapModal({ onClose }) {
  const [swapFromAmount, setSwapFromAmount] = useState("");
  const [swapToAmount, setSwapToAmount] = useState("");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("LKUSD");
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(EXCHANGE_RATE);

  // Wallet connection
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  // Mock LKUSD balance - in production, read from contract
  const [lkusdBalance] = useState(1250.75);

  const tokens = [
    { symbol: "ETH", name: "Ethereum", icon: "♦" },
    { symbol: "LKUSD", name: "LandKrypt USD", icon: "$" },
  ];

  // Calculate swap amount
  useEffect(() => {
    if (swapFromAmount && !isNaN(swapFromAmount)) {
      const amount = parseFloat(swapFromAmount);
      if (fromToken === "ETH" && toToken === "LKUSD") {
        setSwapToAmount((amount * EXCHANGE_RATE).toFixed(2));
      } else if (fromToken === "LKUSD" && toToken === "ETH") {
        setSwapToAmount((amount / EXCHANGE_RATE).toFixed(6));
      } else {
        setSwapToAmount(swapFromAmount);
      }
    } else {
      setSwapToAmount("");
    }
  }, [swapFromAmount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!swapFromAmount || parseFloat(swapFromAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(swapFromAmount);
    const currentEthBalance = ethBalance ? parseFloat(ethBalance.formatted) : 0;
    
    if (fromToken === "ETH" && amount > currentEthBalance) {
      toast.error("Insufficient ETH balance");
      return;
    }
    if (fromToken === "LKUSD" && amount > lkusdBalance) {
      toast.error("Insufficient LKUSD balance");
      return;
    }

    setIsSwapping(true);
    
    try {
      // Step 1: Prepare transaction via API
      const response = await fetch('/api/prepare-swap-tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount: amount.toString(),
          userAddress: address,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to prepare transaction');
      }

      // Step 2: Execute transaction (mock for now)
      // In production, you would use wagmi's writeContract here
      toast.success(`Successfully swapped ${amount} ${fromToken} to ${swapToAmount} ${toToken}`);
      
      // Step 3: Log transaction
      await fetch('/api/user-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          actionType: 'swap',
          txHash: '0x' + Math.random().toString(16).substr(2, 64), // Mock tx hash
        }),
      });

      onClose();
    } catch (error) {
      console.error("Swap failed", error);
      toast.error(error.message || "Swap transaction failed. Please try again.");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    if (fromToken === toToken) return;
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleFromTokenSelect = (token) => {
    if (token === toToken) {
      handleFlipTokens();
    } else {
      setFromToken(token);
    }
    setShowFromTokenList(false);
  };

  const handleToTokenSelect = (token) => {
    if (token === fromToken) {
      handleFlipTokens();
    } else {
      setToToken(token);
    }
    setShowToTokenList(false);
  };

  const getBalance = (token) => {
    return token === "ETH" ? ethBalance : lkusdBalance;
  };

  const getTokenIcon = (token) => {
    const tokenData = tokens.find((t) => t.symbol === token);
    return tokenData ? tokenData.icon : "";
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                LandKrypt Exchange
              </h2>
              <p className="text-gray-400 text-sm">Swap tokens instantly</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* Swap From Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-white text-lg font-semibold">
                Swap From
              </label>
              <button
                onClick={() => setSwapFromAmount(getBalance(fromToken).toString())}
                className="text-gray-400 hover:text-white text-sm"
              >
                Max: {getBalance(fromToken)} {fromToken}
              </button>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="number"
                  value={swapFromAmount}
                  onChange={(e) => setSwapFromAmount(e.target.value)}
                  className="bg-transparent text-white text-2xl font-bold outline-none flex-1 min-w-0 mr-4"
                  placeholder="0"
                  min="0"
                  step="any"
                />
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowFromTokenList(!showFromTokenList)}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                  >
                    {fromToken === "ETH" ? (
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {getTokenIcon(fromToken)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {getTokenIcon(fromToken)}
                        </span>
                      </div>
                    )}
                    <span className="text-white font-semibold">{fromToken}</span>
                    <ChevronDown size={16} className="text-gray-300" />
                  </button>

                  {showFromTokenList && (
                    <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10 overflow-hidden">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => handleFromTokenSelect(token.symbol)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2 ${
                            fromToken === token.symbol ? "bg-gray-700" : ""
                          }`}
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {token.icon}
                            </span>
                          </div>
                          <span className="text-white">{token.symbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Balance: {getBalance(fromToken).toFixed(2)} {fromToken}
              </p>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center mb-4 -mt-2">
            <button
              onClick={handleFlipTokens}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors duration-200 shadow-lg"
              aria-label="Flip tokens"
            >
              <ArrowUpDown size={20} className="text-white" />
            </button>
          </div>

          {/* Swap To Section */}
          <div className="mb-6">
            <label className="block text-white text-lg font-semibold mb-3">
              Swap To
            </label>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={swapToAmount}
                  readOnly
                  className="bg-transparent text-white text-2xl font-bold outline-none flex-1 min-w-0 mr-4"
                  placeholder="0"
                />
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowToTokenList(!showToTokenList)}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                  >
                    {toToken === "ETH" ? (
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {getTokenIcon(toToken)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {getTokenIcon(toToken)}
                        </span>
                      </div>
                    )}
                    <span className="text-white font-semibold">{toToken}</span>
                    <ChevronDown size={16} className="text-gray-300" />
                  </button>

                  {showToTokenList && (
                    <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10 overflow-hidden">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => handleToTokenSelect(token.symbol)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center space-x-2 ${
                            toToken === token.symbol ? "bg-gray-700" : ""
                          }`}
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {token.icon}
                            </span>
                          </div>
                          <span className="text-white">{token.symbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Balance: {getBalance(toToken).toFixed(2)} {toToken}
              </p>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg text-center">
            <p className="text-gray-400 text-sm">
              1 {fromToken} ={" "}
              {fromToken === "ETH"
                ? EXCHANGE_RATE
                : (1 / EXCHANGE_RATE).toFixed(6)}{" "}
              {toToken}
            </p>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || isSwapping || !isConnected}
            className={`w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
              !swapFromAmount || parseFloat(swapFromAmount) <= 0 || isSwapping || !isConnected
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-orange-600 hover:to-red-600"
            }`}
          >
            {isSwapping && <Loader2 className="animate-spin" size={20} />}
            {!isConnected
              ? "Connect Wallet"
              : !swapFromAmount || parseFloat(swapFromAmount) <= 0
              ? "Enter Amount"
              : isSwapping
              ? "Swapping..."
              : `Swap ${fromToken} to ${toToken}`}
          </button>
        </div>
      </div>
    </>
  );
}