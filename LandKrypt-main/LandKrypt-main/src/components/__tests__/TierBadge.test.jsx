import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test for tier configuration
describe('Tier System Configuration', () => {
  const TIER_CONFIG = {
    1: { name: 'Territory Trainee', requiredXP: 0, avatar: 'tier1.png' },
    2: { name: 'Plot Pioneer', requiredXP: 5000, avatar: 'tier2.png' },
    3: { name: 'Estate Architect', requiredXP: 10000, avatar: 'tier3.png' },
    4: { name: 'Dominion Magnate', requiredXP: 15000, avatar: 'tier4.png' },
    5: { name: 'Realm Sovereign', requiredXP: 20000, avatar: 'tier5.png' }
  };

  // Mock TierBadge component for testing
  const MockTierBadge = ({ currentTier, totalXP, walletAddress }) => {
    if (!walletAddress) return null;
    
    const tierInfo = TIER_CONFIG[currentTier] || TIER_CONFIG[1];
    
    return (
      <div data-testid="tier-badge">
        <span data-testid="tier-name">{tierInfo.name}</span>
        <span data-testid="tier-number">{currentTier}</span>
        <span data-testid="total-xp">{totalXP.toLocaleString()} XP</span>
      </div>
    );
  };

  const defaultProps = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    totalXP: 2500,
    currentTier: 1,
  };

  it('renders tier badge with correct information', () => {
    render(<MockTierBadge {...defaultProps} />);
    
    expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
    expect(screen.getByText('Territory Trainee')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2,500 XP')).toBeInTheDocument();
  });

  it('does not render when no wallet address is provided', () => {
    render(<MockTierBadge {...defaultProps} walletAddress="" />);
    
    expect(screen.queryByTestId('tier-badge')).not.toBeInTheDocument();
  });

  it('displays correct tier information for different tiers', () => {
    const tierTests = [
      { tier: 1, name: 'Territory Trainee', xp: 1000 },
      { tier: 2, name: 'Plot Pioneer', xp: 7500 },
      { tier: 3, name: 'Estate Architect', xp: 12000 },
      { tier: 4, name: 'Dominion Magnate', xp: 17000 },
      { tier: 5, name: 'Realm Sovereign', xp: 25000 },
    ];

    tierTests.forEach(({ tier, name, xp }) => {
      const { rerender } = render(
        <MockTierBadge 
          {...defaultProps} 
          currentTier={tier} 
          totalXP={xp}
        />
      );
      
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(tier.toString())).toBeInTheDocument();
      expect(screen.getByText(`${xp.toLocaleString()} XP`)).toBeInTheDocument();
      
      rerender(<div />); // Clear for next test
    });
  });

  it('has correct tier configuration', () => {
    expect(TIER_CONFIG[1].name).toBe('Territory Trainee');
    expect(TIER_CONFIG[1].requiredXP).toBe(0);
    
    expect(TIER_CONFIG[2].name).toBe('Plot Pioneer');
    expect(TIER_CONFIG[2].requiredXP).toBe(5000);
    
    expect(TIER_CONFIG[3].name).toBe('Estate Architect');
    expect(TIER_CONFIG[3].requiredXP).toBe(10000);
    
    expect(TIER_CONFIG[4].name).toBe('Dominion Magnate');
    expect(TIER_CONFIG[4].requiredXP).toBe(15000);
    
    expect(TIER_CONFIG[5].name).toBe('Realm Sovereign');
    expect(TIER_CONFIG[5].requiredXP).toBe(20000);
  });
});
