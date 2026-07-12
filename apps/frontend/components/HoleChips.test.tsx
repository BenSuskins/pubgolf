import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HoleChips } from './HoleChips';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

const pars = [1, 3, 2, 2, 2, 2, 4, 1, 1];
const scores: (number | null)[] = [1, 4, 1, null, null, null, null, null, null];

describe('HoleChips', () => {
  test('should render a chip for each of the nine holes', () => {
    render(
      <HoleChips selectedHole={4} scores={scores} pars={pars} onSelect={() => {}} />
    );
    for (let hole = 1; hole <= 9; hole++) {
      expect(screen.getByRole('button', { name: new RegExp(`^Hole ${hole},`) })).toBeInTheDocument();
    }
  });

  test('should mark the selected hole as pressed', () => {
    render(
      <HoleChips selectedHole={4} scores={scores} pars={pars} onSelect={() => {}} />
    );
    expect(screen.getByRole('button', { name: /^Hole 4,/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /^Hole 1,/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('should announce logged sips for played holes and not played for the rest', () => {
    render(
      <HoleChips selectedHole={4} scores={scores} pars={pars} onSelect={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Hole 2, 4 sips logged' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hole 9, not played' })).toBeInTheDocument();
  });

  test('should call onSelect with the tapped hole', async () => {
    const handleSelect = mock(() => {});
    const user = userEvent.setup();
    render(
      <HoleChips selectedHole={4} scores={scores} pars={pars} onSelect={handleSelect} />
    );

    await user.click(screen.getByRole('button', { name: /^Hole 2,/ }));

    expect(handleSelect).toHaveBeenCalledWith(2);
  });

  test('should disable all chips when disabled', () => {
    render(
      <HoleChips selectedHole={1} scores={scores} pars={pars} onSelect={() => {}} disabled />
    );
    expect(screen.getByRole('button', { name: /^Hole 1,/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Hole 9,/ })).toBeDisabled();
  });

  test('should have no accessibility violations', async () => {
    const { container } = render(
      <HoleChips selectedHole={4} scores={scores} pars={pars} onSelect={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
