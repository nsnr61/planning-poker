import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GameSetup from './GameSetup';

describe('GameSetup Form Group Rhythm & Submit Action Clearance (Ticket 05)', () => {
  const mockDecks = {
    fibonacci: {
      name: 'Fibonacci (0, 1, 2, 3, 5, 8, ...)',
      cards: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']
    },
    tshirt: {
      name: 'T-Shirt Sizing',
      cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕']
    }
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockDecks)
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders Create Game mode with all fields structured in .form-group and dedicated submit clearance', async () => {
    const handleCreateGame = vi.fn();
    const { container } = render(
      <GameSetup onCreateGame={handleCreateGame} onJoinGame={vi.fn()} />
    );

    // Verify .form-group wrappers
    const formGroups = container.querySelectorAll('.form-group');
    expect(formGroups.length).toBeGreaterThanOrEqual(3);

    // Name group
    const nameInput = screen.getByLabelText(/Your Name:/i);
    expect(nameInput.closest('.form-group')).not.toBeNull();

    // Watcher group
    const watcherCheckbox = screen.getByLabelText(/Join as watcher/i);
    expect(watcherCheckbox.closest('.form-group')).not.toBeNull();

    // Deck selection group and preview
    await waitFor(() => {
      expect(screen.getByLabelText(/Card Deck:/i)).toBeInTheDocument();
    });
    const deckSelect = screen.getByLabelText(/Card Deck:/i);
    const deckGroup = deckSelect.closest('.form-group');
    expect(deckGroup).not.toBeNull();

    // Deck preview inside the deck group
    const deckPreview = deckGroup.querySelector('.deck-preview');
    expect(deckPreview).toBeInTheDocument();
    const previewCards = deckPreview.querySelectorAll('.deck-preview-card');
    expect(previewCards.length).toBe(mockDecks.fibonacci.cards.length);

    // Switching deck updates preview cards inside the form group
    fireEvent.change(deckSelect, { target: { value: 'tshirt' } });
    const updatedCards = deckGroup.querySelectorAll('.deck-preview-card');
    expect(updatedCards.length).toBe(mockDecks.tshirt.cards.length);
    expect(updatedCards[0]).toHaveTextContent('XS');

    // Submit button clearance
    const submitBtn = screen.getByRole('button', { name: /Create a Game/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveClass('btn', 'btn-primary', 'setup-submit-btn');

    // Submitting form invokes callback
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(watcherCheckbox);
    fireEvent.click(submitBtn);

    expect(handleCreateGame).toHaveBeenCalledWith({
      playerName: 'Alice',
      isWatcher: true,
      deckType: 'tshirt'
    });
  });

  it('renders Join Game mode with .form-group structure, prefilled name, and submit clearance', async () => {
    const handleJoinGame = vi.fn();
    const { container } = render(
      <GameSetup
        gameId="GAME456"
        prefillName="Bob"
        onCreateGame={vi.fn()}
        onJoinGame={handleJoinGame}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Your Name:/i)).toBeInTheDocument();
    });

    // Verify form-group elements in join mode
    const formGroups = container.querySelectorAll('.form-group');
    expect(formGroups.length).toBeGreaterThanOrEqual(2);

    const nameInput = screen.getByLabelText(/Your Name:/i);
    expect(nameInput).toHaveValue('Bob');
    expect(nameInput.closest('.form-group')).not.toBeNull();

    const watcherCheckbox = screen.getByLabelText(/Join as watcher/i);
    expect(watcherCheckbox.closest('.form-group')).not.toBeNull();

    // Deck selector should not be present in join mode
    expect(screen.queryByLabelText(/Card Deck:/i)).not.toBeInTheDocument();

    // Submit button clearance in join mode
    const submitBtn = screen.getByRole('button', { name: /Join the Game/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveClass('btn', 'btn-primary', 'setup-submit-btn');

    fireEvent.click(submitBtn);
    expect(handleJoinGame).toHaveBeenCalledWith({
      playerName: 'Bob',
      isWatcher: false,
      deckType: 'fibonacci',
      gameId: 'GAME456'
    });
  });

  it('preserves standard .form-group on all form groups including the last one prior to submit (Ticket 08)', async () => {
    const { container } = render(
      <GameSetup onCreateGame={vi.fn()} onJoinGame={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Card Deck:/i)).toBeInTheDocument();
    });

    const form = container.querySelector('.game-setup-form');
    expect(form).toBeInTheDocument();

    const formGroups = form.querySelectorAll('.form-group');
    expect(formGroups.length).toBe(3);

    formGroups.forEach((group) => {
      expect(group).toHaveClass('form-group');
    });

    const submitBtn = form.querySelector('.setup-submit-btn');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn.previousElementSibling).toBe(formGroups[formGroups.length - 1]);
  });
});
