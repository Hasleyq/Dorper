import { useState, useEffect, useCallback } from 'react';

export interface FlockSettings {
  flockName: string;
  breederName: string;
  address: string;
  flockId: string;
  logoUrl: string | null;
  defaultLanguage: 'pl' | 'en';
  breedPurity: string;
}

export const DEFAULT_FLOCK_SETTINGS: FlockSettings = {
  flockName: 'DORPER BARWAŁD',
  breederName: 'Bartosz Wróbel',
  address: '34-130 Barwałd Górny',
  flockId: 'PL-123456789',
  logoUrl: null,
  defaultLanguage: 'pl',
  breedPurity: '100',
};

const STORAGE_KEY = 'dorper_flock_settings';

export function getCachedFlockSettings(): FlockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_FLOCK_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_FLOCK_SETTINGS;
}

export function useFlockSettings() {
  const [settings, setSettings] = useState<FlockSettings>(() => getCachedFlockSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load from backend settings if available
  useEffect(() => {
    let mounted = true;
    async function fetchSettings() {
      if (!window.electronAPI?.settings) return;
      try {
        setLoading(true);
        const saved = await window.electronAPI.settings.get('flock_settings');
        if (saved && mounted) {
          const parsed = JSON.parse(saved);
          const merged = { ...DEFAULT_FLOCK_SETTINGS, ...parsed };
          setSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Failed to load flock settings from backend:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<FlockSettings>) => {
    setSaving(true);
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    if (window.electronAPI?.settings) {
      try {
        await window.electronAPI.settings.set('flock_settings', JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save flock settings to backend:', err);
      }
    }
    setSaving(false);
    return merged;
  }, [settings]);

  return { settings, saveSettings, loading, saving };
}
