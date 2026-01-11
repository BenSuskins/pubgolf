import { describe, test, expect, beforeEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useSeenEvents } from './useSeenEvents';

describe('useSeenEvents', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('getSeenEvents', () => {
    test('should return empty array when no events stored', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.getSeenEvents()).toEqual([]);
    });

    test('should return stored events', () => {
      window.localStorage.setItem('pubgolf-ABCD-seenEvents', JSON.stringify(['event1', 'event2']));
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.getSeenEvents()).toEqual(['event1', 'event2']);
    });

    test('should return empty array for invalid JSON', () => {
      window.localStorage.setItem('pubgolf-ABCD-seenEvents', 'invalid json');
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.getSeenEvents()).toEqual([]);
    });

    test('should return empty array when gameCode is null', () => {
      const { result } = renderHook(() => useSeenEvents(null));
      expect(result.current.getSeenEvents()).toEqual([]);
    });
  });

  describe('markEventAsSeen', () => {
    test('should add event to seen events', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));

      act(() => {
        result.current.markEventAsSeen('power-hour');
      });

      expect(result.current.getSeenEvents()).toEqual(['power-hour']);
    });

    test('should not duplicate events', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));

      act(() => {
        result.current.markEventAsSeen('power-hour');
        result.current.markEventAsSeen('power-hour');
      });

      expect(result.current.getSeenEvents()).toEqual(['power-hour']);
    });

    test('should add multiple different events', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));

      act(() => {
        result.current.markEventAsSeen('power-hour');
        result.current.markEventAsSeen('double-trouble');
      });

      expect(result.current.getSeenEvents()).toEqual(['power-hour', 'double-trouble']);
    });

    test('should not store when gameCode is null', () => {
      const { result } = renderHook(() => useSeenEvents(null));

      act(() => {
        result.current.markEventAsSeen('power-hour');
      });

      expect(result.current.getSeenEvents()).toEqual([]);
    });

    test('should persist to localStorage', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));

      act(() => {
        result.current.markEventAsSeen('power-hour');
      });

      expect(window.localStorage.getItem('pubgolf-ABCD-seenEvents')).toBe(
        JSON.stringify(['power-hour'])
      );
    });
  });

  describe('hasSeenEvent', () => {
    test('should return false for unseen event', () => {
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.hasSeenEvent('power-hour')).toBe(false);
    });

    test('should return true for seen event', () => {
      window.localStorage.setItem('pubgolf-ABCD-seenEvents', JSON.stringify(['power-hour']));
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.hasSeenEvent('power-hour')).toBe(true);
    });

    test('should return false for different event', () => {
      window.localStorage.setItem('pubgolf-ABCD-seenEvents', JSON.stringify(['power-hour']));
      const { result } = renderHook(() => useSeenEvents('ABCD'));
      expect(result.current.hasSeenEvent('double-trouble')).toBe(false);
    });
  });

  describe('game code isolation', () => {
    test('should isolate events by game code', () => {
      window.localStorage.setItem('pubgolf-ABCD-seenEvents', JSON.stringify(['event1']));
      window.localStorage.setItem('pubgolf-WXYZ-seenEvents', JSON.stringify(['event2']));

      const { result: resultABCD } = renderHook(() => useSeenEvents('ABCD'));
      const { result: resultWXYZ } = renderHook(() => useSeenEvents('WXYZ'));

      expect(resultABCD.current.getSeenEvents()).toEqual(['event1']);
      expect(resultWXYZ.current.getSeenEvents()).toEqual(['event2']);
    });
  });

  describe('function stability', () => {
    test('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useSeenEvents('ABCD'));

      const firstRender = {
        getSeenEvents: result.current.getSeenEvents,
        markEventAsSeen: result.current.markEventAsSeen,
        hasSeenEvent: result.current.hasSeenEvent,
      };

      rerender();

      expect(result.current.getSeenEvents).toBe(firstRender.getSeenEvents);
      expect(result.current.markEventAsSeen).toBe(firstRender.markEventAsSeen);
      expect(result.current.hasSeenEvent).toBe(firstRender.hasSeenEvent);
    });
  });
});
