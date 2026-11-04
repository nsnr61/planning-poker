import React, { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useModalDismiss } from '../hooks/useModalDismiss';

const MAX_CUSTOM_DECK_CARDS = 15;

const CustomDeckEditor = ({ game, onClose, isEditing = false }) => {
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState(['', '', '', '', '']); // Start with 5 empty slots
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing && game.customDeck) {
      setDeckName(game.customDeck.name);
      const existingCards = game.customDeck.cards || [];
      setCards(
        existingCards.length < MAX_CUSTOM_DECK_CARDS
          ? [...existingCards, '']
          : [...existingCards]
      );
    }
  }, [isEditing, game.customDeck]);

  const handleCancel = useCallback(() => {
    setDeckName('');
    setCards(['', '', '', '', '']);
    setErrors({});
    onClose();
  }, [onClose]);

  useModalDismiss(handleCancel);

  const addCardSlot = () => {
    if (cards.length < MAX_CUSTOM_DECK_CARDS) {
      setCards([...cards, '']);
    }
  };

  const removeCardSlot = (index) => {
    if (cards.length > 1) {
      const newCards = cards.filter((_, i) => i !== index);
      setCards(newCards);
    }
  };

  const updateCard = (index, value) => {
    const newCards = [...cards];
    newCards[index] = value;
    setCards(newCards);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!deckName.trim()) {
      newErrors.deckName = 'Deck name is required';
    } else if (deckName.length > 15) {
      newErrors.deckName = 'Deck name must be 15 characters or less';
    }
    
    const validCards = cards.filter(card => card.trim() !== '');
    if (validCards.length < 2) {
      newErrors.cards = 'At least 2 cards are required';
    } else {
      // Check if any card exceeds 15 characters
      const invalidCards = validCards.filter(card => card.length > 15);
      if (invalidCards.length > 0) {
        newErrors.cards = 'Each card must be 15 characters or less';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const validCards = cards.filter(card => card.trim() !== '');
    
    if (isEditing) {
      socketService.editCustomDeck(game.id, {
        name: deckName.trim(),
        cards: validCards
      });
    } else {
      socketService.createCustomDeck(game.id, {
        name: deckName.trim(),
        cards: validCards
      });
    }
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Custom Deck (15 Cards Max)' : 'Create Custom Deck (15 Cards Max)'}</h3>
          <button type="button" className="modal-close" onClick={handleCancel} aria-label="Close">×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="deckName">Deck Name:</label>
              <input
                type="text"
                id="deckName"
                className="input"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Enter deck name"
                maxLength={15}
                required
              />
              {errors.deckName && <span className="error-text">{errors.deckName}</span>}
            </div>

            <div className="form-group">
              <label>Cards:</label>
              {errors.cards && <span className="error-text">{errors.cards}</span>}
              <div className="cards-input-container">
                {cards.map((card, index) => (
                  <div key={index} className="card-input-row">
                    <input
                      type="text"
                      className="input card-input"
                      value={card}
                      onChange={(e) => updateCard(index, e.target.value)}
                      placeholder={`Card ${index + 1}`}
                      maxLength={15}
                    />
                    {cards.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeCardSlot(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addCardSlot}
                  disabled={cards.length >= MAX_CUSTOM_DECK_CARDS}
                >
                  Add Card {cards.length >= MAX_CUSTOM_DECK_CARDS ? '(Max 15 cards)' : ''}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Deck' : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomDeckEditor;
