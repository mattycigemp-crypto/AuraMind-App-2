import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyPreferenceToDocument,
  getAppPreference,
  normalizeTheme,
  setAppPreference,
  subscribeToAppPreferences,
} from "../lib/appPreferences";

describe("app preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "dark";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-font-size");
    document.documentElement.removeAttribute("data-reduce-motion");
    document.documentElement.removeAttribute("data-high-contrast");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes legacy and supported theme values", () => {
    expect(normalizeTheme("Dark")).toBe("dark");
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("System")).toBe("system");
    expect(normalizeTheme("unexpected")).toBe("dark");
  });

  it("persists values and applies document effects immediately", () => {
    setAppPreference("auramind_theme", "light");
    setAppPreference("auramind_fontSize", "Large");
    setAppPreference("auramind_reduceMotion", true);
    setAppPreference("auramind_highContrast", true);

    expect(getAppPreference("auramind_theme", "dark")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.fontSize).toBe("large");
    expect(document.documentElement.dataset.reduceMotion).toBe("true");
    expect(document.documentElement.dataset.highContrast).toBe("true");
  });

  it("notifies mounted settings surfaces in the same tab", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAppPreferences(listener);

    setAppPreference("auramind_autoSync", false);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getAppPreference("auramind_autoSync", true)).toBe(false);
    unsubscribe();
  });

  it("can apply a preference that came from storage on boot", () => {
    localStorage.setItem("auramind_theme", JSON.stringify("dark"));
    applyPreferenceToDocument("auramind_theme", getAppPreference("auramind_theme", "light"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
