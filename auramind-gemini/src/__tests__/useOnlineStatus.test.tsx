import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/** jsdom's navigator.onLine is read-only, so redefine the property. */
function setOnLine(value: boolean | undefined) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

afterEach(() => {
  setOnLine(true);
});

describe('useOnlineStatus', () => {
  it('reports the initial connectivity state', () => {
    setOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('flips to offline when the browser fires the event', () => {
    setOnLine(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('recovers when connectivity returns', () => {
    setOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('assumes online when the API is unavailable', () => {
    // A missing navigator.onLine must never produce a false offline banner.
    setOnLine(undefined);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('detaches its listeners on unmount', () => {
    setOnLine(true);
    const { result, unmount } = renderHook(() => useOnlineStatus());
    unmount();

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    // Still the last value seen while mounted — no update after teardown.
    expect(result.current).toBe(true);
  });
});
