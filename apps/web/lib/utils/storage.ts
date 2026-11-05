// The app's namespaced localStorage, laid out as `@miden-sdk/react`'s
// `createMidenStorage("miden-playground")` did (`miden-playground:<key>`, JSON
// values) so stored choices carry over, without importing the SDK:
// NetworkProvider is in the app shell's module graph, which stays SDK-free so
// the shell paints before the WASM (docs/claude/phone-layout.md).
const prefix = "miden-playground";

const fullKey = (key: string) => `${prefix}:${key}`;

const storage = {
  get: <T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(fullKey(key));
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown) => {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch {
      // Storage can be full or blocked: the choice won't persist.
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(fullKey(key));
    } catch {
      // Same as above.
    }
  },
};

export default storage;
