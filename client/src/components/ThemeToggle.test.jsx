import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle (Ticket 01)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('toggles data-theme on document.documentElement between dark and null and persists in localStorage', () => {
    render(<ThemeToggle />);

    const toggleBtn = screen.getByRole('button');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();

    // Activate dark mode
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('theme')).toBe('dark');

    // Return to light mode
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('restores saved dark theme from localStorage on mount', () => {
    window.localStorage.setItem('theme', 'dark');
    render(<ThemeToggle inline={true} />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button')).toHaveClass('theme-toggle-inline');
  });
});
