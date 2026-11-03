import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameStats from './GameStats';

describe('GameStats Accent Contrast (Ticket 01)', () => {
  it('uses --accent-text for vote count typography while keeping --accent-color for vote bar fills', () => {
    const players = [
      { id: 'p1', name: 'Alice', isWatcher: false },
      { id: 'p2', name: 'Bob', isWatcher: false }
    ];
    const votes = { p1: '5', p2: '5' };
    const game = {
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5', '8'] }
    };

    const { container } = render(
      <GameStats votes={votes} players={players} game={game} />
    );

    const voteCountLabel = screen.getByText('2 votes');
    expect(voteCountLabel).toHaveStyle({ color: 'var(--accent-text)' });

    const voteBarFill = container.querySelector('.vote-bar-fill');
    expect(voteBarFill).toHaveStyle({ backgroundColor: 'var(--accent-color)' });
  });
});
