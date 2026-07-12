import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SegmentedControl } from './SegmentedControl';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

const options = [
  { value: 'host', label: 'Host a Round' },
  { value: 'join', label: 'Join a Round' },
];

describe('SegmentedControl', () => {
  test('should render all options', () => {
    render(
      <SegmentedControl ariaLabel="Mode" options={options} value="host" onChange={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Host a Round' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join a Round' })).toBeInTheDocument();
  });

  test('should mark the selected option as pressed', () => {
    render(
      <SegmentedControl ariaLabel="Mode" options={options} value="join" onChange={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Join a Round' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Host a Round' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('should call onChange with the tapped option value', async () => {
    const handleChange = mock(() => {});
    const user = userEvent.setup();
    render(
      <SegmentedControl ariaLabel="Mode" options={options} value="host" onChange={handleChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Join a Round' }));

    expect(handleChange).toHaveBeenCalledWith('join');
  });

  test('should have no accessibility violations', async () => {
    const { container } = render(
      <SegmentedControl ariaLabel="Mode" options={options} value="host" onChange={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
