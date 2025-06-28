"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Loader2, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  Calendar, 
  Coins, 
  Target,
  Clock,
  PiggyBank,
  Award,
  ArrowRight
} from "lucide-react";
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useContractOperations, useContractReads } from '@/hooks/useContractOperations';
import { useDatabaseActions, useUserNftData, useNftAnalytics } from '@/hooks/useDatabaseActions';
import { CONTRACT_ADDRESSES, NFT_STAKING_ABI, LANDKRYPT_STABLECOIN_ABI } from '@/contracts/abis';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { 
  parseContractError, 
  handleTransactionError, 
  validateStakingParams,
  formatTxHash,
  getEtherscanUrl,
  formatBalance as formatBalanceUtil
} from '@/utils/errorHandling';

export default function StakingModal({ 
  isOpen, 
  onClose, 
  property,
  stakingContractAddress 
}) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakingStage, setStakingStage] = useState('input'); // 'input', 'approving', 'staking', 'success', 'error'
  const [showSettings, setShowSettings] = useState(false);
  const [maxSlippage, setMaxSlippage] = useState(1.0); // 1% default
  const [deadline, setDeadline] = useState(20); // 20 minutes default
  const [stakingError, setStakingError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Approve, 2: Stake
  const [approvalTxHash, setApprovalTxHash] = useState(null);

  // Wallet connection and contract operations
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { lkusdBalance } = useContractReads();
  const { 
    stakeTokens, 
    approveToken, 
    isWritePending, 
    isConfirming, 
    isConfirmed,
    pendingTx,
    writeError 
  } = useContractOperations();
  
  // Database operations
  const { recordStakeAction, recordUnstakeAction } = useDatabaseActions();
  const { data: userNftData, refetch: refetchUserData } = useUserNftData(property?.id);
  const { analytics: nftAnalytics, refetch: refetchAnalytics } = useNftAnalytics(property?.id);

  // Read staking contract data
  const { data: totalStaked } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: 'totalStaked',
    query: {
      refetchInterval: 10000,
    },
  });

  const { data: targetAmount } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: 'targetAmount',
    query: {
      refetchInterval: 30000,
    },
  });

  const { data: stakerInfo } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: 'stakers',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 10000,
    },
  });

  const { data: earnedRewards } = useReadContract({
    address: stakingContractAddress,
    abi: NFT_STAKING_ABI,
    functionName: 'getTotalClaimableRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 10000,
    },
  });

  const { data: currentAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
    abi: LANDKRYPT_STABLECOIN_ABI,
    functionName: 'allowance',
    args: address ? [address, stakingContractAddress] : undefined,
    query: {
      enabled: !!address && !!stakingContractAddress,
      refetchInterval: 5000,
    },
  });

  // Calculate staking metrics
  const stakingMetrics = useMemo(() => {
    const totalStakedFormatted = totalStaked ? parseFloat(formatEther(totalStaked)) : 0;
    const targetAmountFormatted = targetAmount ? parseFloat(formatEther(targetAmount)) : 0;
    const userStakedFormatted = stakerInfo ? parseFloat(formatEther(stakerInfo[0])) : 0; // amount is first in tuple
    const earnedRewardsFormatted = earnedRewards ? parseFloat(formatEther(earnedRewards)) : 0;
    const currentAllowanceFormatted = currentAllowance ? parseFloat(formatEther(currentAllowance)) : 0;

    const progressPercentage = targetAmountFormatted > 0 ? (totalStakedFormatted / targetAmountFormatted) * 100 : 0;
    const remainingAmount = Math.max(0, targetAmountFormatted - totalStakedFormatted);
    
    // Calculate APR (0.05% daily = 18.25% annual)
    const dailyRate = 0.0005; // 0.05%
    const annualRate = dailyRate * 365 * 100; // Convert to percentage

    // Calculate potential rewards for entered amount
    const stakeAmountNum = parseFloat(stakeAmount) || 0;
    const dailyRewards = stakeAmountNum * dailyRate;
    const monthlyRewards = dailyRewards * 30;
    const annualRewards = stakeAmountNum * (annualRate / 100);

    // Calculate completion bonus (110% of staked amount)
    const completionBonus = stakeAmountNum * 1.1;

    return {
      totalStaked: totalStakedFormatted,
      targetAmount: targetAmountFormatted,
      userStaked: userStakedFormatted,
      earnedRewards: earnedRewardsFormatted,
      currentAllowance: currentAllowanceFormatted,
      progressPercentage: Math.min(progressPercentage, 100),
      remainingAmount,
      annualRate,
      dailyRewards,
      monthlyRewards,
      annualRewards,
      completionBonus,
      isCompleted: progressPercentage >= 100,
      needsApproval: currentAllowanceFormatted < stakeAmountNum
    };
  }, [totalStaked, targetAmount, stakerInfo, earnedRewards, currentAllowance, stakeAmount]);

  // Monitor transaction status
  useEffect(() => {
    if (pendingTx) {
      setTxHash(pendingTx);
      if (currentStep === 1) {
        setStakingStage('approving');
        setApprovalTxHash(pendingTx);
      } else {
        setStakingStage('staking');
      }
    }
  }, [pendingTx, currentStep]);

  useEffect(() => {
    if (isConfirmed && (stakingStage === 'approving' || stakingStage === 'staking')) {
      if (stakingStage === 'approving') {
        setCurrentStep(2);
        setStakingStage('input');
        toast.success('Approval confirmed! Now you can stake.');
      } else {
        setStakingStage('success');
        toast.success('Staking completed successfully!');
        // Auto-close modal after success
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    }
  }, [isConfirmed, stakingStage, onClose]);

  useEffect(() => {
    if (writeError) {
      setStakingError(writeError.message || 'Transaction failed');
      setStakingStage('error');
    }
  }, [writeError]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStakeAmount("");
      setStakingStage('input');
      setStakingError(null);
      setTxHash(null);
      setApprovalTxHash(null);
      setCurrentStep(1); // Always start with step 1 to check approval
    }
  }, [isOpen]);

  const handleStake = async () => {
    console.log('🚀 Starting handleStake with:', {
      isConnected,
      stakingContractAddress,
      stakeAmount,
      address,
      stakingMetrics
    });
    
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!stakingContractAddress) {
      toast.error("Staking contract address not found");
      return;
    }

    // Validate staking parameters
    const validation = validateStakingParams(
      stakeAmount, 
      lkusdBalance, 
      stakingMetrics.remainingAmount
    );
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const amount = parseFloat(stakeAmount);

    setStakingError(null);
    
    try {
      if (stakingMetrics.needsApproval && currentStep === 1) {
        // Step 1: Approve tokens
        console.log('Approving tokens:', {
          token: CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
          spender: stakingContractAddress,
          amount: amount
        });
        
        const result = await approveToken(
          CONTRACT_ADDRESSES.LANDKRYPT_STABLECOIN,
          stakingContractAddress,
          amount
        );
        
        if (!result?.success) {
          throw new Error(result?.error || 'Approval transaction failed');
        }
      } else {
        // Step 2: Stake tokens
        console.log('Staking tokens:', {
          contract: stakingContractAddress,
          amount: amount
        });
        
        const result = await stakeTokens(stakingContractAddress, amount);
        
        if (!result?.success) {
          throw new Error(result?.error || 'Staking transaction failed');
        }
        
        // Record stake action in database (non-blocking)
        try {
          await recordStakeAction({
            nftId: property?.id || 1,
            amount: amount.toString(),
            stakingContract: stakingContractAddress,
            txHash: result.hash,
            metadata: {
              propertyTitle: property?.title || 'Unknown Property',
              expectedDailyRewards: stakingMetrics.dailyRewards,
              expectedAnnualRewards: stakingMetrics.annualRewards,
              targetAmount: stakingMetrics.targetAmount,
              progressPercentage: stakingMetrics.progressPercentage,
              completionBonus: stakingMetrics.completionBonus,
              timestamp: new Date().toISOString()
            }
          });
          
          // Refresh user data and analytics
          refetchUserData();
          refetchAnalytics();
        } catch (dbError) {
          console.warn('Failed to record stake in database:', dbError);
          // Don't fail the main operation for database errors
        }
      }
    } catch (error) {
      console.error("Staking operation failed:", error);
      
      // const errorMessage = handleTransactionError(
      //   error, 
      //   currentStep === 1 ? 'approval' : 'staking'
      // );
      
      // setStakingError(errorMessage);
      setStakingStage('error');
    }
  };

  const resetStaking = () => {
    setStakingStage('input');
    setStakingError(null);
    setTxHash(null);
    setApprovalTxHash(null);
    setCurrentStep(stakingMetrics.needsApproval ? 1 : 2);
    setStakeAmount('');
  };

  const formatBalance = (amount) => {
    return formatBalanceUtil(amount);
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return "Enter Amount";
    if (stakingMetrics.isCompleted) return "Staking Complete";
    if (isWritePending) return "Confirming...";
    
    if (stakingMetrics.needsApproval && currentStep === 1) {
      return `Approve ${stakeAmount} LKUSD`;
    } else {
      return `Stake ${stakeAmount} LKUSD`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="relative bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                Stake on {property?.title || 'Property'}
              </h2>
              <p className="text-gray-400 text-sm">
                {stakingStage === 'input' && 'Earn daily rewards and completion bonuses'}
                {stakingStage === 'approving' && 'Approving LKUSD spending...'}
                {stakingStage === 'staking' && 'Staking tokens...'}
                {stakingStage === 'success' && 'Staking completed!'}
                {stakingStage === 'error' && 'Transaction failed'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stakingStage === 'input' && (
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

          {/* Progress Steps */}
          {stakingMetrics.needsApproval && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-orange-400' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Approve LKUSD</span>
                </div>
                
                <ArrowRight className={`w-4 h-4 ${currentStep >= 2 ? 'text-orange-400' : 'text-gray-500'}`} />
                
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Stake Tokens</span>
                </div>
              </div>
            </div>
          )}

          {/* Property Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-xs">Progress</span>
              </div>
              <p className="text-white font-bold">{stakingMetrics.progressPercentage.toFixed(1)}%</p>
              <p className="text-gray-500 text-xs">{formatBalance(stakingMetrics.totalStaked)}/{formatBalance(stakingMetrics.targetAmount)} LKUSD</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 text-xs">APR</span>
              </div>
              <p className="text-white font-bold">{stakingMetrics.annualRate.toFixed(2)}%</p>
              <p className="text-gray-500 text-xs">Daily rewards</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-xs">Your Stake</span>
              </div>
              <p className="text-white font-bold">{formatBalance(stakingMetrics.userStaked)} LKUSD</p>
              <p className="text-gray-500 text-xs">Currently staked</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-xs">Rewards</span>
              </div>
              <p className="text-white font-bold">{formatBalance(stakingMetrics.earnedRewards)} LKUSD</p>
              <p className="text-gray-500 text-xs">Earned</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Staking Progress</span>
              <span className="text-white">{formatBalance(stakingMetrics.remainingAmount)} LKUSD remaining</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stakingMetrics.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && stakingStage === 'input' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-white font-medium mb-4">Staking Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Max Slippage (%)
                  </label>
                  <div className="flex items-center gap-2">
                    {[0.5, 1.0, 2.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setMaxSlippage(preset)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          maxSlippage === preset
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={maxSlippage}
                      onChange={(e) => setMaxSlippage(parseFloat(e.target.value) || 0)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-16"
                      step="0.1"
                      min="0"
                      max="10"
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

          {/* Stake Amount Input */}
          {stakingStage === 'input' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white text-lg font-semibold">
                  Stake Amount (LKUSD)
                </label>
                <button
                  onClick={() => setStakeAmount(Math.min(parseFloat(lkusdBalance), stakingMetrics.remainingAmount).toString())}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Max: {Math.min(parseFloat(lkusdBalance), stakingMetrics.remainingAmount).toFixed(2)} LKUSD
                </button>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-transparent text-white text-2xl font-bold outline-none w-full mb-2"
                  placeholder="0"
                  min="0"
                  step="any"
                  disabled={stakingMetrics.isCompleted}
                />
                <p className="text-gray-400 text-sm">
                  Available: {formatBalance(lkusdBalance)} LKUSD
                </p>
              </div>

              {/* Projected Rewards */}
              {parseFloat(stakeAmount) > 0 && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Projected Rewards
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-300">Daily Rewards:</p>
                      <p className="text-blue-100 font-bold">{stakingMetrics.dailyRewards.toFixed(4)} LKUSD</p>
                    </div>
                    <div>
                      <p className="text-blue-300">Monthly Rewards:</p>
                      <p className="text-blue-100 font-bold">{stakingMetrics.monthlyRewards.toFixed(2)} LKUSD</p>
                    </div>
                    <div>
                      <p className="text-blue-300">Annual Rewards:</p>
                      <p className="text-blue-100 font-bold">{stakingMetrics.annualRewards.toFixed(2)} LKUSD</p>
                    </div>
                    <div>
                      <p className="text-blue-300">Completion Bonus:</p>
                      <p className="text-blue-100 font-bold">{stakingMetrics.completionBonus.toFixed(2)} LKUSD</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Low Balance Warning */}
              {parseFloat(lkusdBalance) < 1 && (
                <div className="mt-4 flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-orange-200 text-sm font-medium mb-1">
                      Low LKUSD Balance
                    </p>
                    <p className="text-orange-300 text-xs mb-2">
                      You need LKUSD tokens to stake. You can get LKUSD by swapping ETH in the Exchange.
                    </p>
                    <a 
                      href="/#exchange" 
                      onClick={onClose}
                      className="text-orange-400 text-xs hover:underline"
                    >
                      Go to Exchange →
                    </a>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {stakingMetrics.isCompleted && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <Info className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm">
                    This property has reached its funding target. No additional staking allowed.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Transaction Status */}
          {stakingStage === 'approving' && (
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-200 font-medium">Approving LKUSD</p>
                  <p className="text-blue-300 text-sm">
                    Approving {stakeAmount} LKUSD for staking contract
                  </p>
                  {approvalTxHash && (
                    <p className="text-blue-400 text-xs mt-1">
                      Tx: {formatTxHash(approvalTxHash)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {stakingStage === 'staking' && (
            <div className="mb-6 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                <div>
                  <p className="text-orange-200 font-medium">Staking Tokens</p>
                  <p className="text-orange-300 text-sm">
                    Staking {stakeAmount} LKUSD to earn rewards
                  </p>
                  {txHash && (
                    <p className="text-orange-400 text-xs mt-1">
                      Tx: {formatTxHash(txHash)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {stakingStage === 'success' && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-200 font-medium">Staking Successful!</p>
                  <p className="text-green-300 text-sm">
                    Successfully staked {stakeAmount} LKUSD
                  </p>
                  {txHash && (
                    <a 
                      href={getEtherscanUrl(txHash)}
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

          {stakingStage === 'error' && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-red-200 font-medium">Transaction Failed</p>
                  <p className="text-red-300 text-sm mt-1">
                    {stakingError}
                  </p>
                  <button
                    onClick={resetStaking}
                    className="text-red-400 text-sm hover:underline mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {stakingStage === 'input' && (
            <div className="space-y-3">
              <button
                onClick={handleStake}
                disabled={
                  !stakeAmount || 
                  parseFloat(stakeAmount) <= 0 || 
                  isWritePending || 
                  !isConnected || 
                  stakingMetrics.isCompleted ||
                  parseFloat(stakeAmount) > Math.min(parseFloat(lkusdBalance), stakingMetrics.remainingAmount)
                }
                className={`w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                  !stakeAmount || 
                  parseFloat(stakeAmount) <= 0 || 
                  isWritePending || 
                  !isConnected || 
                  stakingMetrics.isCompleted ||
                  parseFloat(stakeAmount) > Math.min(parseFloat(lkusdBalance), stakingMetrics.remainingAmount)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-orange-600 hover:to-red-600"
                }`}
              >
                {isWritePending && <Loader2 className="animate-spin" size={20} />}
                {getButtonText()}
              </button>

              {/* Info Panel */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>Staking Benefits:</strong>
                    </p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Earn 0.05% daily rewards (18.25% APR)</li>
                      <li>• Receive 110% completion bonus when project finishes</li>
                      <li>• Get LKST governance tokens (1:1 ratio)</li>
                      <li>• Vote on development proposals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(stakingStage === 'approving' || stakingStage === 'staking') && (
            <button
              disabled
              className="w-full bg-gray-700 text-gray-300 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Loader2 className="animate-spin" size={20} />
              {isConfirming ? 'Waiting for confirmation...' : 'Transaction pending...'}
            </button>
          )}

          {(stakingStage === 'success' || stakingStage === 'error') && (
            <div className="space-y-3">
              {stakingStage === 'error' && (
                <button
                  onClick={resetStaking}
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
