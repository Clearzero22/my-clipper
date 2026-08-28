import { useEffect, useState } from "react";
import { clipStore } from "../shared/storage";
import { CLIPS_KEY, type Clip } from "../shared/types";

export function useClips(): { clips: Clip[]; reload: () => Promise<void> } {
  const [clips, setClips] = useState<Clip[]>([]);

  const reload = async () => setClips(await clipStore.list());
  useEffect(() => {
    reload();
    const off = clipStore.onChange(setClips);

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && changes[CLIPS_KEY]) reload();
    };
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onChanged);
    }

    return () => {
      off();
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(onChanged);
      }
    };
  }, []);

  return { clips, reload };
}

export type Theme = "light" | "dark";

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let alive = true;
    const apply = (t: Theme) =>
      document.documentElement.classList.toggle("dark", t === "dark");

    const read = () => {
      if (typeof chrome === "undefined" || !chrome.storage) {
        const sys = window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        setTheme(sys);
        apply(sys);
        return;
      }
      chrome.storage.local.get("theme", (res) => {
        let t: Theme =
          res.theme ??
          (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        if (!alive) return;
        setTheme(t);
        apply(t);
      });
    };
    read();

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && changes.theme) {
        const t = (changes.theme.newValue ?? "light") as Theme;
        setTheme(t);
        apply(t);
      }
    };
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onChanged);
    }
    return () => {
      alive = false;
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(onChanged);
      }
    };
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ theme: next });
    }
  };

  return { theme, toggle };
}
