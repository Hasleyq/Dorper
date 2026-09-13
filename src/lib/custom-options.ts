import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage customizable dropdown options with persistence (via settings API + localStorage fallback)
 */
export function useCustomOptions(key: string, defaultOptions: string[]) {
  const [options, setOptions] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(`custom_opt_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const combined = Array.from(new Set([...defaultOptions, ...parsed]));
        return combined;
      }
    } catch {}
    return defaultOptions;
  });

  const [loading, setLoading] = useState(false);

  // Load from backend settings if available
  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      if (!window.electronAPI?.settings) return;
      try {
        setLoading(true);
        const saved = await window.electronAPI.settings.get(`custom_options_${key}`);
        if (saved && mounted) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setOptions((prev) => {
                const merged = Array.from(new Set([...defaultOptions, ...prev, ...parsed]));
                localStorage.setItem(`custom_opt_${key}`, JSON.stringify(merged));
                return merged;
              });
            }
          } catch {}
        }
      } catch (err) {
        console.warn(`Failed to fetch custom options for ${key}:`, err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [key, defaultOptions]);

  const addOption = useCallback(
    async (newOption: string) => {
      const trimmed = newOption.trim();
      if (!trimmed) return null;

      let updatedList: string[] = [];
      setOptions((prev) => {
        if (prev.includes(trimmed)) return prev;
        updatedList = [...prev, trimmed];
        try {
          localStorage.setItem(`custom_opt_${key}`, JSON.stringify(updatedList));
        } catch {}
        return updatedList;
      });

      // Save to settings in DB
      if (window.electronAPI?.settings) {
        try {
          const toSave = Array.from(new Set([...options, trimmed]));
          await window.electronAPI.settings.set(
            `custom_options_${key}`,
            JSON.stringify(toSave)
          );
        } catch (err) {
          console.error(`Failed to persist custom option for ${key}:`, err);
        }
      }

      return trimmed;
    },
    [key, options]
  );

  return { options, addOption, loading };
}
