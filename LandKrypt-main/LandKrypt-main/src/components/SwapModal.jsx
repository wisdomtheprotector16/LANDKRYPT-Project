"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowUpDown, ChevronDown, Loader2, Settings, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useContractOperations, useContractReads } from '@/hooks/useContractOperations';
import { CONTRACT_ADDRESSES, EXCHANGE_ABI, LANDKRYPT_STABLECOIN_ABI } from '@/contracts/abis';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

export default function SwapModal({ onClose }) {
  const [swapFromAmount, setSwapFromAmount] = useState("");
  const [swapToAmount, setSwapToAmount] = useState("");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("LKUSD");
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5); // 0.5% default
  const [deadline, setDeadline] = useState(20); // 20 minutes default
  const [swapStage, setSwapStage] = useState('input'); // 'input', 'confirming', 'success', 'error'
  const [txHash, setTxHash] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [priceImpact, setPriceImpact] = useState(0);

  // Wallet connection and contract operations
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { lkusdBalance, formatEther } = useContractReads();
  const { 
    swapETHForLKUSD, 
    burnLKUSDForETH, 
    isWritePending, 
    isConfirming, 
    isConfirmed,
    pendingTx,
    writeError 
  } = useContractOperations();

  // Read exchange rate from Oracle/Exchange contract
  const { data: exchangeFeeRate } = useReadContract({
    address: CONTRACT_ADDRESSES.EXCHANGE,
    abi: EXCHANGE_ABI,
    functionName: 'feeRate',
    query: {
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  // Mock exchange rate for demo - in production, get from Oracle
  const [exchangeRate] = useState(3000); // 1 ETH = 3000 LKUSD

  const tokens = [
    { symbol: "ETH", name: "Ethereum", icon: "♦" },
    { symbol: "LKUSD", name: "LandKrypt USD", icon: "$" },
  ];

  // Calculate swap amount with slippage and fees
  useEffect(() => {
    if (swapFromAmount && !isNaN(swapFromAmount)) {
      const amount = parseFloat(swapFromAmount);
      const feeRate = exchangeFeeRate ? Number(exchangeFeeRate) / 10000 : 0.005; // Default 0.5% fee
      
      if (fromToken === "ETH" && toToken === "LKUSD") {
        const rawAmount = amount * exchangeRate;
        const feeAmount = rawAmount * feeRate;
        const afterFee = rawAmount - feeAmount;
        const slippageAmount = afterFee * (slippageTolerance / 100);
        const finalAmount = afterFee - slippageAmount;
        
        setSwapToAmount(finalAmount.toFixed(2));
        setPriceImpact(((feeAmount + slippageAmount) / rawAmount * 100).toFixed(2));
      } else if (fromToken === "LKUSD" && toToken === "ETH") {
        // For LKUSD to ETH, this would require a burn mechanism
        const rawAmount = amount / exchangeRate;
        const feeAmount = rawAmount * feeRate;
        const afterFee = rawAmount - feeAmount;
        const slippageAmount = afterFee * (slippageTolerance / 100);
        const finalAmount = afterFee - slippageAmount;
        
        setSwapToAmount(finalAmount.toFixed(6));
        setPriceImpact(((feeAmount + slippageAmount) / rawAmount * 100).toFixed(2));
      } else {
        setSwapToAmount(swapFromAmount);
        setPriceImpact(0);
      }
    } else {
      setSwapToAmount("");
      setPriceImpact(0);
    }
  }, [swapFromAmount, fromToken, toToken, exchangeRate, exchangeFeeRate, slippageTolerance]);

  // Monitor transaction status
  useEffect(() => {
    if (pendingTx) {
      setTxHash(pendingTx);
      setSwapStage('confirming');
    }
  }, [pendingTx]);

  useEffect(() => {
    if (isConfirmed && swapStage === 'confirming') {
      setSwapStage('success');
      toast.success('Swap completed successfully!');
      // Auto-close modal after success
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isConfirmed, swapStage, onClose]);

  useEffect(() => {
    if (writeError) {
      setSwapError(writeError.message || 'Transaction failed');
      setSwapStage('error');
    }
  }, [writeError]);

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
    const currentLkusdBalance = parseFloat(lkusdBalance);
    
    // Balance validation
    if (fromToken === "ETH" && amount > currentEthBalance) {
      toast.error("Insufficient ETH balance");
      return;
    }
    if (fromToken === "LKUSD" && amount > currentLkusdBalance) {
      toast.error("Insufficient LKUSD balance");
      return;
    }

    // Price impact warning
    if (parseFloat(priceImpact) > 5) {
      const confirmed = window.confirm(
        `High price impact detected (${priceImpact}%). Are you sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    setSwapStage('confirming');
    setSwapError(null);
    
    try {
      let result;
      
      if (fromToken === "ETH" && toToken === "LKUSD") {
        // ETH to LKUSD swap
        result = await swapETHForLKUSD(amount);
      } else if (fromToken === "LKUSD" && toToken === "ETH") {
        // LKUSD to ETH swap (burn mechanism)
        result = await burnLKUSDForETH(amount);
      } else {
        throw new Error('Unsupported swap pair');
      }

      if (result.success) {
        // Log transaction to API
        try {
          await fetch('/api/user-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              actionType: 'swap',
              txHash: result.hash,
              details: {
                fromToken,
                toToken,
                fromAmount: amount,
                toAmount: swapToAmount,
                slippage: slippageTolerance,
                priceImpact
              }
            }),
          });
        } catch (logError) {
          console.warn('Failed to log transaction:', logError);
          // Don't fail the swap if logging fails
        }
      } else {
        throw new Error(result.error || 'Swap failed');
      }
    } catch (error) {
      console.error("Swap failed", error);
      setSwapError(error.message || "Swap transaction failed. Please try again.");
      setSwapStage('error');
    }
  };

  const resetSwap = () => {
    setSwapStage('input');
    setSwapError(null);
    setTxHash(null);
    setSwapFromAmount('');
    setSwapToAmount('');
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
    if (token === "ETH") {
      return ethBalance ? parseFloat(ethBalance.formatted) : 0;
    } else if (token === "LKUSD") {
      return parseFloat(lkusdBalance || 0);
    }
    return 0;
  };

  const getFormattedBalance = (token) => {
    const balance = getBalance(token);
    return token === "ETH" ? balance.toFixed(6) : balance.toFixed(2);
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
              <p className="text-gray-400 text-sm">
                {swapStage === 'input' && 'Swap tokens instantly'}
                {swapStage === 'confirming' && 'Confirming transaction...'}
                {swapStage === 'success' && 'Swap completed!'}
                {swapStage === 'error' && 'Transaction failed'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {swapStage === 'input' && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <Settings size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && swapStage === 'input' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-white font-medium mb-4">Transaction Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Slippage Tolerance (%)
                  </label>
                  <div className="flex items-center gap-2">
                    {[0.1, 0.5, 1.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSlippageTolerance(preset)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          slippageTolerance === preset
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={slippageTolerance}
                      onChange={(e) => setSlippageTolerance(parseFloat(e.target.value) || 0)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-16"
                      step="0.1"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Transaction Deadline (minutes)
                  </label>
                  <input
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                    className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                    min="1"
                    max="180"
                  />
                </div>
              </div>
            </div>
          )}          

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
                Max: {getFormattedBalance(fromToken)} {fromToken}
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
                disabled={swapStage !== 'input'}
              />
                <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowFromTokenList(!showFromTokenList)}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
                  disabled={swapStage !== 'input'}
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
                Balance: {getFormattedBalance(fromToken)} {fromToken}
              </p>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center mb-4 -mt-2">
            <button
              onClick={handleFlipTokens}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors duration-200 shadow-lg"
              aria-label="Flip tokens"
              disabled={swapStage !== 'input'}
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
                  disabled={swapStage !== 'input'}
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
                Balance: {getFormattedBalance(toToken)} {toToken}
              </p>
            </div>
          </div>

          {/* Exchange Rate and Impact Info */}
          {swapStage === 'input' && (
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Exchange Rate:</span>
                  <span className="text-white">
                    1 {fromToken} = {fromToken === "ETH" ? exchangeRate : (1 / exchangeRate).toFixed(6)} {toToken}
                  </span>
                </div>
                {exchangeFeeRate && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-400">Fee:</span>
                    <span className="text-white">{(Number(exchangeFeeRate) / 100).toFixed(2)}%</span>
                  </div>
                )}
                {parseFloat(priceImpact) > 0 && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-400">Price Impact:</span>
                    <span className={`${parseFloat(priceImpact) > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {priceImpact}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-400">Slippage:</span>
                  <span className="text-white">{slippageTolerance}%</span>
                </div>
              </div>
              
              {parseFloat(priceImpact) > 3 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm">
                    {parseFloat(priceImpact) > 5 ? 'High' : 'Medium'} price impact detected
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Transaction Status */}
          {swapStage === 'confirming' && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-200 font-medium">Transaction Confirming</p>
                  <p className="text-blue-300 text-sm">
                    Swapping {swapFromAmount} {fromToken} for {swapToAmount} {toToken}
                  </p>
                  {txHash && (
                    <p className="text-blue-400 text-xs mt-1">
                      Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {swapStage === 'success' && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-200 font-medium">Swap Successful!</p>
                  <p className="text-green-300 text-sm">
                    Received {swapToAmount} {toToken}
                  </p>
                  {txHash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 text-xs hover:underline"
                    >
                      View on Etherscan
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {swapStage === 'error' && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-200 font-medium">Transaction Failed</p>
                  <p className="text-red-300 text-sm mt-1">
                    {swapError}
                  </p>
                  <button
                    onClick={resetSwap}
                    className="text-red-400 text-sm hover:underline mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Swap Button */}
          {swapStage === 'input' && (
            <button
              onClick={handleSwap}
              disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || isWritePending || !isConnected}
              className={`w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                !swapFromAmount || parseFloat(swapFromAmount) <= 0 || isWritePending || !isConnected
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-orange-600 hover:to-red-600"
              }`}
            >
              {isWritePending && <Loader2 className="animate-spin" size={20} />}
              {!isConnected
                ? "Connect Wallet"
                : !swapFromAmount || parseFloat(swapFromAmount) <= 0
                ? "Enter Amount"
                : isWritePending
                ? "Confirming..."
                : `Swap ${fromToken} to ${toToken}`}
            </button>
          )}

          {swapStage === 'confirming' && (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-300 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Loader2 className="animate-spin" size={20} />
              {isConfirming ? 'Waiting for confirmation...' : 'Transaction pending...'}
            </button>
          )}

          {(swapStage === 'success' || swapStage === 'error') && (
            <div className="space-y-3">
              {swapStage === 'error' && (
                <button
                  onClick={resetSwap}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:from-orange-600 hover:to-red-600"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}