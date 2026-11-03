import { useSyncExternalStore } from "react";
import { isMac } from "@/hooks/use-script-shortcuts";

// The script page's editor settings, for every editor (source, manifests,
// MASM) and every script, kept in localStorage across reloads. Not in the app
// state: they are the browser's, not saved with projects.

export type EditorSettings = {
  minimap: boolean;
  fontSize: number;
};

// Monaco's own default font size.
export const DEFAULT_FONT_SIZE = isMac ? 12 : 14;

export const FONT_SIZES = [10, 12, 14, 16, 18, 20];

const DEFAULT_SETTINGS: EditorSettings = {
  minimap: true,
  fontSize: DEFAULT_FONT_SIZE,
};

const STORAGE_KEY = "editor-settings";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Another tab's change.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

// useSyncExternalStore needs the same object while nothing changed.
let cached: { raw: string | null; settings: EditorSettings } | undefined;

const parse = (raw: string | null): EditorSettings => {
  try {
    const stored = raw ? (JSON.parse(raw) as Partial<EditorSettings>) : {};
    return {
      minimap:
        typeof stored.minimap === "boolean"
          ? stored.minimap
          : DEFAULT_SETTINGS.minimap,
      fontSize:
        typeof stored.fontSize === "number" &&
        FONT_SIZES.includes(stored.fontSize)
          ? stored.fontSize
          : DEFAULT_SETTINGS.fontSize,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const getSettings = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (cached?.raw !== raw) {
    cached = { raw, settings: parse(raw) };
  }
  return cached.settings;
};

export const updateEditorSettings = (update: Partial<EditorSettings>) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...getSettings(), ...update }),
  );
  for (const listener of listeners) {
    listener();
  }
};

export const useEditorSettings = () =>
  useSyncExternalStore(subscribe, getSettings);
