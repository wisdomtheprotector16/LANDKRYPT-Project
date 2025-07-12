// Enhanced Marketplace Tests
// Tests for advanced marketplace with auctions, offers, and royalty support

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');

describe('EnhancedMarketplace', function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, feeRecipient, royaltyRecipient] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const token = await MockERC20.deploy('Test Token', 'TEST', ethers.utils.parseEther('1000000'));
    await token.deployed();

    // Deploy mock NFT
    const MockNFT = await ethers.getContractFactory('MockNFT');
    const nft = await MockNFT.deploy('Test NFT', 'TNFT');
    await nft.deployed();

    // Deploy marketplace
    const EnhancedMarketplace = await ethers.getContractFactory('EnhancedMarketplace');
    const marketplace = await EnhancedMarketplace.deploy(feeRecipient.address);
    await marketplace.deployed();

    // Setup
    await marketplace.setSupportedNFT(nft.address, true);
    await marketplace.setSupportedToken(token.address, true);
    await marketplace.setSupportedToken(ethers.constants.AddressZero, true); // ETH

    // Mint NFT to seller
    await nft.mint(seller.address, 1);
    await nft.connect(seller).setApprovalForAll(marketplace.address, true);

    // Give tokens to buyer
    await token.transfer(buyer.address, ethers.utils.parseEther('10000'));
    await token.connect(buyer).approve(marketplace.address, ethers.utils.parseEther('10000'));

    return {
      marketplace,
      nft,
      token,
      owner,
      seller,
      buyer,
      feeRecipient,
      royaltyRecipient
    };
  }

  describe('Fixed Price Listings', function () {
    it('Should create fixed price listing', async function () {
      const { marketplace, nft, token, seller } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther('1');
      const duration = 7 * 24 * 60 * 60; // 7 days

      const tx = await marketplace.connect(seller).createListing(
        nft.address,
        1,
        price,
        token.address,
        duration
      );

      const receipt = await tx.wait();
      const listingId = 0; // First listing

      const listing = await marketplace.listings(listingId);
      expect(listing.price).to.equal(price);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.listingType).to.equal(0); // FIXED_PRICE
      expect(listing.status).to.equal(0); // ACTIVE

      await expect(tx)
        .to.emit(marketplace, 'ListingCreated')
        .withArgs(listingId, nft.address, 1, seller.address, price, 0);
    });

    it('Should purchase from fixed price listing', async function () {
      const { marketplace, nft, token, seller, buyer, feeRecipient } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther('1');
      const duration = 7 * 24 * 60 * 60;

      // Create listing
      await marketplace.connect(seller).createListing(
        nft.address,
        1,
        price,
        token.address,
        duration
      );

      const initialSellerBalance = await token.balanceOf(seller.address);
      const initialFeeBalance = await token.balanceOf(feeRecipient.address);

      // Purchase
      await marketplace.connect(buyer).purchase(0, nft.address, 1, token.address);

      // Verify NFT transfer
      expect(await nft.ownerOf(1)).to.equal(buyer.address);

      // Verify payment distribution
      const platformFee = price.mul(250).div(10000); // 2.5%
      const sellerAmount = price.sub(platformFee);

      expect(await token.balanceOf(seller.address)).to.equal(initialSellerBalance.add(sellerAmount));
      expect(await token.balanceOf(feeRecipient.address)).to.equal(initialFeeBalance.add(platformFee));

      // Verify listing status
      const listing = await marketplace.listings(0);
      expect(listing.status).to.equal(1); // SOLD
      expect(listing.buyer).to.equal(buyer.address);
    });

    it('Should handle ETH payments', async function () {
      const { marketplace, nft, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const price = ethers.utils.parseEther('1');
      const duration = 7 * 24 * 60 * 60;

      // Create listing with ETH
      await marketplace.connect(seller).createListing(
        nft.address,
        1,
        price,
        ethers.constants.AddressZero, // ETH
        duration
      );

      const initialSellerBalance = await ethers.provider.getBalance(seller.address);

      // Purchase with ETH
      await marketplace.connect(buyer).purchase(
        0,
        nft.address,
        1,
        ethers.constants.AddressZero,
        { value: price }
      );

      // Verify NFT transfer
      expect(await nft.ownerOf(1)).to.equal(buyer.address);

      // Verify ETH payment (seller should receive payment minus fees)
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance).to.be.gt(initialSellerBalance);
    });
  });

  describe('Dutch Auctions', function () {
    it('Should create Dutch auction', async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      const startPrice = ethers.utils.parseEther('2');
      const endPrice = ethers.utils.parseEther('1');
      const duration = 24 * 60 * 60; // 24 hours

      const tx = await marketplace.connect(seller).createDutchAuction(
        nft.address,
        1,
        startPrice,
        endPrice,
        duration
      );

      const auctionId = 0;
      const auction = await marketplace.dutchAuctions(auctionId);
      
      expect(auction.startPrice).to.equal(startPrice);
      expect(auction.endPrice).to.equal(endPrice);
      expect(auction.duration).to.equal(duration);

      await expect(tx)
        .to.emit(marketplace, 'AuctionCreated')
        .withArgs(auctionId, nft.address, 1, seller.address, startPrice, endPrice);
    });

    it('Should calculate correct Dutch auction price', async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      const startPrice = ethers.utils.parseEther('2');
      const endPrice = ethers.utils.parseEther('1');
      const duration = 24 * 60 * 60; // 24 hours

      await marketplace.connect(seller).createDutchAuction(
        nft.address,
        1,
        startPrice,
        endPrice,
        duration
      );

      // At start, price should be start price
      let currentPrice = await marketplace.getCurrentDutchPrice(0);
      expect(currentPrice).to.equal(startPrice);

      // After half duration, price should be halfway
      await time.increase(12 * 60 * 60); // 12 hours
      currentPrice = await marketplace.getCurrentDutchPrice(0);
      const expectedPrice = startPrice.add(endPrice).div(2); // Average
      expect(currentPrice).to.be.closeTo(expectedPrice, ethers.utils.parseEther('0.1'));

      // After full duration, price should be end price
      await time.increase(12 * 60 * 60); // Another 12 hours
      currentPrice = await marketplace.getCurrentDutchPrice(0);
      expect(currentPrice).to.equal(endPrice);
    });

    it('Should purchase from Dutch auction at current price', async function () {
      const { marketplace, nft, token, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const startPrice = ethers.utils.parseEther('2');
      const endPrice = ethers.utils.parseEther('1');
      const duration = 24 * 60 * 60;

      await marketplace.connect(seller).createDutchAuction(
        nft.address,
        1,
        startPrice,
        endPrice,
        duration
      );

      // Wait for price to drop
      await time.increase(12 * 60 * 60); // 12 hours

      const currentPrice = await marketplace.getCurrentDutchPrice(0);
      
      // Purchase at current price
      await marketplace.connect(buyer).purchase(0, nft.address, 1, token.address);

      // Verify NFT transfer
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });
  });

  describe('Offer System', function () {
    it('Should make offer on NFT', async function () {
      const { marketplace, nft, token, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = ethers.utils.parseEther('1.5');
      const expiry = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days

      const tx = await marketplace.connect(buyer).makeOffer(
        nft.address,
        1,
        amount,
        token.address,
        expiry
      );

      // Verify tokens were escrowed
      expect(await token.balanceOf(marketplace.address)).to.equal(amount);

      await expect(tx)
        .to.emit(marketplace, 'OfferMade')
        .withArgs(nft.address, 1, buyer.address, amount, expiry);
    });

    it('Should accept offer', async function () {
      const { marketplace, nft, token, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = ethers.utils.parseEther('1.5');
      const expiry = (await time.latest()) + 7 * 24 * 60 * 60;

      // Make offer
      await marketplace.connect(buyer).makeOffer(
        nft.address,
        1,
        amount,
        token.address,
        expiry
      );

      const initialSellerBalance = await token.balanceOf(seller.address);

      // Accept offer
      await marketplace.connect(seller).acceptOffer(nft.address, 1, 0);

      // Verify NFT transfer
      expect(await nft.ownerOf(1)).to.equal(buyer.address);

      // Verify payment (minus fees)
      const platformFee = amount.mul(250).div(10000); // 2.5%
      const sellerAmount = amount.sub(platformFee);
      expect(await token.balanceOf(seller.address)).to.equal(initialSellerBalance.add(sellerAmount));
    });

    it('Should reject expired offers', async function () {
      const { marketplace, nft, token, seller, buyer } = await loadFixture(deployMarketplaceFixture);

      const amount = ethers.utils.parseEther('1.5');
      const expiry = (await time.latest()) + 60; // 1 minute

      // Make offer
      await marketplace.connect(buyer).makeOffer(
        nft.address,
        1,
        amount,
        token.address,
        expiry
      );

      // Wait for expiry
      await time.increase(120); // 2 minutes

      // Try to accept expired offer
      await expect(
        marketplace.connect(seller).acceptOffer(nft.address, 1, 0)
      ).to.be.revertedWith('Offer expired');
    });
  });

  describe('Tier-based Fee Discounts', function () {
    it('Should apply tier discounts to fees', async function () {
      const { marketplace, nft, token, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);

      // Set tier discount for seller (10% discount = 1000 basis points)
      await marketplace.connect(owner).setTierDiscount(seller.address, 1000);

      const price = ethers.utils.parseEther('1');
      const duration = 7 * 24 * 60 * 60;

      // Create listing
      await marketplace.connect(seller).createListing(
        nft.address,
        1,
        price,
        token.address,
        duration
      );

      const initialSellerBalance = await token.balanceOf(seller.address);

      // Purchase
      await marketplace.connect(buyer).purchase(0, nft.address, 1, token.address);

      // Calculate expected amounts with discount
      const baseFee = price.mul(250).div(10000); // 2.5%
      const discount = baseFee.mul(1000).div(10000); // 10% discount
      const actualFee = baseFee.sub(discount);
      const sellerAmount = price.sub(actualFee);

      expect(await token.balanceOf(seller.address)).to.equal(initialSellerBalance.add(sellerAmount));
    });
  });

  describe('Royalty Support', function () {
    it('Should handle royalties with EIP-2981', async function () {
      const { marketplace, token, seller, buyer, royaltyRecipient } = await loadFixture(deployMarketplaceFixture);

      // Deploy NFT with royalty support
      const MockRoyaltyNFT = await ethers.getContractFactory('MockRoyaltyNFT');
      const royaltyNFT = await MockRoyaltyNFT.deploy('Royalty NFT', 'RNFT');
      await royaltyNFT.deployed();

      // Set up royalty (5% to royalty recipient)
      await royaltyNFT.setDefaultRoyalty(royaltyRecipient.address, 500);
      
      // Mint and approve
      await royaltyNFT.mint(seller.address, 1);
      await royaltyNFT.connect(seller).setApprovalForAll(marketplace.address, true);
      
      // Add to supported NFTs
      await marketplace.setSupportedNFT(royaltyNFT.address, true);

      const price = ethers.utils.parseEther('1');
      const duration = 7 * 24 * 60 * 60;

      // Create listing
      await marketplace.connect(seller).createListing(
        royaltyNFT.address,
        1,
        price,
        token.address,
        duration
      );

      const initialRoyaltyBalance = await token.balanceOf(royaltyRecipient.address);

      // Purchase
      await marketplace.connect(buyer).purchase(0, royaltyNFT.address, 1, token.address);

      // Verify royalty payment (5% of price)
      const royaltyAmount = price.mul(500).div(10000);
      expect(await token.balanceOf(royaltyRecipient.address)).to.equal(
        initialRoyaltyBalance.add(royaltyAmount)
      );
    });
  });

  describe('Admin Functions', function () {
    it('Should set platform fee', async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).setPlatformFee(300); // 3%
      expect(await marketplace.platformFee()).to.equal(300);
    });

    it('Should reject excessive platform fees', async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(owner).setPlatformFee(1100) // 11% (over 10% limit)
      ).to.be.revertedWith('Fee too high');
    });

    it('Should set supported tokens and NFTs', async function () {
      const { marketplace, nft, token, owner } = await loadFixture(deployMarketplaceFixture);

      // Disable token
      await marketplace.connect(owner).setSupportedToken(token.address, false);
      expect(await marketplace.supportedTokens(token.address)).to.be.false;

      // Re-enable token
      await marketplace.connect(owner).setSupportedToken(token.address, true);
      expect(await marketplace.supportedTokens(token.address)).to.be.true;

      // Same for NFTs
      await marketplace.connect(owner).setSupportedNFT(nft.address, false);
      expect(await marketplace.supportedNFTs(nft.address)).to.be.false;
    });
  });

  describe('Security Features', function () {
    it('Should prevent listing unsupported NFTs', async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      // Deploy unsupported NFT
      const MockNFT = await ethers.getContractFactory('MockNFT');
      const unsupportedNFT = await MockNFT.deploy('Unsupported', 'UNSUP');
      await unsupportedNFT.deployed();

      await expect(
        marketplace.connect(seller).createListing(
          unsupportedNFT.address,
          1,
          ethers.utils.parseEther('1'),
          ethers.constants.AddressZero,
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith('NFT contract not supported');
    });

    it('Should prevent listing with unsupported currency', async function () {
      const { marketplace, nft, seller } = await loadFixture(deployMarketplaceFixture);

      // Deploy unsupported token
      const MockERC20 = await ethers.getContractFactory('MockERC20');
      const unsupportedToken = await MockERC20.deploy('Unsupported', 'UNSUP', 1000);
      await unsupportedToken.deployed();

      await expect(
        marketplace.connect(seller).createListing(
          nft.address,
          1,
          ethers.utils.parseEther('1'),
          unsupportedToken.address,
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith('Currency not supported');
    });

    it('Should prevent non-owners from listing', async function () {
      const { marketplace, nft, token, buyer } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(buyer).createListing(
          nft.address,
          1,
          ethers.utils.parseEther('1'),
          token.address,
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith('Not token owner');
    });
  });

  describe('Emergency Functions', function () {
    it('Should allow emergency withdrawal', async function () {
      const { marketplace, token, owner, buyer } = await loadFixture(deployMarketplaceFixture);

      // Send tokens to marketplace (simulate stuck funds)
      await token.connect(buyer).transfer(marketplace.address, ethers.utils.parseEther('100'));

      const initialBalance = await token.balanceOf(owner.address);

      // Emergency withdraw
      await marketplace.connect(owner).emergencyWithdraw(token.address);

      const finalBalance = await token.balanceOf(owner.address);
      expect(finalBalance).to.equal(initialBalance.add(ethers.utils.parseEther('100')));
    });
  });
});
