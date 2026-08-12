// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetentionConicChart } from '../RetentionConicChart';

describe('RetentionConicChart', () => {
  it('renders with default label', () => {
    render(<RetentionConicChart progress={0} />);
    expect(screen.getByText('Retention')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders with a custom label', () => {
    render(<RetentionConicChart progress={50} label="Memory" />);
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });

  it('renders the animated progress value', async () => {
    render(<RetentionConicChart progress={75} />);
    expect(await screen.findByText('75%')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<RetentionConicChart progress={0} className="my-4" />);
    expect(container.querySelector('.my-4')).toBeInTheDocument();
  });

  it('renders an SVG element', () => {
    const { container } = render(<RetentionConicChart progress={0} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
