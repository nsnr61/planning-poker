import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GameControls from './GameControls';

vi.mock('../services/socketService', () => ({
  socketService: {
    createCustomDeck: vi.fn(),
    editCustomDeck: vi.fn()
  }
}));

describe('GameControls Corporate Button Hierarchy (Ticket 02)', () => {
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

  it('assigns btn-success to Reveal Votes and active deck, btn-primary to inactive decks, and btn-secondary to role toggle & Edit Custom Deck', async () => {
    const activeGame = {
      id: 'GAME1234',
      revealed: false,
      canReveal: true,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: { name: 'Team Deck', cards: ['A', 'B'] },
      players: [{ id: 'p1', name: 'Alice', isWatcher: false, hasVoted: true }],
      votes: {}
    };

    render(
      <GameControls
        game={activeGame}
        isWatcher={false}
        onRevealVotes={vi.fn()}
        onResetGame={vi.fn()}
        onDeckChange={vi.fn()}
        onToggleRole={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Fibonacci' })).toBeInTheDocument();
    });

    const revealBtn = screen.getByRole('button', { name: 'Reveal Votes' });
    expect(revealBtn).toHaveClass('btn', 'btn-success');

    const activeDeckBtn = screen.getByRole('button', { name: 'Fibonacci' });
    expect(activeDeckBtn).toHaveClass('btn', 'btn-success');

    const inactiveDeckBtn = screen.getByRole('button', { name: 'T-Shirt Sizing' });
    expect(inactiveDeckBtn).toHaveClass('btn', 'btn-primary');

    const roleToggleBtn = screen.getByRole('button', { name: /Switch to Watcher/i });
    expect(roleToggleBtn).toHaveClass('btn', 'btn-secondary');
    expect(roleToggleBtn).not.toHaveClass('btn-warning');

    const editCustomBtn = screen.getByRole('button', { name: 'Edit Custom Deck' });
    expect(editCustomBtn).toHaveClass('btn', 'btn-secondary');
    expect(editCustomBtn).not.toHaveClass('btn-warning');

    // Open CustomDeckEditor modal and verify modal button classes
    fireEvent.click(editCustomBtn);
    expect(screen.getByRole('button', { name: /Add Card/i })).toHaveClass('btn', 'btn-secondary');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('btn', 'btn-secondary');
    expect(screen.getByRole('button', { name: 'Update Deck' })).toHaveClass('btn', 'btn-primary');
  });

  it('styles Start New Round as btn-primary and Switch to Player as btn-secondary when revealed', async () => {
    const revealedGame = {
      id: 'GAME1234',
      revealed: true,
      canReveal: false,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: null,
      players: [{ id: 'p1', name: 'Alice', isWatcher: true, hasVoted: false }],
      votes: { p2: '5' }
    };

    render(
      <GameControls
        game={revealedGame}
        isWatcher={true}
        onRevealVotes={vi.fn()}
        onResetGame={vi.fn()}
        onDeckChange={vi.fn()}
        onToggleRole={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/decks');
    });

    const resetBtn = screen.getByRole('button', { name: 'Start New Round' });
    expect(resetBtn).toHaveClass('btn', 'btn-primary');
    expect(resetBtn).not.toHaveClass('btn-warning');

    const roleToggleBtn = screen.getByRole('button', { name: /Switch to Player/i });
    expect(roleToggleBtn).toHaveClass('btn', 'btn-secondary');
    expect(roleToggleBtn).not.toHaveClass('btn-warning');
  });

  it('structures round actions, role switch, watcher banner, and deck selector in separated semantic containers (Ticket 06)', async () => {
    const onRevealVotes = vi.fn();
    const onToggleRole = vi.fn();
    const onDeckChange = vi.fn();

    const activeWatcherGame = {
      id: 'GAME1234',
      revealed: false,
      canReveal: true,
      deckType: 'fibonacci',
      deck: { name: 'Fibonacci', cards: ['1', '2', '3', '5'] },
      customDeck: null,
      players: [{ id: 'p1', name: 'Alice', isWatcher: true, hasVoted: false }],
      votes: { p2: '3' }
    };

    const { container } = render(
      <GameControls
        game={activeWatcherGame}
        isWatcher={true}
        onRevealVotes={onRevealVotes}
        onResetGame={vi.fn()}
        onDeckChange={onDeckChange}
        onToggleRole={onToggleRole}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'T-Shirt Sizing' })).toBeInTheDocument();
    });

    // Primary round controls row separated from watcher banner and deck selector
    const roundControlsRow = container.querySelector('.round-controls-row');
    expect(roundControlsRow).toBeInTheDocument();

    const roundActionsGroup = roundControlsRow.querySelector('.round-actions');
    expect(roundActionsGroup).toBeInTheDocument();

    const revealBtn = screen.getByRole('button', { name: 'Reveal Votes' });
    expect(roundActionsGroup).toContainElement(revealBtn);

    const roleSwitchBtn = screen.getByRole('button', { name: /Switch to Player/i });
    expect(roundControlsRow).toContainElement(roleSwitchBtn);
    expect(roundActionsGroup).not.toContainElement(roleSwitchBtn);

    // Watcher banner semantic container
    const watcherBanner = container.querySelector('.watcher-banner');
    expect(watcherBanner).toBeInTheDocument();
    expect(watcherBanner).toHaveTextContent(/Watcher Mode:/i);

    // Deck selector & button group structure when revealed === false
    const deckSelector = container.querySelector('.deck-selector');
    expect(deckSelector).toBeInTheDocument();
    expect(roundControlsRow).not.toContainElement(deckSelector);

    const deckButtonsRow = deckSelector.querySelector('.deck-buttons-group');
    expect(deckButtonsRow).toBeInTheDocument();

    const tshirtBtn = screen.getByRole('button', { name: 'T-Shirt Sizing' });
    const createCustomBtn = screen.getByRole('button', { name: 'Create Custom Deck' });
    expect(deckButtonsRow).toContainElement(tshirtBtn);
    expect(deckSelector.querySelector('.custom-deck-actions')).toContainElement(createCustomBtn);

    // Verify interactions
    fireEvent.click(revealBtn);
    expect(onRevealVotes).toHaveBeenCalledTimes(1);

    fireEvent.click(roleSwitchBtn);
    expect(onToggleRole).toHaveBeenCalledTimes(1);

    fireEvent.click(tshirtBtn);
    expect(onDeckChange).toHaveBeenCalledWith('tshirt');
  });
});
