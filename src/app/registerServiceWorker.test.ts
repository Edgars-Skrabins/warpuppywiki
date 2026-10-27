import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "./registerServiceWorker";

function stubServiceWorker(register: () => Promise<unknown>) {
  Object.defineProperty(navigator, "serviceWorker", { value: { register: vi.fn(register) }, configurable: true });
  return (navigator.serviceWorker as unknown as { register: ReturnType<typeof vi.fn> }).register;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("registerServiceWorker", () => {
  it("does not register in development", () => {
    vi.stubEnv("PROD", false);
    const register = stubServiceWorker(() => Promise.resolve({}));

    registerServiceWorker();

    expect(register).not.toHaveBeenCalled();
  });

  it("does nothing when the browser has no service worker support", () => {
    vi.stubEnv("PROD", true);

    expect("serviceWorker" in navigator).toBe(false);
    expect(() => registerServiceWorker()).not.toThrow();
  });

  it("registers sw.js at the site base once in production", () => {
    vi.stubEnv("PROD", true);
    const register = stubServiceWorker(() => Promise.resolve({}));

    registerServiceWorker();

    const base = import.meta.env.BASE_URL;
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith(`${base}sw.js`, { scope: base });
  });

  it("warns once when registration fails", async () => {
    vi.stubEnv("PROD", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubServiceWorker(() => Promise.reject(new Error("blocked")));

    registerServiceWorker();

    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
  });
});
