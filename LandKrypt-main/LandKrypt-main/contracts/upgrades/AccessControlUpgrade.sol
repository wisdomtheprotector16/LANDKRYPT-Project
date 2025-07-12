// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title AccessControlUpgrade
 * @dev Enhanced access control system for LandKrypt contracts
 * Replaces simple Ownable with role-based access control
 */
abstract contract AccessControlUpgrade is
    AccessControl,
    Pausable,
    ReentrancyGuard
{
    using Address for address;

    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    // Emergency controls
    bool public emergencyMode;
    uint256 public emergencyModeTimestamp;
    uint256 public constant EMERGENCY_MODE_DURATION = 7 days;

    // Rate limiting
    mapping(address => mapping(bytes4 => uint256)) private _lastActionTime;
    mapping(bytes4 => uint256) private _actionCooldowns;

    event EmergencyModeActivated(address indexed activator, uint256 timestamp);
    event EmergencyModeDeactivated(
        address indexed deactivator,
        uint256 timestamp
    );
    event RoleGrantedWithExpiry(
        bytes32 indexed role,
        address indexed account,
        uint256 expiry
    );
    event ActionRateLimited(
        address indexed account,
        bytes4 indexed selector,
        uint256 cooldown
    );

    modifier onlyRole(bytes32 role) override {
        _checkRole(role);
        _;
    }

    modifier notInEmergencyMode() {
        require(!emergencyMode, "Contract is in emergency mode");
        _;
    }

    modifier rateLimited(bytes4 selector, uint256 cooldown) {
        require(
            block.timestamp >= _lastActionTime[msg.sender][selector] + cooldown,
            "Action rate limited"
        );
        _lastActionTime[msg.sender][selector] = block.timestamp;
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Set default cooldowns
        _actionCooldowns[
            bytes4(keccak256("mint(address,uint256)"))
        ] = 1 minutes;
        _actionCooldowns[
            bytes4(keccak256("burn(address,uint256)"))
        ] = 1 minutes;
    }

    /**
     * @dev Enhanced role granting with expiry
     */
    function grantRoleWithExpiry(
        bytes32 role,
        address account,
        uint256 expiry
    ) external onlyRole(getRoleAdmin(role)) {
        require(expiry > block.timestamp, "Expiry must be in the future");
        _grantRole(role, account);
        emit RoleGrantedWithExpiry(role, account, expiry);
    }

    /**
     * @dev Batch role operations for efficiency
     */
    function grantRoleBatch(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _grantRole(role, accounts[i]);
        }
    }

    function revokeRoleBatch(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _revokeRole(role, accounts[i]);
        }
    }

    /**
     * @dev Emergency controls
     */
    function activateEmergencyMode() external onlyRole(PAUSER_ROLE) {
        emergencyMode = true;
        emergencyModeTimestamp = block.timestamp;
        _pause();
        emit EmergencyModeActivated(msg.sender, block.timestamp);
    }

    function deactivateEmergencyMode() external onlyRole(ADMIN_ROLE) {
        require(emergencyMode, "Emergency mode not active");
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Auto-deactivate emergency mode after duration
     */
    function autoDeactivateEmergencyMode() external {
        require(emergencyMode, "Emergency mode not active");
        require(
            block.timestamp >= emergencyModeTimestamp + EMERGENCY_MODE_DURATION,
            "Emergency mode duration not elapsed"
        );
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated(address(0), block.timestamp);
    }

    /**
     * @dev Enhanced pause functionality
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Rate limiting configuration
     */
    function setActionCooldown(
        bytes4 selector,
        uint256 cooldown
    ) external onlyRole(ADMIN_ROLE) {
        _actionCooldowns[selector] = cooldown;
    }

    function getActionCooldown(
        bytes4 selector
    ) external view returns (uint256) {
        return _actionCooldowns[selector];
    }

    /**
     * @dev Multi-signature requirement for critical operations
     */
    mapping(bytes32 => mapping(address => bool)) private _multiSigApprovals;
    mapping(bytes32 => uint256) private _multiSigCount;
    uint256 public multiSigThreshold = 2;

    modifier requireMultiSig(bytes32 operationHash) {
        require(
            _multiSigCount[operationHash] >= multiSigThreshold,
            "Insufficient multi-sig approvals"
        );
        _;
        // Clear approvals after execution
        delete _multiSigCount[operationHash];
    }

    function approveOperation(
        bytes32 operationHash
    ) external onlyRole(ADMIN_ROLE) {
        require(
            !_multiSigApprovals[operationHash][msg.sender],
            "Already approved"
        );
        _multiSigApprovals[operationHash][msg.sender] = true;
        _multiSigCount[operationHash]++;
    }

    function revokeApproval(
        bytes32 operationHash
    ) external onlyRole(ADMIN_ROLE) {
        require(_multiSigApprovals[operationHash][msg.sender], "Not approved");
        _multiSigApprovals[operationHash][msg.sender] = false;
        _multiSigCount[operationHash]--;
    }

    /**
     * @dev Time-locked operations for critical changes
     */
    struct TimeLock {
        uint256 executeTime;
        bool executed;
        bytes data;
    }

    mapping(bytes32 => TimeLock) private _timeLocks;
    uint256 public timeLockDelay = 2 days;

    event OperationScheduled(
        bytes32 indexed operationHash,
        uint256 executeTime
    );
    event OperationExecuted(bytes32 indexed operationHash);

    function scheduleOperation(
        bytes32 operationHash,
        bytes calldata data
    ) external onlyRole(ADMIN_ROLE) {
        uint256 executeTime = block.timestamp + timeLockDelay;
        _timeLocks[operationHash] = TimeLock({
            executeTime: executeTime,
            executed: false,
            data: data
        });
        emit OperationScheduled(operationHash, executeTime);
    }

    function executeTimeLocked(
        bytes32 operationHash
    )
        external
        onlyRole(ADMIN_ROLE)
        returns (bool success, bytes memory returnData)
    {
        TimeLock storage timeLock = _timeLocks[operationHash];
        require(timeLock.executeTime != 0, "Operation not scheduled");
        require(
            block.timestamp >= timeLock.executeTime,
            "Time lock not expired"
        );
        require(!timeLock.executed, "Operation already executed");

        timeLock.executed = true;
        (success, returnData) = address(this).call(timeLock.data);
        emit OperationExecuted(operationHash);
    }

    /**
     * @dev Enhanced security checks
     */
    function _checkRole(bytes32 role) internal view override {
        require(
            hasRole(role, msg.sender),
            "AccessControl: account missing role"
        );
        require(
            !emergencyMode || role == ADMIN_ROLE || role == PAUSER_ROLE,
            "Emergency mode: limited access"
        );
    }

    /**
     * @dev Contract upgrade safety
     */
    function _authorizeUpgrade(
        address newImplementation
    )
        internal
        virtual
        onlyRole(ADMIN_ROLE)
        requireMultiSig(
            keccak256(abi.encodePacked("upgrade", newImplementation))
        )
    {
        require(
            newImplementation.isContract(),
            "New implementation must be a contract"
        );
    }

    /**
     * @dev Gas optimization: packed struct for role data
     */
    struct RoleData {
        uint128 memberCount;
        uint128 lastUpdate;
    }

    mapping(bytes32 => RoleData) private _roleData;

    function getRoleData(bytes32 role) external view returns (RoleData memory) {
        return _roleData[role];
    }

    /**
     * @dev Override to update role data
     */
    function _grantRole(bytes32 role, address account) internal override {
        if (!hasRole(role, account)) {
            super._grantRole(role, account);
            _roleData[role].memberCount++;
            _roleData[role].lastUpdate = uint128(block.timestamp);
        }
    }

    function _revokeRole(bytes32 role, address account) internal override {
        if (hasRole(role, account)) {
            super._revokeRole(role, account);
            _roleData[role].memberCount--;
            _roleData[role].lastUpdate = uint128(block.timestamp);
        }
    }
}
