// Unit Tests for Data Validation Utilities
// Tests all validation schemas and utility functions

import {
  validateUserAction,
  validateNFTStake,
  validateNFTAnalytics,
  validateMarketplaceListing,
  validateProposal,
  ContractDataValidator,
  APIResponseValidator,
  DatabaseConsistencyChecker
} from '../dataValidation';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Data Validation Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('UserAction Validation', () => {
    const validUserAction = {
      id: 1,
      user_address: '0x1234567890123456789012345678901234567890',
      nft_id: 1,
      action_type: 'stake',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '1000.5',
      metadata: {},
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    test('should validate correct user action', () => {
      expect(() => validateUserAction(validUserAction)).not.toThrow();
      const result = validateUserAction(validUserAction);
      expect(result).toEqual(validUserAction);
    });

    test('should reject invalid user address', () => {
      const invalidAction = {
        ...validUserAction,
        user_address: 'invalid_address'
      };
      expect(() => validateUserAction(invalidAction)).toThrow();
    });

    test('should reject invalid action type', () => {
      const invalidAction = {
        ...validUserAction,
        action_type: 'invalid_type'
      };
      expect(() => validateUserAction(invalidAction)).toThrow();
    });

    test('should reject invalid transaction hash', () => {
      const invalidAction = {
        ...validUserAction,
        tx_hash: 'invalid_hash'
      };
      expect(() => validateUserAction(invalidAction)).toThrow();
    });

    test('should reject missing required fields', () => {
      const invalidAction = {
        user_address: validUserAction.user_address
        // Missing other required fields
      };
      expect(() => validateUserAction(invalidAction)).toThrow();
    });
  });

  describe('NFTStake Validation', () => {
    const validNFTStake = {
      id: 1,
      user_address: '0x1234567890123456789012345678901234567890',
      nft_id: 1,
      staking_contract: '0xabcdef1234567890123456789012345678901234',
      amount: '1000.5',
      start_timestamp: new Date().toISOString(),
      is_active: true,
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    test('should validate correct NFT stake', () => {
      expect(() => validateNFTStake(validNFTStake)).not.toThrow();
      const result = validateNFTStake(validNFTStake);
      expect(result).toEqual(validNFTStake);
    });

    test('should reject invalid staking contract', () => {
      const invalidStake = {
        ...validNFTStake,
        staking_contract: 'invalid_contract'
      };
      expect(() => validateNFTStake(invalidStake)).toThrow();
    });

    test('should handle optional fields', () => {
      const stakeWithOptionals = {
        ...validNFTStake,
        end_timestamp: new Date().toISOString(),
        rewards_earned: '50.25'
      };
      expect(() => validateNFTStake(stakeWithOptionals)).not.toThrow();
    });
  });

  describe('NFTAnalytics Validation', () => {
    const validAnalytics = {
      nftId: 1,
      stakingStats: {
        totalStaked: 50000,
        totalStakers: 25,
        allTimeStaked: 75000
      },
      activity: {
        totalActions: 150,
        actionsByType: { stake: 80, vote: 70 },
        uniqueParticipants: 45,
        last24Hours: 10,
        last7Days: 45
      },
      recentActions: [
        {
          id: 1,
          user_address: '0x1234567890123456789012345678901234567890',
          nft_id: 1,
          action_type: 'stake',
          tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          metadata: {},
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]
    };

    test('should validate correct analytics data', () => {
      expect(() => validateNFTAnalytics(validAnalytics)).not.toThrow();
      const result = validateNFTAnalytics(validAnalytics);
      expect(result.nftId).toBe(1);
      expect(result.stakingStats.totalStaked).toBe(50000);
    });

    test('should reject invalid analytics structure', () => {
      const invalidAnalytics = {
        nftId: 'invalid',
        stakingStats: {
          totalStaked: 'invalid'
        }
      };
      expect(() => validateNFTAnalytics(invalidAnalytics)).toThrow();
    });
  });

  describe('MarketplaceListing Validation', () => {
    const validListing = {
      id: 1,
      tokenId: '1',
      title: 'Test Property',
      description: 'Test description',
      location: 'Test Location',
      price: '100000 LKUSD target',
      shares: '25 Shares',
      image: '/images/test.jpg',
      tag: 'RESIDENTIAL',
      category: 'residential',
      staking: true,
      type: 'rwa',
      stakingContract: '0xabcdef1234567890123456789012345678901234',
      isListed: true,
      owner: '0x1234567890123456789012345678901234567890',
      originalPrice: '100000',
      tokenUrl: 'https://example.com/token/1.json'
    };

    test('should validate correct marketplace listing', () => {
      expect(() => validateMarketplaceListing(validListing)).not.toThrow();
      const result = validateMarketplaceListing(validListing);
      expect(result.id).toBe(1);
      expect(result.type).toBe('rwa');
    });

    test('should reject invalid category', () => {
      const invalidListing = {
        ...validListing,
        category: 'invalid_category'
      };
      expect(() => validateMarketplaceListing(invalidListing)).toThrow();
    });

    test('should reject invalid type', () => {
      const invalidListing = {
        ...validListing,
        type: 'invalid_type'
      };
      expect(() => validateMarketplaceListing(invalidListing)).toThrow();
    });

    test('should reject invalid token URL', () => {
      const invalidListing = {
        ...validListing,
        tokenUrl: 'invalid_url'
      };
      expect(() => validateMarketplaceListing(invalidListing)).toThrow();
    });
  });

  describe('Proposal Validation', () => {
    const validProposal = {
      id: 1,
      nft_id: 1,
      title: 'Test Proposal',
      description: 'Test proposal description',
      creator_address: '0x1234567890123456789012345678901234567890',
      status: 'active',
      ownership_percentage: 30,
      timeframe: '12 months',
      total_votes: '0',
      yes_votes: '0',
      no_votes: '0',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    test('should validate correct proposal', () => {
      expect(() => validateProposal(validProposal)).not.toThrow();
      const result = validateProposal(validProposal);
      expect(result.status).toBe('active');
    });

    test('should reject invalid status', () => {
      const invalidProposal = {
        ...validProposal,
        status: 'invalid_status'
      };
      expect(() => validateProposal(invalidProposal)).toThrow();
    });

    test('should handle optional fields', () => {
      const proposalWithOptionals = {
        ...validProposal,
        proposal_contract: '0xabcdef1234567890123456789012345678901234',
        voting_deadline: new Date(Date.now() + 86400000).toISOString(),
        tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };
      expect(() => validateProposal(proposalWithOptionals)).not.toThrow();
    });
  });

  describe('ContractDataValidator', () => {
    test('should validate correct staking contract address', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(() => ContractDataValidator.validateStakingContract(validAddress)).not.toThrow();
    });

    test('should reject zero address', () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      expect(() => ContractDataValidator.validateStakingContract(zeroAddress)).toThrow();
    });

    test('should reject invalid address format', () => {
      const invalidAddress = 'invalid_address';
      expect(() => ContractDataValidator.validateStakingContract(invalidAddress)).toThrow();
    });

    test('should validate positive token amounts', () => {
      expect(() => ContractDataValidator.validateTokenAmount('1000.5')).not.toThrow();
      expect(() => ContractDataValidator.validateTokenAmount('0.1')).not.toThrow();
    });

    test('should reject negative or zero amounts', () => {
      expect(() => ContractDataValidator.validateTokenAmount('0')).toThrow();
      expect(() => ContractDataValidator.validateTokenAmount('-100')).toThrow();
      expect(() => ContractDataValidator.validateTokenAmount('invalid')).toThrow();
    });

    test('should validate token IDs', () => {
      expect(() => ContractDataValidator.validateTokenId('1')).not.toThrow();
      expect(() => ContractDataValidator.validateTokenId('100')).not.toThrow();
    });

    test('should reject invalid token IDs', () => {
      expect(() => ContractDataValidator.validateTokenId('0')).toThrow();
      expect(() => ContractDataValidator.validateTokenId('-1')).toThrow();
      expect(() => ContractDataValidator.validateTokenId('invalid')).toThrow();
    });

    test('should validate transaction hashes', () => {
      const validTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(() => ContractDataValidator.validateTransactionHash(validTxHash)).not.toThrow();
    });

    test('should reject invalid transaction hashes', () => {
      expect(() => ContractDataValidator.validateTransactionHash('0x123')).toThrow();
      expect(() => ContractDataValidator.validateTransactionHash('invalid')).toThrow();
    });
  });

  describe('APIResponseValidator', () => {
    test('should validate single object response', () => {
      const validResponse = {
        id: 1,
        user_address: '0x1234567890123456789012345678901234567890',
        nft_id: 1,
        action_type: 'stake',
        tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        metadata: {},
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      expect(() => {
        APIResponseValidator.validateResponse(validResponse, {
          parse: (data) => {
            if (data.id === 1) return data;
            throw new Error('Invalid data');
          }
        }, '/test-endpoint');
      }).not.toThrow();
    });

    test('should validate array response', () => {
      const validArrayResponse = [
        {
          id: 1,
          name: 'Test Item 1'
        },
        {
          id: 2,
          name: 'Test Item 2'
        }
      ];

      expect(() => {
        APIResponseValidator.validateResponse(validArrayResponse, {
          parse: (data) => {
            if (data.id && data.name) return data;
            throw new Error('Invalid item');
          }
        }, '/test-endpoint');
      }).not.toThrow();
    });

    test('should handle validation errors', () => {
      const invalidResponse = {
        id: 'invalid',
        invalid_field: true
      };

      expect(() => {
        APIResponseValidator.validateResponse(invalidResponse, {
          parse: (data) => {
            if (typeof data.id === 'number') return data;
            throw new Error('Invalid ID type');
          }
        }, '/test-endpoint');
      }).toThrow();
    });

    test('should fetch and validate data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test' })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await APIResponseValidator.validateAndFetch('/test', {
        parse: (data) => data
      });

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(fetch).toHaveBeenCalledWith('/test');
    });

    test('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        APIResponseValidator.validateAndFetch('/test', { parse: (data) => data })
      ).rejects.toThrow('Network error');
    });

    test('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await expect(
        APIResponseValidator.validateAndFetch('/test', { parse: (data) => data })
      ).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('DatabaseConsistencyChecker', () => {
    let checker;

    beforeEach(() => {
      checker = new DatabaseConsistencyChecker();
    });

    test('should check user actions consistency', async () => {
      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            nftId: 1,
            actions: [],
            stakes: [],
            votes: []
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            nftId: 1,
            stakingStats: {
              totalStaked: 0,
              totalStakers: 0,
              allTimeStaked: 0
            },
            activity: {
              totalActions: 0,
              actionsByType: {},
              uniqueParticipants: 0,
              last24Hours: 0,
              last7Days: 0
            },
            recentActions: []
          })
        });

      const result = await checker.checkUserActionsConsistency(
        '0x1234567890123456789012345678901234567890',
        1
      );

      expect(result.isConsistent).toBe(true);
      expect(result.discrepancies).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await checker.checkUserActionsConsistency(
        '0x1234567890123456789012345678901234567890',
        1
      );

      expect(result.isConsistent).toBe(false);
      expect(result.error).toBe('API Error');
    });

    test('should check marketplace consistency', async () => {
      // Mock fetch to return valid marketplace data
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            tokenId: '1',
            title: 'Test Property',
            description: 'Test description',
            location: 'Test Location',
            price: '100000 LKUSD target',
            shares: '25 Shares',
            image: '/images/test.jpg',
            tag: 'RESIDENTIAL',
            category: 'residential',
            staking: true,
            type: 'rwa',
            stakingContract: '0xabcdef1234567890123456789012345678901234',
            isListed: true,
            owner: '0x1234567890123456789012345678901234567890',
            originalPrice: '100000',
            tokenUrl: 'https://example.com/token/1.json'
          }
        ])
      });

      const result = await checker.checkMarketplaceConsistency();

      expect(result.isConsistent).toBe(true);
      expect(result.listings).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined values', () => {
      expect(() => validateUserAction(null)).toThrow();
      expect(() => validateUserAction(undefined)).toThrow();
      expect(() => validateNFTStake({})).toThrow();
    });

    test('should handle malformed data', () => {
      const malformedData = {
        id: 'not_a_number',
        user_address: '0x123', // Too short
        nft_id: -1, // Negative
        action_type: null,
        tx_hash: undefined
      };

      expect(() => validateUserAction(malformedData)).toThrow();
    });

    test('should handle very large numbers', () => {
      const largeAmountStake = {
        id: 1,
        user_address: '0x1234567890123456789012345678901234567890',
        nft_id: 1,
        staking_contract: '0xabcdef1234567890123456789012345678901234',
        amount: '999999999999999999999999.999999999999999999',
        start_timestamp: new Date().toISOString(),
        is_active: true,
        tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      expect(() => validateNFTStake(largeAmountStake)).not.toThrow();
    });

    test('should handle empty arrays and objects', () => {
      const validAnalyticsWithEmpty = {
        nftId: 1,
        stakingStats: {
          totalStaked: 0,
          totalStakers: 0,
          allTimeStaked: 0
        },
        activity: {
          totalActions: 0,
          actionsByType: {},
          uniqueParticipants: 0,
          last24Hours: 0,
          last7Days: 0
        },
        recentActions: []
      };

      expect(() => validateNFTAnalytics(validAnalyticsWithEmpty)).not.toThrow();
    });

    test('should handle unicode characters in strings', () => {
      const unicodeListing = {
        id: 1,
        tokenId: '1',
        title: '🏠 Test Property with émojis and àccénts',
        description: 'Property with ünicode characters: ñ, ç, ø',
        location: 'São Paulo, Brasil 🇧🇷',
        price: '100000 LKUSD target',
        shares: '25 Shares',
        image: '/images/test.jpg',
        tag: 'RESIDENTIAL',
        category: 'residential',
        staking: true,
        type: 'rwa',
        stakingContract: '0xabcdef1234567890123456789012345678901234',
        isListed: true,
        owner: '0x1234567890123456789012345678901234567890',
        originalPrice: '100000',
        tokenUrl: 'https://example.com/token/1.json'
      };

      expect(() => validateMarketplaceListing(unicodeListing)).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  test('should validate complete data flow', async () => {
    // Simulate a complete user action flow
    const userAction = {
      id: 1,
      user_address: '0x1234567890123456789012345678901234567890',
      nft_id: 1,
      action_type: 'stake',
      tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '1000',
      metadata: { timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const nftStake = {
      id: 1,
      user_address: userAction.user_address,
      nft_id: userAction.nft_id,
      staking_contract: '0xabcdef1234567890123456789012345678901234',
      amount: userAction.amount,
      start_timestamp: new Date().toISOString(),
      is_active: true,
      tx_hash: userAction.tx_hash,
      metadata: userAction.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Validate each piece of data
    expect(() => validateUserAction(userAction)).not.toThrow();
    expect(() => validateNFTStake(nftStake)).not.toThrow();

    // Ensure data consistency
    expect(userAction.user_address).toBe(nftStake.user_address);
    expect(userAction.nft_id).toBe(nftStake.nft_id);
    expect(userAction.tx_hash).toBe(nftStake.tx_hash);
    expect(userAction.amount).toBe(nftStake.amount);
  });
});
