//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INFTStaking {
    // Struct definition
    struct StakerInfo {
        uint256 amount;
        uint256 lastClaimDay;
        uint256 accumulatedRewards;
        uint256 finalRewardEligibleAmount;
    }

    // Events
    event StakeAdded(address indexed staker, uint256 amount);
    event NFTPurchased(uint256 tokenId);
    event DailyRewardsClaimed(address indexed staker, uint256 amount);
    event FinalRewardsDistributed(address indexed staker, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 amount, uint256 penalty);
    event WithdrawalPenaltyUpdated(uint256 newPenaltyRate);
    event AdminUpdated(address indexed newAdmin);
    event NFTTransferred(uint256 indexed tokenId, address indexed to);

    // Core functions
    function stake(uint256 amount) external;

    function claimDailyRewards() external;

    function recordDevelopmentContractMint() external;

    function returnTokenId() external returns(uint256)  ;

    function distributeFinalRewards() external;

    function withdrawStake() external;

    function setWithdrawalPenaltyRate(uint256 newPenaltyRate) external;

    function toggleWithdrawalPenalty(bool enabled) external;

    function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory);

    function performUpkeep(bytes calldata) external;

    function calculatePendingDailyRewards(address stakerAddress) external view returns (uint256);

    function getTotalClaimableRewards(address stakerAddress) external view returns (uint256);

    function transferNFT(uint256 _tokenId, address _to) external;

    function updateAdmin(address _newAdmin) external;
}
