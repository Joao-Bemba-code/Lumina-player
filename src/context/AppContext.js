import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadLibrary,
  saveLibrary,
  loadSettings,
  saveSettings,
  importAudioFile,
  deleteTrackFile,
  cleanLibrary,
  DEFAULT_SETTINGS,
} from '../services/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tracks, setTracks] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadLibrary();
    const cleaned = cleanLibrary(stored);
    if (cleaned.length !== stored.length) saveLibrary(cleaned);
    setTracks(cleaned);
    setSettings(loadSettings());
    setReady(true);
  }, []);

  const persistTracks = (updater) => {
    setTracks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveLibrary(next);
      return next;
    });
  };

  const addTrack = async (asset) => {
    const track = await importAudioFile(asset);
    persistTracks((prev) => [track, ...prev]);
    return track;
  };

  const addDeviceTracks = (deviceTracks) => {
    const knownUris = new Set(tracks.map((t) => t.uri));
    const knownIds = new Set(tracks.map((t) => t.deviceId).filter(Boolean));
    const fresh = deviceTracks.filter(
      (t) => !knownUris.has(t.uri) && !knownIds.has(t.deviceId)
    );
    if (fresh.length) persistTracks((prev) => [...fresh, ...prev]);
    return fresh.length;
  };

  const removeTrack = (id) => {
    const track = tracks.find((t) => t.id === id);
    if (track && track.source !== 'device') deleteTrackFile(track.uri);
    persistTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrack = (id, patch) => {
    persistTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const setSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const value = useMemo(
    () => ({
      tracks,
      settings,
      ready,
      addTrack,
      addDeviceTracks,
      removeTrack,
      updateTrack,
      setSetting,
    }),
    [tracks, settings, ready]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
