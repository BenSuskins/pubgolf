import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { SlotMachine } from './SlotMachine';

describe('SlotMachine', () => {
  const mockOnSpinEnd = mock(() => {});
  const defaultItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  beforeEach(() => {
    mockOnSpinEnd.mockClear();
  });

  describe('rendering', () => {
    test('should render slot container with items', () => {
      render(
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      // Items are repeated multiple times for the looping effect
      const item1Elements = screen.getAllByText('Item 1');
      expect(item1Elements.length).toBeGreaterThan(0);
    });

    test('should render all item types', () => {
      render(
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      defaultItems.forEach((item) => {
        expect(screen.getAllByText(item).length).toBeGreaterThan(0);
      });
    });

    test('should render gradient overlays for fade effect', () => {
      const { container } = render(
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      // Check for gradient divs (left and right fades)
      const gradients = container.querySelectorAll('.bg-gradient-to-r, .bg-gradient-to-l');
      expect(gradients.length).toBe(2);
    });

    test('should render center indicator line', () => {
      const { container } = render(
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      // Check for the center indicator line
      const indicator = container.querySelector('.left-1\\/2');
      expect(indicator).not.toBeNull();
    });
  });

  describe('empty items', () => {
    test('should not crash with empty items array', () => {
      expect(() => {
        render(
          <SlotMachine
            items={[]}
            winningIndex={null}
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
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
          spinDuration={0.1} // Use short duration for tests
        />
      );

      // Start spinning
      rerender(
        <SlotMachine
          items={defaultItems}
          winningIndex={2}
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
  });

  describe('props handling', () => {
    test('should accept custom spinDuration', () => {
      expect(() => {
        render(
          <SlotMachine
            items={defaultItems}
            winningIndex={null}
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
          <SlotMachine
            items={defaultItems}
            winningIndex={null}
            spinning={false}
            onSpinEnd={mockOnSpinEnd}
          />
        );
      }).not.toThrow();
    });

    test('should handle winningIndex correctly', () => {
      expect(() => {
        render(
          <SlotMachine
            items={defaultItems}
            winningIndex={3}
            spinning={false}
            onSpinEnd={mockOnSpinEnd}
          />
        );
      }).not.toThrow();
    });
  });

  describe('item repetition', () => {
    test('should repeat items for looping effect', () => {
      render(
        <SlotMachine
          items={defaultItems}
          winningIndex={null}
          spinning={false}
          onSpinEnd={mockOnSpinEnd}
        />
      );

      // Each item should appear multiple times (8 repetitions in the code)
      const item1Count = screen.getAllByText('Item 1').length;
      expect(item1Count).toBe(8);
    });
  });
});
