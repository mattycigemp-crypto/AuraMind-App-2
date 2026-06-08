import React from 'react';
import { vi, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetentionConicChart } from '../RetentionConicChart';

describe('RetentionConicChart', () => {
  beforeEach(() => {
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
      observe, unobserve, disconnect,
    })));
  });

  it('renders without crashing', () => {
    render(<RetentionConicChart progress={75} />);
    expect(screen.getByText('75%')).toBeDefined();
  });

  it('accepts custom size prop', () => {
    render(<RetentionConicChart progress={50} size={300} label="Test" />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('width')).toBe('300');
    expect(svg.getAttribute('height')).toBe('300');
  });

  it('displays label when provided', () => {
    render(<RetentionConicChart progress={60} label="Memory" />);
    expect(screen.getByText('Memory')).toBeDefined();
  });
});


