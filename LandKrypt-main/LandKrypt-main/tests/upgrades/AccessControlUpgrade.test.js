// Access Control Upgrade Tests
// Tests for enhanced role-based access control system

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('AccessControlUpgrade', function () {
  async function deployAccessControlFixture() {
    const [owner, admin, minter, pauser, operator, user1, user2] = await ethers.getSigners();

    // Deploy mock contract that inherits AccessControlUpgrade
    const MockAccessControl = await ethers.getContractFactory('MockAccessControl');
    const accessControl = await MockAccessControl.deploy();
    await accessControl.deployed();

    return {
      accessControl,
      owner,
      admin,
      minter,
      pauser,
      operator,
      user1,
      user2
    };
  }

  describe('Role Management', function () {
    it('Should grant roles correctly', async function () {
      const { accessControl, owner, admin, minter } = await loadFixture(deployAccessControlFixture);

      // Grant admin role
      await accessControl.grantRole(await accessControl.ADMIN_ROLE(), admin.address);
      expect(await accessControl.hasRole(await accessControl.ADMIN_ROLE(), admin.address)).to.be.true;

      // Admin should be able to grant minter role
      await accessControl.connect(admin).grantRole(await accessControl.MINTER_ROLE(), minter.address);
      expect(await accessControl.hasRole(await accessControl.MINTER_ROLE(), minter.address)).to.be.true;
    });

    it('Should revoke roles correctly', async function () {
      const { accessControl, owner, admin, minter } = await loadFixture(deployAccessControlFixture);

      // Grant and then revoke role
      await accessControl.grantRole(await accessControl.MINTER_ROLE(), minter.address);
      expect(await accessControl.hasRole(await accessControl.MINTER_ROLE(), minter.address)).to.be.true;

      await accessControl.revokeRole(await accessControl.MINTER_ROLE(), minter.address);
      expect(await accessControl.hasRole(await accessControl.MINTER_ROLE(), minter.address)).to.be.false;
    });

    it('Should handle batch role operations', async function () {
      const { accessControl, owner, user1, user2 } = await loadFixture(deployAccessControlFixture);

      const addresses = [user1.address, user2.address];
      const minterRole = await accessControl.MINTER_ROLE();

      // Batch grant roles
      await accessControl.grantRoleBatch(minterRole, addresses);
      
      expect(await accessControl.hasRole(minterRole, user1.address)).to.be.true;
      expect(await accessControl.hasRole(minterRole, user2.address)).to.be.true;

      // Batch revoke roles
      await accessControl.revokeRoleBatch(minterRole, addresses);
      
      expect(await accessControl.hasRole(minterRole, user1.address)).to.be.false;
      expect(await accessControl.hasRole(minterRole, user2.address)).to.be.false;
    });

    it('Should enforce role requirements', async function () {
      const { accessControl, user1 } = await loadFixture(deployAccessControlFixture);

      // User without minter role should not be able to call minter function
      await expect(
        accessControl.connect(user1).testMinterFunction()
      ).to.be.revertedWith('AccessControl: account missing role');
    });
  });

  describe('Emergency Controls', function () {
    it('Should activate emergency mode', async function () {
      const { accessControl, owner, pauser } = await loadFixture(deployAccessControlFixture);

      // Grant pauser role
      await accessControl.grantRole(await accessControl.PAUSER_ROLE(), pauser.address);

      // Activate emergency mode
      await accessControl.connect(pauser).activateEmergencyMode();

      expect(await accessControl.emergencyMode()).to.be.true;
      expect(await accessControl.paused()).to.be.true;
    });

    it('Should deactivate emergency mode', async function () {
      const { accessControl, owner, pauser, admin } = await loadFixture(deployAccessControlFixture);

      // Grant roles
      await accessControl.grantRole(await accessControl.PAUSER_ROLE(), pauser.address);
      await accessControl.grantRole(await accessControl.ADMIN_ROLE(), admin.address);

      // Activate then deactivate emergency mode
      await accessControl.connect(pauser).activateEmergencyMode();
      await accessControl.connect(admin).deactivateEmergencyMode();

      expect(await accessControl.emergencyMode()).to.be.false;
      expect(await accessControl.paused()).to.be.false;
    });

    it('Should auto-deactivate emergency mode after duration', async function () {
      const { accessControl, pauser } = await loadFixture(deployAccessControlFixture);

      // Grant pauser role
      await accessControl.grantRole(await accessControl.PAUSER_ROLE(), pauser.address);

      // Activate emergency mode
      await accessControl.connect(pauser).activateEmergencyMode();

      // Fast forward time beyond emergency duration
      await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60 + 1]); // 7 days + 1 second
      await ethers.provider.send('evm_mine');

      // Auto-deactivate should work
      await accessControl.autoDeactivateEmergencyMode();

      expect(await accessControl.emergencyMode()).to.be.false;
      expect(await accessControl.paused()).to.be.false;
    });
  });

  describe('Rate Limiting', function () {
    it('Should enforce rate limits', async function () {
      const { accessControl, owner, minter } = await loadFixture(deployAccessControlFixture);

      // Grant minter role
      await accessControl.grantRole(await accessControl.MINTER_ROLE(), minter.address);

      // First call should succeed
      await accessControl.connect(minter).testRateLimitedFunction();

      // Second immediate call should fail
      await expect(
        accessControl.connect(minter).testRateLimitedFunction()
      ).to.be.revertedWith('Action rate limited');
    });

    it('Should allow calls after cooldown period', async function () {
      const { accessControl, owner, minter } = await loadFixture(deployAccessControlFixture);

      // Grant minter role
      await accessControl.grantRole(await accessControl.MINTER_ROLE(), minter.address);

      // First call
      await accessControl.connect(minter).testRateLimitedFunction();

      // Fast forward past cooldown
      await ethers.provider.send('evm_increaseTime', [61]); // 61 seconds
      await ethers.provider.send('evm_mine');

      // Second call should succeed
      await accessControl.connect(minter).testRateLimitedFunction();
    });
  });

  describe('Multi-Signature Operations', function () {
    it('Should require multiple approvals for critical operations', async function () {
      const { accessControl, owner, admin, user1 } = await loadFixture(deployAccessControlFixture);

      // Grant admin role to user1
      await accessControl.grantRole(await accessControl.ADMIN_ROLE(), user1.address);

      const operationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-operation'));

      // Single approval should not be enough
      await accessControl.connect(admin).approveOperation(operationHash);
      
      await expect(
        accessControl.testMultiSigFunction(operationHash)
      ).to.be.revertedWith('Insufficient multi-sig approvals');

      // Second approval should make it work
      await accessControl.connect(user1).approveOperation(operationHash);
      await accessControl.testMultiSigFunction(operationHash);
    });

    it('Should allow revoking approvals', async function () {
      const { accessControl, owner, admin } = await loadFixture(deployAccessControlFixture);

      const operationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-operation'));

      // Approve then revoke
      await accessControl.connect(admin).approveOperation(operationHash);
      await accessControl.connect(admin).revokeApproval(operationHash);

      // Should not have approval anymore
      await expect(
        accessControl.testMultiSigFunction(operationHash)
      ).to.be.revertedWith('Insufficient multi-sig approvals');
    });
  });

  describe('Time-Locked Operations', function () {
    it('Should schedule operations with time lock', async function () {
      const { accessControl, owner, admin } = await loadFixture(deployAccessControlFixture);

      const operationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-timelock'));
      const data = accessControl.interface.encodeFunctionData('testTimeLockFunction');

      await accessControl.connect(admin).scheduleOperation(operationHash, data);

      // Should not be executable immediately
      await expect(
        accessControl.connect(admin).executeTimeLocked(operationHash)
      ).to.be.revertedWith('Time lock not expired');
    });

    it('Should execute operations after time lock expires', async function () {
      const { accessControl, owner, admin } = await loadFixture(deployAccessControlFixture);

      const operationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test-timelock'));
      const data = accessControl.interface.encodeFunctionData('testTimeLockFunction');

      await accessControl.connect(admin).scheduleOperation(operationHash, data);

      // Fast forward past time lock delay
      await ethers.provider.send('evm_increaseTime', [2 * 24 * 60 * 60 + 1]); // 2 days + 1 second
      await ethers.provider.send('evm_mine');

      // Should be executable now
      await accessControl.connect(admin).executeTimeLocked(operationHash);
    });
  });

  describe('Pause Functionality', function () {
    it('Should pause and unpause contract', async function () {
      const { accessControl, owner, pauser, admin } = await loadFixture(deployAccessControlFixture);

      // Grant roles
      await accessControl.grantRole(await accessControl.PAUSER_ROLE(), pauser.address);
      await accessControl.grantRole(await accessControl.ADMIN_ROLE(), admin.address);

      // Pause contract
      await accessControl.connect(pauser).pause();
      expect(await accessControl.paused()).to.be.true;

      // Functions should be paused
      await expect(
        accessControl.testPausableFunction()
      ).to.be.revertedWith('Pausable: paused');

      // Unpause contract
      await accessControl.connect(admin).unpause();
      expect(await accessControl.paused()).to.be.false;

      // Functions should work again
      await accessControl.testPausableFunction();
    });
  });

  describe('Role Data Tracking', function () {
    it('Should track role member counts', async function () {
      const { accessControl, owner, user1, user2 } = await loadFixture(deployAccessControlFixture);

      const minterRole = await accessControl.MINTER_ROLE();

      // Initial count should be 0
      let roleData = await accessControl.getRoleData(minterRole);
      expect(roleData.memberCount).to.equal(0);

      // Grant roles and check count
      await accessControl.grantRole(minterRole, user1.address);
      await accessControl.grantRole(minterRole, user2.address);

      roleData = await accessControl.getRoleData(minterRole);
      expect(roleData.memberCount).to.equal(2);

      // Revoke role and check count
      await accessControl.revokeRole(minterRole, user1.address);

      roleData = await accessControl.getRoleData(minterRole);
      expect(roleData.memberCount).to.equal(1);
    });
  });

  describe('Gas Optimization', function () {
    it('Should use packed structs efficiently', async function () {
      const { accessControl } = await loadFixture(deployAccessControlFixture);

      const minterRole = await accessControl.MINTER_ROLE();
      const roleData = await accessControl.getRoleData(minterRole);

      // Verify packed struct is working (memberCount and lastUpdate should be accessible)
      expect(roleData.memberCount).to.be.a('number');
      expect(roleData.lastUpdate).to.be.a('number');
    });
  });

  describe('Events', function () {
    it('Should emit correct events', async function () {
      const { accessControl, owner, pauser, admin } = await loadFixture(deployAccessControlFixture);

      // Grant pauser role
      await accessControl.grantRole(await accessControl.PAUSER_ROLE(), pauser.address);

      // Test emergency mode activation event
      await expect(accessControl.connect(pauser).activateEmergencyMode())
        .to.emit(accessControl, 'EmergencyModeActivated')
        .withArgs(pauser.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

      // Grant admin role and test deactivation event
      await accessControl.grantRole(await accessControl.ADMIN_ROLE(), admin.address);
      
      await expect(accessControl.connect(admin).deactivateEmergencyMode())
        .to.emit(accessControl, 'EmergencyModeDeactivated')
        .withArgs(admin.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
    });
  });
});

// Mock contract for testing AccessControlUpgrade
// This would be deployed as part of the test setup
const mockAccessControlSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/upgrades/AccessControlUpgrade.sol";

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
        // Test function with rate limiting
    }

    function testMultiSigFunction(bytes32 operationHash) 
        external 
        onlyRole(ADMIN_ROLE) 
        requireMultiSig(operationHash) 
    {
        // Test function requiring multi-sig
    }

    function testTimeLockFunction() external onlyRole(ADMIN_ROLE) {
        // Test function for time-locked operations
    }

    function testPausableFunction() external whenNotPaused {
        // Test function that should be paused
    }
}
`;
