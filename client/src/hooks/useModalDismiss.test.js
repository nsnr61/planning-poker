import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModalDismiss } from './useModalDismiss';

describe('useModalDismiss Hook (Ticket 07)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('locks document.body.style.overflow to hidden on mount and restores to unset on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = renderHook(() => useModalDismiss(onDismiss));

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('calls onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn();
    renderHook(() => useModalDismiss(onDismiss));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when other keys are pressed', () => {
    const onDismiss = vi.fn();
    renderHook(() => useModalDismiss(onDismiss));

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('removes the keydown listener when unmounted so subsequent Escape key presses are ignored', () => {
    const onDismiss = vi.fn();
    const { unmount } = renderHook(() => useModalDismiss(onDismiss));

    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
