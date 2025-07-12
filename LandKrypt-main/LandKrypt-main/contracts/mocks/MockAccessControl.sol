// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../upgrades/AccessControlUpgrade.sol";

/**
 * @title MockAccessControl
 * @dev Mock contract for testing AccessControlUpgrade functionality
 */
contract MockAccessControl is AccessControlUpgrade {
    constructor() AccessControlUpgrade() {}

    function testMinterFunction() external onlyRole(MINTER_ROLE) {
        // Test function that requires minter role
    }

    function testRateLimitedFunction() 
        external 
        onlyRole(MINTER_ROLE) 
        rateLimited(bytes4(keccak256("testRateLimitedFunction()")), 60) 
    {
        // Test function with rate limiting (60 second cooldown)
    }

    function testMultiSigFunction(bytes32 operationHash) 
        external 
        onlyRole(ADMIN_ROLE) 
        requireMultiSig(operationHash) 
    {
        // Test function requiring multi-sig approval
    }

    function testTimeLockFunction() external onlyRole(ADMIN_ROLE) {
        // Test function for time-locked operations
    }

    function testPausableFunction() external whenNotPaused {
        // Test function that should be paused when contract is paused
    }

    function testEmergencyFunction() external notInEmergencyMode {
        // Test function that should be blocked in emergency mode
    }

    // Helper function to test role requirements
    function hasAdminRole(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    function hasMinterRole(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    function hasPauserRole(address account) external view returns (bool) {
        return hasRole(PAUSER_ROLE, account);
    }
}
