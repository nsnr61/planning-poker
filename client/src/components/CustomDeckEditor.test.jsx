import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomDeckEditor from './CustomDeckEditor';
import { socketService } from '../services/socketService';

vi.mock('../services/socketService', () => ({
  socketService: {
    createCustomDeck: vi.fn(),
    editCustomDeck: vi.fn()
  }
}));

describe('CustomDeckEditor Three-Tier Architecture & 15 Card Slots (Ticket 04)', () => {
  const sampleGame = {
    id: 'GAME1234',
    customDeck: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders .modal-content.modal-wide with .modal-header, scrollable .modal-body, pinned .modal-actions, and supports adding/editing all 15 card inputs', () => {
    const onClose = vi.fn();
    const { container } = render(
      <CustomDeckEditor game={sampleGame} onClose={onClose} isEditing={false} />
    );

    const modalContent = container.querySelector('.modal-content');
    expect(modalContent).toBeInTheDocument();
    expect(modalContent).toHaveClass('modal-content', 'modal-wide');

    const modalHeader = modalContent.querySelector('.modal-header');
    const modalBody = modalContent.querySelector('.modal-body');
    const modalActions = modalContent.querySelector('.modal-actions');

    expect(modalHeader).toBeInTheDocument();
    expect(modalBody).toBeInTheDocument();
    expect(modalActions).toBeInTheDocument();

    const addCardBtn = screen.getByRole('button', { name: /Add Card/i });
    // Initially 5 card slots; click 10 times to reach 15 slots
    for (let i = 0; i < 10; i++) {
      fireEvent.click(addCardBtn);
    }

    expect(addCardBtn).toBeDisabled();
    expect(addCardBtn).toHaveTextContent(/Max 15 cards/i);

    const deckNameInput = screen.getByLabelText(/Deck Name/i);
    fireEvent.change(deckNameInput, { target: { value: 'Sprint Deck' } });

    const expectedCards = [];
    for (let i = 1; i <= 15; i++) {
      const cardInput = screen.getByPlaceholderText(`Card ${i}`);
      expect(modalBody).toContainElement(cardInput);
      cardInput.focus();
      expect(cardInput).toHaveFocus();
      fireEvent.change(cardInput, { target: { value: `C${i}` } });
      expectedCards.push(`C${i}`);
    }

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const submitBtn = screen.getByRole('button', { name: 'Create Deck' });

    expect(modalActions).toContainElement(cancelBtn);
    expect(modalActions).toContainElement(submitBtn);
    expect(cancelBtn).toHaveClass('btn', 'btn-secondary');
    expect(submitBtn).toHaveClass('btn', 'btn-primary');

    fireEvent.click(submitBtn);
    expect(socketService.createCustomDeck).toHaveBeenCalledWith('GAME1234', {
      name: 'Sprint Deck',
      cards: expectedCards
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps all 15 card slots and Update Deck button interactive in edit mode and closes on Escape or .modal-overlay click regardless of scroll position', () => {
    const onClose = vi.fn();
    const fifteenCards = Array.from({ length: 15 }, (_, idx) => `V${idx + 1}`);
    const gameWith15Cards = {
      id: 'GAME1234',
      customDeck: {
        name: 'Full Deck',
        cards: fifteenCards
      }
    };

    const { container } = render(
      <CustomDeckEditor game={gameWith15Cards} onClose={onClose} isEditing={true} />
    );

    const modalBody = container.querySelector('.modal-body');
    const modalActions = container.querySelector('.modal-actions');

    for (let i = 1; i <= 15; i++) {
      const input = screen.getByPlaceholderText(`Card ${i}`);
      expect(input).toHaveValue(`V${i}`);
      expect(modalBody).toContainElement(input);
    }

    // Simulate scrolling down the modal body
    modalBody.scrollTop = 350;
    fireEvent.scroll(modalBody, { target: { scrollTop: 350 } });

    const updateBtn = screen.getByRole('button', { name: 'Update Deck' });
    expect(modalActions).toContainElement(updateBtn);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
