// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudyCard from '../components/study/StudyCard';

describe('StudyCard', () => {
  it('renders the provided content', () => {
    render(<StudyCard active>Photosynthesis</StudyCard>);
    expect(screen.getByText('Photosynthesis')).toBeInTheDocument();
  });

  it('applies an accessible label', () => {
    render(<StudyCard active aria-label="Card front">Front</StudyCard>);
    expect(screen.getByLabelText('Card front')).toBeInTheDocument();
  });

  it('renders tags in the top corner', () => {
    render(
      <StudyCard active tags={[{ label: 'Biology', key: 'bio' }, { label: 'AI', key: 'ai' }]}>
        Cell
      </StudyCard>,
    );
    expect(screen.getByText('Biology')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('uses huge typography for a single short word', () => {
    const { container } = render(<StudyCard active>Cell</StudyCard>);
    const text = container.querySelector('.font-display');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('italic');
  });

  it('uses body typography for paragraph-length content', () => {
    const longText =
      'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism\'s activities.';
    const { container: _container } = render(<StudyCard active>{longText}</StudyCard>);
    const text = screen.getByText(longText);
    expect(text).toHaveClass('leading-relaxed');
  });

  it('applies active glow class when active', () => {
    const { container } = render(<StudyCard active>Active</StudyCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('shadow-[0_0_40px_-12px_var(--accent-glow)]');
  });

  it('does not apply active glow class when inactive', () => {
    const { container } = render(<StudyCard>Inactive</StudyCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('shadow-[0_0_40px_-12px_var(--accent-glow)]');
  });

  it('keeps tags subtle and small', () => {
    render(
      <StudyCard active tags={[{ label: 'Source', key: 'source' }]}>
        Term
      </StudyCard>,
    );
    const tag = screen.getByText('Source');
    expect(tag).toHaveClass('uppercase');
    expect(tag).toHaveClass('tracking-wider');
  });
});
