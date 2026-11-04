import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NameChangeModal from './NameChangeModal';
import { socketService } from '../services/socketService';

vi.mock('../services/socketService', () => ({
  socketService: {
    changePlayerName: vi.fn()
  }
}));

describe('NameChangeModal Three-Tier Architecture & Dismissal (Ticket 04)', () => {
  const sampleGame = { id: 'GAME1234' };
  const samplePlayer = { id: 'p1', name: 'Alice', isWatcher: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders standard modal with three-tier structure (.modal-header, .modal-body, .modal-actions) and interactive primary/secondary buttons', () => {
    const onClose = vi.fn();
    render(
      <NameChangeModal
        game={sampleGame}
        currentPlayer={samplePlayer}
        onClose={onClose}
      />
    );

    const modalContent = document.body.querySelector('.modal-content');
    expect(modalContent).toBeInTheDocument();
    expect(modalContent).not.toHaveClass('modal-wide');

    const modalHeader = modalContent.querySelector('.modal-header');
    const modalBody = modalContent.querySelector('.modal-body');
    const modalActions = modalContent.querySelector('.modal-actions');

    expect(modalHeader).toBeInTheDocument();
    expect(modalBody).toBeInTheDocument();
    expect(modalActions).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Player Name/i);
    expect(modalBody).toContainElement(nameInput);
    nameInput.focus();
    expect(nameInput).toHaveFocus();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const saveBtn = screen.getByRole('button', { name: 'Save' });

    expect(modalActions).toContainElement(cancelBtn);
    expect(modalActions).toContainElement(saveBtn);
    expect(cancelBtn).toHaveClass('btn', 'btn-secondary');
    expect(saveBtn).toHaveClass('btn', 'btn-primary');
    expect(saveBtn).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: 'Alice Updated' } });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(socketService.changePlayerName).toHaveBeenCalledWith('GAME1234', 'Alice Updated');
  });

  it('closes reliably when clicking .modal-overlay or pressing Escape regardless of .modal-body scroll position', () => {
    const onClose = vi.fn();
    render(
      <NameChangeModal
        game={sampleGame}
        currentPlayer={samplePlayer}
        onClose={onClose}
      />
    );

    const modalBody = document.body.querySelector('.modal-body');
    modalBody.scrollTop = 120;
    fireEvent.scroll(modalBody, { target: { scrollTop: 120 } });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const overlay = document.body.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
