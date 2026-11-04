import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardDeck from './CardDeck';

describe('CardDeck (React 19 + Vitest)', () => {
  const sampleDeck = {
    name: 'Fibonacci',
    cards: ['1', '2', '3', '5', '?', '☕']
  };

  it('renders all deck cards and calls onCardSelect when an active player clicks a card', () => {
    const onCardSelect = vi.fn();
    render(
      <CardDeck
        deck={sampleDeck}
        onCardSelect={onCardSelect}
        selectedCard="3"
        hasVoted={true}
        isWatcher={false}
        revealed={false}
      />
    );

    expect(screen.getByText('Select Your Card')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Break')).toBeInTheDocument();

    fireEvent.click(screen.getByText('5'));
    expect(onCardSelect).toHaveBeenCalledWith('5');
  });

  it('prevents voting when isWatcher is true', () => {
    const onCardSelect = vi.fn();
    render(
      <CardDeck
        deck={sampleDeck}
        onCardSelect={onCardSelect}
        selectedCard={null}
        hasVoted={false}
        isWatcher={true}
        revealed={false}
      />
    );

    fireEvent.click(screen.getByText('2'));
    expect(onCardSelect).not.toHaveBeenCalled();
  });

  it('renders estimation cards inside .card-selection-grid container for harmonized spacing (Ticket 08)', () => {
    const { container } = render(
      <CardDeck
        deck={sampleDeck}
        onCardSelect={vi.fn()}
        selectedCard={null}
        hasVoted={false}
        isWatcher={false}
        revealed={false}
      />
    );

    const grid = container.querySelector('.card-selection-grid');
    expect(grid).toBeInTheDocument();
    const cards = grid.querySelectorAll('.poker-card');
    expect(cards.length).toBe(sampleDeck.cards.length);
  });
});
