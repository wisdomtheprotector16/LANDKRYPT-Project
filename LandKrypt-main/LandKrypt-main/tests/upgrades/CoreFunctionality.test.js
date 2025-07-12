// Core Functionality Tests
// Tests to verify that upgrades maintain LandKrypt's core functionality

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('LandKrypt Core Functionality with Upgrades', function () {
  async function deployLandKryptUpgradesFixture() {
    const [owner, admin, minter, user1, user2, feeRecipient] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const token = await MockERC20.deploy('LandKrypt Token', 'LKT', ethers.utils.parseEther('1000000'));
    await token.deployed();

    // Deploy Gas Optimized NFT
    const GasOptimizedNFT = await ethers.getContractFactory('GasOptimizedNFT');
    const nft = await GasOptimizedNFT.deploy('LandKrypt Property', 'LKPROP', owner.address);
    await nft.deployed();

    // Deploy Enhanced Marketplace
    const EnhancedMarketplace = await ethers.getContractFactory('EnhancedMarketplace');
    const marketplace = await EnhancedMarketplace.deploy(feeRecipient.address);
    await marketplace.deployed();

    // Deploy Advanced Staking
    const AdvancedStaking = await ethers.getContractFactory('AdvancedStaking');
    const staking = await AdvancedStaking.deploy(
      token.address,
      ethers.utils.parseEther('1'), // 1 token per block
      await ethers.provider.getBlockNumber(),
      (await ethers.provider.getBlockNumber()) + 1000,
      feeRecipient.address
    );
    await staking.deployed();

    // Deploy Quadratic Governance
    const QuadraticGovernance = await ethers.getContractFactory('QuadraticGovernance');
    const governance = await QuadraticGovernance.deploy(
      token.address,
      nft.address,
      staking.address,
      owner.address // Tier contract placeholder
    );
    await governance.deployed();

    // Setup roles and permissions
    const MINTER_ROLE = await nft.MINTER_ROLE();
    await nft.grantRole(MINTER_ROLE, minter.address);
    await nft.grantRole(MINTER_ROLE, owner.address);

    // Configure marketplace
    await marketplace.setSupportedNFT(nft.address, true);
    await marketplace.setSupportedToken(token.address, true);
    await marketplace.setSupportedToken(ethers.constants.AddressZero, true); // ETH

    // Add staking pool
    await staking.addPool(100, token.address, ethers.utils.parseEther('1'), 0, false);

    // Distribute tokens
    await token.transfer(user1.address, ethers.utils.parseEther('10000'));
    await token.transfer(user2.address, ethers.utils.parseEther('10000'));
    await token.transfer(staking.address, ethers.utils.parseEther('100000')); // Rewards

    return {
      nft,
      marketplace,
      staking,
      governance,
      token,
      owner,
      admin,
      minter,
      user1,
      user2,
      feeRecipient
    };
  }

  describe('Core NFT Functionality', function () {
    it('Should maintain basic NFT minting capability', async function () {
      const { nft, minter, user1 } = await loadFixture(deployLandKryptUpgradesFixture);

      const propertyData = {
        price: ethers.utils.parseEther('2.5'),
        propertyType: 1, // Villa
        location: 1, // Lagos
        rarity: 3, // Rare
        attributes: 0x1234,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(
        user1.address,
        'ipfs://QmTestProperty1',
        propertyData,
        250 // 2.5% royalty
      );

      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.totalSupply()).to.equal(1);

      const storedData = await nft.getPropertyData(0);
      expect(storedData.price).to.equal(propertyData.price);
      expect(storedData.propertyType).to.equal(propertyData.propertyType);
      expect(storedData.location).to.equal(propertyData.location);
      expect(storedData.rarity).to.equal(propertyData.rarity);
    });

    it('Should support batch minting for efficiency', async function () {
      const { nft, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      const batchData = [
        {
          to: user1.address,
          uri: 'ipfs://batch1',
          propertyData: {
            price: ethers.utils.parseEther('1'),
            propertyType: 1,
            location: 1,
            rarity: 1,
            attributes: 0,
            timestamp: Math.floor(Date.now() / 1000)
          },
          royaltyFee: 250
        },
        {
          to: user2.address,
          uri: 'ipfs://batch2',
          propertyData: {
            price: ethers.utils.parseEther('2'),
            propertyType: 2,
            location: 2,
            rarity: 2,
            attributes: 0,
            timestamp: Math.floor(Date.now() / 1000)
          },
          royaltyFee: 300
        }
      ];

      const tokenIds = await nft.connect(minter).batchMint(batchData);
      
      expect(await nft.totalSupply()).to.equal(2);
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it('Should maintain ERC721 standard compliance', async function () {
      const { nft, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://test', propertyData, 0);

      // Test standard ERC721 functions
      expect(await nft.balanceOf(user1.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(user1.address);

      // Test transfer
      await nft.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(user2.address);
      expect(await nft.balanceOf(user1.address)).to.equal(0);
      expect(await nft.balanceOf(user2.address)).to.equal(1);
    });
  });

  describe('Core Marketplace Functionality', function () {
    it('Should maintain basic listing and purchasing', async function () {
      const { nft, marketplace, token, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Mint NFT
      const propertyData = {
        price: ethers.utils.parseEther('2'),
        propertyType: 1,
        location: 1,
        rarity: 2,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://marketplace-test', propertyData, 250);
      await nft.connect(user1).setApprovalForAll(marketplace.address, true);

      // Create listing
      const listingPrice = ethers.utils.parseEther('1.5');
      await marketplace.connect(user1).createListing(
        nft.address,
        0,
        listingPrice,
        token.address,
        7 * 24 * 60 * 60 // 7 days
      );

      // Approve and purchase
      await token.connect(user2).approve(marketplace.address, listingPrice);
      await marketplace.connect(user2).purchase(0, nft.address, 0, token.address);

      // Verify transfer
      expect(await nft.ownerOf(0)).to.equal(user2.address);

      // Verify payment (minus fees)
      const platformFee = listingPrice.mul(250).div(10000); // 2.5%
      const royaltyFee = listingPrice.mul(250).div(10000); // 2.5%
      const sellerAmount = listingPrice.sub(platformFee).sub(royaltyFee);
      
      expect(await token.balanceOf(user1.address)).to.be.gte(
        ethers.utils.parseEther('10000').add(sellerAmount).sub(ethers.utils.parseEther('1'))
      );
    });

    it('Should support Dutch auctions', async function () {
      const { nft, marketplace, token, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Mint and approve NFT
      const propertyData = {
        price: ethers.utils.parseEther('3'),
        propertyType: 2,
        location: 2,
        rarity: 3,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://auction-test', propertyData, 0);
      await nft.connect(user1).setApprovalForAll(marketplace.address, true);

      // Create Dutch auction
      const startPrice = ethers.utils.parseEther('3');
      const endPrice = ethers.utils.parseEther('1');
      const duration = 24 * 60 * 60; // 24 hours

      await marketplace.connect(user1).createDutchAuction(
        nft.address,
        0,
        startPrice,
        endPrice,
        duration
      );

      // Check initial price
      const initialPrice = await marketplace.getCurrentDutchPrice(0);
      expect(initialPrice).to.equal(startPrice);

      // Fast forward time and check price decrease
      await ethers.provider.send('evm_increaseTime', [12 * 60 * 60]); // 12 hours
      await ethers.provider.send('evm_mine');

      const midPrice = await marketplace.getCurrentDutchPrice(0);
      expect(midPrice).to.be.lt(startPrice);
      expect(midPrice).to.be.gt(endPrice);
    });

    it('Should support offer system', async function () {
      const { nft, marketplace, token, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Mint NFT
      const propertyData = {
        price: ethers.utils.parseEther('2'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://offer-test', propertyData, 0);

      // Make offer
      const offerAmount = ethers.utils.parseEther('1.8');
      const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

      await token.connect(user2).approve(marketplace.address, offerAmount);
      await marketplace.connect(user2).makeOffer(
        nft.address,
        0,
        offerAmount,
        token.address,
        expiry
      );

      // Verify offer was escrowed
      expect(await token.balanceOf(marketplace.address)).to.equal(offerAmount);

      // Accept offer
      await marketplace.connect(user1).acceptOffer(nft.address, 0, 0);

      // Verify NFT transfer
      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });
  });

  describe('Core Staking Functionality', function () {
    it('Should maintain basic token staking', async function () {
      const { staking, token, user1 } = await loadFixture(deployLandKryptUpgradesFixture);

      const stakeAmount = ethers.utils.parseEther('100');
      
      // Approve and stake
      await token.connect(user1).approve(staking.address, stakeAmount);
      await staking.connect(user1).deposit(0, stakeAmount);

      // Verify staking
      const userInfo = await staking.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(stakeAmount);

      // Check pool info
      const poolInfo = await staking.poolInfo(0);
      expect(poolInfo.totalStaked).to.equal(stakeAmount);
    });

    it('Should calculate and distribute rewards', async function () {
      const { staking, token, user1 } = await loadFixture(deployLandKryptUpgradesFixture);

      const stakeAmount = ethers.utils.parseEther('100');
      
      await token.connect(user1).approve(staking.address, stakeAmount);
      await staking.connect(user1).deposit(0, stakeAmount);

      // Mine some blocks to generate rewards
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send('evm_mine');
      }

      // Check pending rewards
      const pendingRewards = await staking.pendingReward(0, user1.address);
      expect(pendingRewards).to.be.gt(0);

      // Withdraw and claim rewards
      const initialBalance = await token.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0, stakeAmount);
      const finalBalance = await token.balanceOf(user1.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });

    it('Should support NFT staking', async function () {
      const { staking, nft, minter, user1 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Mint NFT
      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 2,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://staking-test', propertyData, 0);
      await nft.connect(user1).setApprovalForAll(staking.address, true);

      // Add NFT pool
      await staking.addNFTPool(1, nft.address, ethers.utils.parseEther('0.1'));

      // Stake NFT
      await staking.connect(user1).stakeNFT(1, 0);

      // Verify NFT is staked
      expect(await nft.ownerOf(0)).to.equal(staking.address);

      const nftPoolInfo = await staking.nftPoolInfo(1);
      expect(nftPoolInfo.totalStaked).to.equal(1);
    });
  });

  describe('Core Governance Functionality', function () {
    it('Should maintain basic proposal creation and voting', async function () {
      const { governance, token, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Give user1 enough tokens to create proposal
      const proposalThreshold = await governance.proposalThreshold();
      await token.transfer(user1.address, proposalThreshold);

      // Create proposal
      const targets = [token.address];
      const values = [0];
      const calldatas = [token.interface.encodeFunctionData('transfer', [user2.address, ethers.utils.parseEther('1000')])];
      const description = 'Transfer tokens to user2';

      await governance.connect(user1).propose(targets, values, calldatas, description);

      // Check proposal was created
      const proposal = await governance.proposals(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.description).to.equal(description);
    });

    it('Should support quadratic voting', async function () {
      const { governance, token, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // Test voting power calculation
      const votingPower = await governance.getVotingPower(user1.address, await ethers.provider.getBlockNumber());
      
      // Should have voting power based on token balance
      expect(votingPower.tokenBalance).to.be.gt(0);

      // Test quadratic weight calculation
      const quadraticWeight = await governance.calculateQuadraticWeight(votingPower);
      expect(quadraticWeight).to.be.gt(0);
      
      // Quadratic weight should be less than linear weight for large amounts
      const linearWeight = votingPower.tokenBalance.add(votingPower.nftCount).add(votingPower.stakedAmount);
      expect(quadraticWeight).to.be.lt(linearWeight);
    });
  });

  describe('Gas Optimization Verification', function () {
    it('Should demonstrate gas savings in batch operations', async function () {
      const { nft, minter, user1 } = await loadFixture(deployLandKryptUpgradesFixture);

      const propertyData = {
        price: ethers.utils.parseEther('1'),
        propertyType: 1,
        location: 1,
        rarity: 1,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Single mint
      const singleTx = await nft.connect(minter).mint(user1.address, 'ipfs://single', propertyData, 0);
      const singleReceipt = await singleTx.wait();

      // Batch mint (5 NFTs)
      const batchData = Array(5).fill().map((_, i) => ({
        to: user1.address,
        uri: `ipfs://batch${i}`,
        propertyData,
        royaltyFee: 0
      }));

      const batchTx = await nft.connect(minter).batchMint(batchData);
      const batchReceipt = await batchTx.wait();

      // Calculate gas efficiency
      const singleGas = singleReceipt.gasUsed;
      const batchGas = batchReceipt.gasUsed;
      const gasPerNFTInBatch = batchGas.div(5);
      const gasSavings = singleGas.sub(gasPerNFTInBatch).mul(100).div(singleGas);

      console.log(`Single mint gas: ${singleGas.toString()}`);
      console.log(`Batch mint gas per NFT: ${gasPerNFTInBatch.toString()}`);
      console.log(`Gas savings: ${gasSavings.toString()}%`);

      // Batch should be more efficient
      expect(gasPerNFTInBatch).to.be.lt(singleGas);
      expect(gasSavings).to.be.gte(20); // At least 20% savings
    });
  });

  describe('Integration Tests', function () {
    it('Should support complete user journey: mint -> list -> purchase -> stake', async function () {
      const { nft, marketplace, staking, token, minter, user1, user2 } = await loadFixture(deployLandKryptUpgradesFixture);

      // 1. Mint NFT
      const propertyData = {
        price: ethers.utils.parseEther('2'),
        propertyType: 1,
        location: 1,
        rarity: 2,
        attributes: 0,
        timestamp: Math.floor(Date.now() / 1000)
      };

      await nft.connect(minter).mint(user1.address, 'ipfs://journey-test', propertyData, 250);
      expect(await nft.ownerOf(0)).to.equal(user1.address);

      // 2. List on marketplace
      await nft.connect(user1).setApprovalForAll(marketplace.address, true);
      const listingPrice = ethers.utils.parseEther('1.8');
      
      await marketplace.connect(user1).createListing(
        nft.address,
        0,
        listingPrice,
        token.address,
        7 * 24 * 60 * 60
      );

      // 3. Purchase NFT
      await token.connect(user2).approve(marketplace.address, listingPrice);
      await marketplace.connect(user2).purchase(0, nft.address, 0, token.address);
      expect(await nft.ownerOf(0)).to.equal(user2.address);

      // 4. Stake tokens (simulate user2 staking proceeds)
      const stakeAmount = ethers.utils.parseEther('50');
      await token.connect(user2).approve(staking.address, stakeAmount);
      await staking.connect(user2).deposit(0, stakeAmount);

      const userInfo = await staking.userInfo(0, user2.address);
      expect(userInfo.amount).to.equal(stakeAmount);

      console.log('✅ Complete user journey test passed!');
    });
  });
});
