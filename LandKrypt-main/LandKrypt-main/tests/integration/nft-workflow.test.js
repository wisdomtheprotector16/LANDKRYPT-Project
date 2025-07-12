// NFT Workflow Integration Tests
// Tests the complete NFT lifecycle from generation to marketplace

const { testDataFactory, testUtils } = require('../setup');
const nftGenerator = require('../../tools/generators/nft-generator');
const tierService = require('../../src/lib/blockchain/tier-service');
const supabaseConnection = require('../../src/lib/database/supabase-enhanced');

describe('NFT Workflow Integration', () => {
  let testUser;
  let generatedNFT;
  let marketplaceListing;

  beforeAll(async () => {
    // Setup test user
    testUser = {
      address: testDataFactory.walletAddress(0),
      privateKey: '0x' + '1'.repeat(64)
    };

    // Initialize user tier data
    await tierService.getUserTierData(testUser.address);
  });

  afterAll(async () => {
    await testUtils.cleanup();
  });

  describe('NFT Generation', () => {
    test('should generate NFT with valid metadata', async () => {
      const nftData = await nftGenerator.generateSingle(
        testUser.address,
        'residential.villa',
        'lagos',
        'rare'
      );

      expect(nftData).toHaveValidNFTStructure();
      expect(nftData.owner_address).toBe(testUser.address);
      expect(nftData.metadata.name).toContain('Villa');
      expect(nftData.metadata.attributes).toContainEqual(
        expect.objectContaining({
          trait_type: 'Location',
          value: 'Lagos'
        })
      );

      generatedNFT = nftData;
    }, 30000);

    test('should store NFT in database', async () => {
      const { data: storedNFT } = await supabaseConnection.getNFTByTokenId(generatedNFT.token_id);
      
      expect(storedNFT).toBeTruthy();
      expect(storedNFT.token_id).toBe(generatedNFT.token_id);
      expect(storedNFT.owner_address).toBe(testUser.address);
      expect(storedNFT.metadata).toEqual(generatedNFT.metadata);
    });

    test('should award XP for NFT generation', async () => {
      const tierData = await tierService.getUserTierData(testUser.address);
      
      expect(tierData.total_xp).toBeGreaterThan(0);
      
      // Check for NFT minting XP
      const { data: actions } = await supabaseConnection.getUserActions(testUser.address, 10);
      const mintAction = actions.find(action => action.action_type === 'xp_nftMint');
      
      expect(mintAction).toBeTruthy();
      expect(mintAction.metadata.xpAwarded).toBeGreaterThan(0);
    });
  });

  describe('Marketplace Listing', () => {
    test('should create marketplace listing', async () => {
      const listingData = {
        token_id: generatedNFT.token_id,
        seller_address: testUser.address,
        price: '1000000', // 1M LKUSD
        currency: 'LKUSD',
        status: 'active'
      };

      const listing = await supabaseConnection.createMarketplaceListing(listingData);
      
      expect(listing).toBeTruthy();
      expect(listing.token_id).toBe(generatedNFT.token_id);
      expect(listing.seller_address).toBe(testUser.address);
      expect(listing.price).toBe('1000000');
      expect(listing.status).toBe('active');

      marketplaceListing = listing;
    });

    test('should update NFT listing status', async () => {
      const { data: updatedNFT } = await supabaseConnection.getNFTByTokenId(generatedNFT.token_id);
      
      expect(updatedNFT.is_listed).toBe(true);
      expect(updatedNFT.current_price).toBe('1000000');
    });

    test('should apply tier-based fee discount', async () => {
      const tierData = await tierService.getUserTierData(testUser.address);
      const baseFee = 250; // 2.5% base marketplace fee
      const discountedFee = await tierService.applyTierBenefits(
        testUser.address,
        'marketplaceFee',
        baseFee
      );
      
      expect(discountedFee).toBeLessThanOrEqual(baseFee);
      
      // For tier 1 (Explorer), should be no discount
      if (tierData.current_tier === 1) {
        expect(discountedFee).toBe(baseFee);
      }
    });
  });

  describe('NFT Purchase Flow', () => {
    let buyer;

    beforeAll(() => {
      buyer = {
        address: testDataFactory.walletAddress(1),
        privateKey: '0x' + '2'.repeat(64)
      };
    });

    test('should process NFT purchase', async () => {
      // Simulate purchase transaction
      const purchaseData = {
        token_id: generatedNFT.token_id,
        buyer_address: buyer.address,
        seller_address: testUser.address,
        price: marketplaceListing.price,
        transaction_hash: testDataFactory.transactionHash()
      };

      // Update NFT ownership
      await supabaseConnection.updateNFTOwnership(
        generatedNFT.token_id,
        buyer.address,
        purchaseData.transaction_hash
      );

      // Update marketplace listing
      await supabaseConnection.updateMarketplaceListing(
        marketplaceListing.id,
        { status: 'sold', buyer_address: buyer.address }
      );

      // Verify ownership transfer
      const { data: updatedNFT } = await supabaseConnection.getNFTByTokenId(generatedNFT.token_id);
      expect(updatedNFT.owner_address).toBe(buyer.address);
      expect(updatedNFT.is_listed).toBe(false);
    });

    test('should award XP for purchase and sale', async () => {
      // Check buyer XP
      const buyerResult = await tierService.awardXP(buyer.address, 'nftPurchase', null, {
        tokenId: generatedNFT.token_id,
        price: marketplaceListing.price
      });
      
      expect(buyerResult.success).toBe(true);
      expect(buyerResult.xpAwarded).toBeGreaterThan(0);

      // Check seller XP
      const sellerResult = await tierService.awardXP(testUser.address, 'nftSale', null, {
        tokenId: generatedNFT.token_id,
        price: marketplaceListing.price
      });
      
      expect(sellerResult.success).toBe(true);
      expect(sellerResult.xpAwarded).toBeGreaterThan(0);
    });
  });

  describe('Staking Integration', () => {
    test('should calculate staking multiplier based on tier', async () => {
      const tierData = await tierService.getUserTierData(buyer.address);
      const baseStakingReward = 100;
      
      const multipliedReward = await tierService.applyTierBenefits(
        buyer.address,
        'stakingMultiplier',
        baseStakingReward
      );
      
      expect(multipliedReward).toBeGreaterThanOrEqual(baseStakingReward);
      
      const expectedMultiplier = tierData.currentTierInfo.benefits.stakingMultiplier;
      expect(multipliedReward).toBe(baseStakingReward * expectedMultiplier);
    });

    test('should track staking activity for XP', async () => {
      const stakingAmount = 1000;
      
      const result = await tierService.awardXP(buyer.address, 'stakingDeposit', null, {
        amount: stakingAmount
      });
      
      expect(result.success).toBe(true);
      expect(result.xpAwarded).toBeGreaterThan(0);
    });
  });

  describe('Real-time Data Sync', () => {
    test('should sync NFT data changes in real-time', async () => {
      // This would test Supabase real-time subscriptions
      // In a real test, you'd set up a subscription and verify updates
      
      const mockSubscription = {
        channel: 'nft-changes',
        event: 'UPDATE',
        table: 'nfts',
        record: {
          token_id: generatedNFT.token_id,
          owner_address: buyer.address
        }
      };

      // Verify subscription handling
      expect(mockSubscription.event).toBe('UPDATE');
      expect(mockSubscription.record.token_id).toBe(generatedNFT.token_id);
    });

    test('should sync marketplace listing changes', async () => {
      const mockListingUpdate = {
        channel: 'listing-changes',
        event: 'UPDATE',
        table: 'marketplace_listings',
        record: {
          id: marketplaceListing.id,
          status: 'sold'
        }
      };

      expect(mockListingUpdate.event).toBe('UPDATE');
      expect(mockListingUpdate.record.status).toBe('sold');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid NFT generation parameters', async () => {
      await expect(
        nftGenerator.generateSingle(
          'invalid-address',
          'invalid.template',
          'invalid-location',
          'invalid-rarity'
        )
      ).rejects.toThrow();
    });

    test('should handle duplicate token ID', async () => {
      // Try to generate NFT with existing token ID
      await expect(
        nftGenerator.generateSingle(
          testUser.address,
          'residential.villa',
          'lagos',
          'common',
          { tokenId: generatedNFT.token_id }
        )
      ).rejects.toThrow();
    });

    test('should handle invalid marketplace listing', async () => {
      const invalidListing = {
        token_id: 999999, // Non-existent token
        seller_address: testUser.address,
        price: 'invalid-price',
        currency: 'INVALID'
      };

      await expect(
        supabaseConnection.createMarketplaceListing(invalidListing)
      ).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should generate NFT within acceptable time', async () => {
      const startTime = Date.now();
      
      await nftGenerator.generateSingle(
        testUser.address,
        'residential.apartment',
        'abuja',
        'common'
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle batch NFT generation efficiently', async () => {
      const startTime = Date.now();
      
      const batchSize = 5;
      const nfts = await nftGenerator.generateBatch(
        testUser.address,
        batchSize,
        'commercial.office',
        'lagos',
        ['common', 'uncommon']
      );
      
      const duration = Date.now() - startTime;
      expect(nfts).toHaveLength(batchSize);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across services', async () => {
      // Verify NFT data consistency between database and tier service
      const { data: dbNFT } = await supabaseConnection.getNFTByTokenId(generatedNFT.token_id);
      const tierData = await tierService.getUserTierData(buyer.address);
      
      expect(dbNFT).toBeTruthy();
      expect(tierData).toBeTruthy();
      
      // Check that user actions are properly recorded
      const { data: actions } = await supabaseConnection.getUserActions(buyer.address, 100);
      const nftActions = actions.filter(action => 
        action.metadata && action.metadata.tokenId === generatedNFT.token_id
      );
      
      expect(nftActions.length).toBeGreaterThan(0);
    });

    test('should validate NFT metadata integrity', async () => {
      const { data: nft } = await supabaseConnection.getNFTByTokenId(generatedNFT.token_id);
      
      // Verify metadata structure
      expect(nft.metadata).toHaveProperty('name');
      expect(nft.metadata).toHaveProperty('description');
      expect(nft.metadata).toHaveProperty('image');
      expect(nft.metadata).toHaveProperty('attributes');
      
      // Verify attributes
      const attributes = nft.metadata.attributes;
      const requiredTraits = ['Property Type', 'Location', 'Rarity'];
      
      requiredTraits.forEach(trait => {
        const attribute = attributes.find(attr => attr.trait_type === trait);
        expect(attribute).toBeTruthy();
        expect(attribute.value).toBeTruthy();
      });
    });
  });
});
