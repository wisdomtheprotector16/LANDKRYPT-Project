// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./AccessControlUpgrade.sol";

/**
 * @title AdvancedStaking
 * @dev Multi-asset staking with yield farming, boosters, and tier multipliers
 * Supports both ERC20 tokens and ERC721 NFTs with dynamic APY
 */
contract AdvancedStaking is AccessControlUpgrade {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Staking pool configuration
    struct PoolInfo {
        IERC20 stakingToken;        // Address of staking token
        uint256 allocPoint;        // Allocation points for this pool
        uint256 lastRewardBlock;   // Last block number that rewards distribution occurred
        uint256 accRewardPerShare; // Accumulated rewards per share, times 1e18
        uint256 totalStaked;       // Total amount staked in pool
        uint256 minStakeAmount;    // Minimum stake amount
        uint256 lockPeriod;        // Lock period in seconds
        bool active;               // Pool active status
    }

    // NFT staking configuration
    struct NFTPoolInfo {
        IERC721 nftContract;       // NFT contract address
        uint256 baseRewardRate;    // Base reward rate per NFT per block
        uint256 totalStaked;       // Total NFTs staked
        mapping(uint256 => uint256) rarityMultipliers; // Rarity-based multipliers
        bool active;
    }

    // User staking information
    struct UserInfo {
        uint256 amount;            // Amount staked
        uint256 rewardDebt;        // Reward debt
        uint256 lockEndTime;       // When tokens can be unstaked
        uint256 lastStakeTime;     // Last stake timestamp
        uint256[] stakedNFTs;      // Array of staked NFT token IDs
        uint256 tierMultiplier;    // User's tier-based multiplier (basis points)
    }

    // Booster system
    struct Booster {
        uint256 multiplier;        // Multiplier in basis points (10000 = 100%)
        uint256 duration;          // Duration in seconds
        uint256 cost;              // Cost in reward tokens
        bool active;
    }

    // Storage
    PoolInfo[] public poolInfo;
    mapping(uint256 => NFTPoolInfo) public nftPoolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => mapping(uint256 => uint256)) public nftStakeTime;
    mapping(uint256 => Booster) public boosters;
    mapping(address => mapping(uint256 => uint256)) public userBoosterEndTime;

    IERC20 public rewardToken;
    uint256 public rewardPerBlock;
    uint256 public totalAllocPoint;
    uint256 public startBlock;
    uint256 public bonusEndBlock;
    uint256 public constant BONUS_MULTIPLIER = 2;

    // Fee structure
    uint256 public earlyWithdrawFee = 500; // 5% in basis points
    uint256 public performanceFee = 200;   // 2% in basis points
    address public feeRecipient;

    // Events
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event NFTStaked(address indexed user, uint256 indexed poolId, uint256 tokenId);
    event NFTUnstaked(address indexed user, uint256 indexed poolId, uint256 tokenId);
    event RewardClaimed(address indexed user, uint256 amount);
    event BoosterActivated(address indexed user, uint256 boosterId, uint256 endTime);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _bonusEndBlock,
        address _feeRecipient
    ) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        bonusEndBlock = _bonusEndBlock;
        feeRecipient = _feeRecipient;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Add new staking pool
     */
    function addPool(
        uint256 _allocPoint,
        IERC20 _stakingToken,
        uint256 _minStakeAmount,
        uint256 _lockPeriod,
        bool _withUpdate
    ) external onlyRole(ADMIN_ROLE) {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            stakingToken: _stakingToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            totalStaked: 0,
            minStakeAmount: _minStakeAmount,
            lockPeriod: _lockPeriod,
            active: true
        }));
    }

    /**
     * @dev Add NFT staking pool
     */
    function addNFTPool(
        uint256 _poolId,
        IERC721 _nftContract,
        uint256 _baseRewardRate
    ) external onlyRole(ADMIN_ROLE) {
        NFTPoolInfo storage pool = nftPoolInfo[_poolId];
        pool.nftContract = _nftContract;
        pool.baseRewardRate = _baseRewardRate;
        pool.active = true;
    }

    /**
     * @dev Set rarity multiplier for NFT pool
     */
    function setRarityMultiplier(
        uint256 _poolId,
        uint256 _rarity,
        uint256 _multiplier
    ) external onlyRole(ADMIN_ROLE) {
        nftPoolInfo[_poolId].rarityMultipliers[_rarity] = _multiplier;
    }

    /**
     * @dev Update pool allocation points
     */
    function setPoolAllocPoint(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyRole(ADMIN_ROLE) {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @dev Get multiplier for reward calculation
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= bonusEndBlock) {
            return (_to - _from) * BONUS_MULTIPLIER;
        } else if (_from >= bonusEndBlock) {
            return _to - _from;
        } else {
            return (bonusEndBlock - _from) * BONUS_MULTIPLIER + (_to - bonusEndBlock);
        }
    }

    /**
     * @dev View pending rewards for user
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalStaked;
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (reward * 1e18) / lpSupply;
        }
        
        uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;
        
        // Apply tier multiplier
        pending = (pending * (10000 + user.tierMultiplier)) / 10000;
        
        // Apply booster if active
        if (userBoosterEndTime[_user][_pid] > block.timestamp) {
            uint256 boosterId = _getActiveBooster(_user, _pid);
            if (boosterId > 0) {
                pending = (pending * (10000 + boosters[boosterId].multiplier)) / 10000;
            }
        }
        
        return pending;
    }

    /**
     * @dev Update reward variables for all pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @dev Update reward variables for specific pool
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
        
        pool.accRewardPerShare += (reward * 1e18) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev Stake tokens
     */
    function deposit(uint256 _pid, uint256 _amount) external whenNotPaused nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(pool.active, "Pool not active");
        require(_amount >= pool.minStakeAmount, "Amount below minimum");
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / 1e18 - user.rewardDebt;
            if (pending > 0) {
                _safeRewardTransfer(msg.sender, pending);
            }
        }
        
        if (_amount > 0) {
            pool.stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            pool.totalStaked += _amount;
            user.lockEndTime = block.timestamp + pool.lockPeriod;
            user.lastStakeTime = block.timestamp;
        }
        
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Stake NFT
     */
    function stakeNFT(uint256 _poolId, uint256 _tokenId) external whenNotPaused nonReentrant {
        NFTPoolInfo storage pool = nftPoolInfo[_poolId];
        require(pool.active, "Pool not active");
        require(pool.nftContract.ownerOf(_tokenId) == msg.sender, "Not token owner");
        
        pool.nftContract.transferFrom(msg.sender, address(this), _tokenId);
        
        UserInfo storage user = userInfo[_poolId][msg.sender];
        user.stakedNFTs.push(_tokenId);
        pool.totalStaked++;
        nftStakeTime[msg.sender][_tokenId] = block.timestamp;
        
        emit NFTStaked(msg.sender, _poolId, _tokenId);
    }

    /**
     * @dev Unstake NFT
     */
    function unstakeNFT(uint256 _poolId, uint256 _tokenId) external nonReentrant {
        NFTPoolInfo storage pool = nftPoolInfo[_poolId];
        UserInfo storage user = userInfo[_poolId][msg.sender];
        
        require(_isNFTStaked(user.stakedNFTs, _tokenId), "NFT not staked");
        
        // Calculate and transfer rewards
        uint256 stakingDuration = block.timestamp - nftStakeTime[msg.sender][_tokenId];
        uint256 reward = _calculateNFTReward(_poolId, _tokenId, stakingDuration);
        
        if (reward > 0) {
            _safeRewardTransfer(msg.sender, reward);
        }
        
        // Remove NFT from staked list
        _removeNFTFromStaked(user.stakedNFTs, _tokenId);
        pool.totalStaked--;
        delete nftStakeTime[msg.sender][_tokenId];
        
        pool.nftContract.transferFrom(address(this), msg.sender, _tokenId);
        emit NFTUnstaked(msg.sender, _poolId, _tokenId);
    }

    /**
     * @dev Withdraw staked tokens
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e18 - user.rewardDebt;
        if (pending > 0) {
            _safeRewardTransfer(msg.sender, pending);
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;
            
            // Apply early withdrawal fee if still locked
            uint256 transferAmount = _amount;
            if (block.timestamp < user.lockEndTime) {
                uint256 fee = (_amount * earlyWithdrawFee) / 10000;
                transferAmount = _amount - fee;
                pool.stakingToken.safeTransfer(feeRecipient, fee);
            }
            
            pool.stakingToken.safeTransfer(msg.sender, transferAmount);
        }
        
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Activate booster
     */
    function activateBooster(uint256 _pid, uint256 _boosterId) external nonReentrant {
        Booster storage booster = boosters[_boosterId];
        require(booster.active, "Booster not active");
        require(userBoosterEndTime[msg.sender][_pid] <= block.timestamp, "Booster already active");
        
        // Pay booster cost
        rewardToken.safeTransferFrom(msg.sender, address(this), booster.cost);
        
        userBoosterEndTime[msg.sender][_pid] = block.timestamp + booster.duration;
        emit BoosterActivated(msg.sender, _boosterId, userBoosterEndTime[msg.sender][_pid]);
    }

    /**
     * @dev Set user tier multiplier (called by tier system)
     */
    function setUserTierMultiplier(
        address _user,
        uint256 _pid,
        uint256 _multiplier
    ) external onlyRole(OPERATOR_ROLE) {
        userInfo[_pid][_user].tierMultiplier = _multiplier;
    }

    /**
     * @dev Calculate NFT reward based on rarity and staking duration
     */
    function _calculateNFTReward(
        uint256 _poolId,
        uint256 _tokenId,
        uint256 _duration
    ) internal view returns (uint256) {
        NFTPoolInfo storage pool = nftPoolInfo[_poolId];
        
        // Get NFT rarity (this would need to be implemented in the NFT contract)
        uint256 rarity = 1; // Default rarity
        uint256 multiplier = pool.rarityMultipliers[rarity];
        if (multiplier == 0) multiplier = 10000; // Default 100%
        
        uint256 baseReward = (pool.baseRewardRate * _duration) / 1 days;
        return (baseReward * multiplier) / 10000;
    }

    /**
     * @dev Safe reward transfer with supply check
     */
    function _safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.safeTransfer(_to, rewardBal);
        } else {
            rewardToken.safeTransfer(_to, _amount);
        }
        emit RewardClaimed(_to, _amount);
    }

    /**
     * @dev Check if NFT is staked by user
     */
    function _isNFTStaked(uint256[] storage stakedNFTs, uint256 tokenId) internal view returns (bool) {
        for (uint256 i = 0; i < stakedNFTs.length; i++) {
            if (stakedNFTs[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Remove NFT from staked array
     */
    function _removeNFTFromStaked(uint256[] storage stakedNFTs, uint256 tokenId) internal {
        for (uint256 i = 0; i < stakedNFTs.length; i++) {
            if (stakedNFTs[i] == tokenId) {
                stakedNFTs[i] = stakedNFTs[stakedNFTs.length - 1];
                stakedNFTs.pop();
                break;
            }
        }
    }

    /**
     * @dev Get active booster for user
     */
    function _getActiveBooster(address _user, uint256 _pid) internal view returns (uint256) {
        // Implementation would track which booster is active for user
        return 0; // Simplified for this example
    }

    // Admin functions
    function addBooster(
        uint256 _boosterId,
        uint256 _multiplier,
        uint256 _duration,
        uint256 _cost
    ) external onlyRole(ADMIN_ROLE) {
        boosters[_boosterId] = Booster({
            multiplier: _multiplier,
            duration: _duration,
            cost: _cost,
            active: true
        });
    }

    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyRole(ADMIN_ROLE) {
        massUpdatePools();
        rewardPerBlock = _rewardPerBlock;
    }

    function setFees(uint256 _earlyWithdrawFee, uint256 _performanceFee) external onlyRole(ADMIN_ROLE) {
        require(_earlyWithdrawFee <= 1000, "Fee too high"); // Max 10%
        require(_performanceFee <= 500, "Fee too high");    // Max 5%
        earlyWithdrawFee = _earlyWithdrawFee;
        performanceFee = _performanceFee;
    }

    // Emergency functions
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalStaked -= amount;
        
        pool.stakingToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }
}
