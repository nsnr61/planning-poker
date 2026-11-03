import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GameRoom from './GameRoom';

const confettiPropsSpy = vi.fn();

vi.mock('react-confetti', () => ({
  default: (props) => {
    confettiPropsSpy(props);
    return <div data-testid="confetti-mock" />;
  }
}));

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

describe('GameRoom Corporate UI & Consensus (Tickets 02 & 03)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    confettiPropsSpy.mockClear();
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

  it('styles Share Link as a primary corporate button and renders unrevealed player card back without hardcoded white background', async () => {
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

    const { container } = render(
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

    const cardBack = container.querySelector('.card-back');
    expect(cardBack).toBeInTheDocument();
    expect(cardBack.style.backgroundColor).toBe('');
  });

  it('displays consensus banner in --success-color and triggers confetti with corporate palette on consensus', async () => {
    const consensusGame = {
      id: 'GAME1234',
      revealed: true,
      canReveal: false,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: null,
      players: [
        { id: 'p1', name: 'Alice', isWatcher: false, hasVoted: true },
        { id: 'p2', name: 'Bob', isWatcher: false, hasVoted: true }
      ],
      votes: { p1: '5', p2: '5' }
    };

    render(
      <GameRoom
        game={consensusGame}
        playerName="Alice"
        isWatcher={false}
        socketId="p1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Consensus Reached!/i)).toBeInTheDocument();
    });

    const banner = screen.getByText(/Consensus Reached!/i);
    expect(banner).toHaveStyle({ backgroundColor: 'var(--success-color)' });

    expect(screen.getByTestId('confetti-mock')).toBeInTheDocument();
    expect(confettiPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: ['#991355', '#7d0f45', '#c22570', '#e05297', '#f2cadb', '#595959']
      })
    );
  });
});
