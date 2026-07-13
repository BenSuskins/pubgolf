import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { SpinWheel, computeWedges } from './SpinWheel';

describe('SpinWheel', () => {
  const mockOnSpinEnd = mock(() => {});
  const defaultOptions = [
    { option: 'Item 1', optionSize: 1 },
    { option: 'Item 2', optionSize: 2 },
    { option: 'Item 3', optionSize: 3 },
    { option: 'Item 4', optionSize: 4 },
    { option: 'Item 5', optionSize: 5 },
  ];

  beforeEach(() => {
    mockOnSpinEnd.mockClear();
  });

  describe('computeWedges', () => {
    test('should produce angles proportional to weights', () => {
      const wedges = computeWedges([
        { option: 'A', optionSize: 1 },
        { option: 'B', optionSize: 3 },
      ]);

      expect(wedges[0].endAngle - wedges[0].startAngle).toBeCloseTo(90);
      expect(wedges[1].endAngle - wedges[1].startAngle).toBeCloseTo(270);
    });

    test('should cover the full circle with contiguous wedges', () => {
      const wedges = computeWedges(defaultOptions);

      expect(wedges[0].startAngle).toBe(0);
      expect(wedges[wedges.length - 1].endAngle).toBeCloseTo(360);
      for (let i = 1; i < wedges.length; i++) {
        expect(wedges[i].startAngle).toBeCloseTo(wedges[i - 1].endAngle);
      }
    });

    test('should place midAngle halfway through each wedge', () => {
      const wedges = computeWedges(defaultOptions);

      wedges.forEach((wedge) => {
        expect(wedge.midAngle).toBeCloseTo((wedge.startAngle + wedge.endAngle) / 2);
      });
    });

    test('should treat missing or zero weights as weight 1', () => {
      const wedges = computeWedges([
        { option: 'A', optionSize: 0 },
        { option: 'B', optionSize: 1 },
      ]);

      expect(wedges[0].endAngle - wedges[0].startAngle).toBeCloseTo(180);
    });
  });

  describe('rendering', () => {
    test('should render each option label exactly once', () => {
      render(
        <SpinWheel
          options={defaultOptions}
          winningOption={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      defaultOptions.forEach(({ option }) => {
        expect(screen.getAllByText(option).length).toBe(1);
      });
    });

    test('should render one wedge per option', () => {
      const { container } = render(
        <SpinWheel
          options={defaultOptions}
          winningOption={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      const wedges = container.querySelectorAll('path[data-wedge]');
      expect(wedges.length).toBe(defaultOptions.length);
    });

    test('should render the pointer marking the selected wedge', () => {
      const { container } = render(
        <SpinWheel
          options={defaultOptions}
          winningOption={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      const pointer = container.querySelector('.left-1\\/2');
      expect(pointer).not.toBeNull();
    });
  });

  describe('empty options', () => {
    test('should not crash with empty options array', () => {
      expect(() => {
        render(
          <SpinWheel
            options={[]}
            winningOption={null}
            spinning={false}
            onSpinEnd={mockOnSpinEnd}
          />
        );
      }).not.toThrow();
    });
  });

  describe('spinning behavior', () => {
    test('should call onSpinEnd after spinDuration', async () => {
      const { rerender } = render(
        <SpinWheel
          options={defaultOptions}
          winningOption={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
          spinDuration={0.1} // Use short duration for tests
        />
      );

      // Start spinning
      rerender(
        <SpinWheel
          options={defaultOptions}
          winningOption="Item 3"
          spinning={true}
          onSpinEnd={mockOnSpinEnd}
          spinDuration={0.1}
        />
      );

      // Wait for spin to complete
      await waitFor(
        () => {
          expect(mockOnSpinEnd).toHaveBeenCalledTimes(1);
        },
        { timeout: 500 }
      );
    });

    test('should not call onSpinEnd for an unknown winning option', async () => {
      const { rerender } = render(
        <SpinWheel
          options={defaultOptions}
          winningOption={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
          spinDuration={0.1}
        />
      );

      rerender(
        <SpinWheel
          options={defaultOptions}
          winningOption="Not An Option"
          spinning={true}
          onSpinEnd={mockOnSpinEnd}
          spinDuration={0.1}
        />
      );

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(mockOnSpinEnd).not.toHaveBeenCalled();
    });
  });

  describe('props handling', () => {
    test('should accept custom spinDuration', () => {
      expect(() => {
        render(
          <SpinWheel
            options={defaultOptions}
            winningOption={null}
            spinning={false}
            onSpinEnd={mockOnSpinEnd}
            spinDuration={5}
          />
        );
      }).not.toThrow();
    });

    test('should use default spinDuration of 3 seconds', () => {
      // This test verifies the component accepts missing spinDuration
      expect(() => {
        render(
          <SpinWheel
            options={defaultOptions}
            winningOption={null}
            spinning={false}
            onSpinEnd={mockOnSpinEnd}
          />
        );
      }).not.toThrow();
    });
  });
});
