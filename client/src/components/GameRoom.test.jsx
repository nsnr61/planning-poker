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

  it('renders standardized .card sections for Players, CardDeck, GameStats, and GameControls with interactive round and deck controls (Ticket 06)', async () => {
    const unrevealedGame = {
      id: 'GAME1234',
      revealed: false,
      canReveal: true,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: { name: 'Custom Team', cards: ['10', '20'] },
      players: [
        { id: 'p1', name: 'Alice', isWatcher: false, hasVoted: true },
        { id: 'p2', name: 'Bob', isWatcher: false, hasVoted: true }
      ],
      votes: { p1: '3', p2: '5' }
    };

    const { container, rerender } = render(
      <GameRoom
        game={unrevealedGame}
        playerName="Alice"
        isWatcher={false}
        socketId="p1"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Fibonacci' })).toBeInTheDocument();
    });

    // When unrevealed and active player: 3 .card containers (Players, CardDeck, GameControls)
    const cardsUnrevealed = container.querySelectorAll('.card');
    expect(cardsUnrevealed.length).toBe(3);

    // CardDeck grid renders inside a .card container with .card-selection-grid
    const cardGrid = container.querySelector('.card .card-selection-grid');
    expect(cardGrid).toBeInTheDocument();
    expect(cardGrid.querySelectorAll('.poker-card').length).toBe(4);

    // GameControls renders .round-controls-row and .deck-selector inside .card
    expect(container.querySelector('.card .round-controls-row')).toBeInTheDocument();
    expect(container.querySelector('.card .deck-selector .deck-buttons-group')).toBeInTheDocument();
    expect(container.querySelector('.card .deck-selector .custom-deck-actions')).toBeInTheDocument();

    // Rerender in revealed state to verify GameStats (.card.game-stats-revealed) and hidden CardDeck / .deck-selector
    const revealedGame = {
      ...unrevealedGame,
      revealed: true
    };

    rerender(
      <GameRoom
        game={revealedGame}
        playerName="Alice"
        isWatcher={false}
        socketId="p1"
      />
    );

    expect(container.querySelector('.card-selection-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.deck-selector')).not.toBeInTheDocument();

    const statsCard = container.querySelector('.card.game-stats-revealed');
    expect(statsCard).toBeInTheDocument();
    expect(statsCard.querySelector('.stats-summary')).toBeInTheDocument();
    expect(statsCard.querySelectorAll('.stat-highlight').length).toBe(3);
    expect(statsCard.querySelector('.distribution-grid')).toBeInTheDocument();
    expect(statsCard.querySelectorAll('.distribution-item').length).toBe(2);

    const startNewRoundBtn = screen.getByRole('button', { name: 'Start New Round' });
    expect(container.querySelector('.round-controls-row .round-actions')).toContainElement(startNewRoundBtn);
  });
});
