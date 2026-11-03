import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GameRoom from './GameRoom';

vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    getSocket: vi.fn(() => ({ id: 'p1', on: vi.fn(), off: vi.fn() })),
    castVote: vi.fn(),
    revealVotes: vi.fn(),
    resetGame: vi.fn(),
    changeDeck: vi.fn(),
    toggleRole: vi.fn(),
    createCustomDeck: vi.fn(),
    editCustomDeck: vi.fn(),
    changePlayerName: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

vi.mock('./GameProvider', () => ({
  useGameContext: () => ({
    game: {},
    socketService: {}
  })
}));

describe('GameRoom Button Hierarchy (Ticket 02)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            fibonacci: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
            tshirt: { name: 'T-Shirt Sizing', cards: ['S', 'M', 'L'] }
          })
      })
    );
  });

  it('styles Share Link as a primary corporate button instead of btn-success', async () => {
    const sampleGame = {
      id: 'GAME1234',
      revealed: false,
      canReveal: false,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: null,
      players: [{ id: 'p1', name: 'Alice', isWatcher: false, hasVoted: false }],
      votes: {}
    };

    render(
      <GameRoom
        game={sampleGame}
        playerName="Alice"
        isWatcher={false}
        socketId="p1"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Fibonacci' })).toBeInTheDocument();
    });

    const shareBtn = screen.getByRole('button', { name: 'Share Link' });
    expect(shareBtn).toHaveClass('btn', 'btn-primary', 'btn-share');
    expect(shareBtn).not.toHaveClass('btn-success');
  });
});
