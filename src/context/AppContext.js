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
    const cleaned = cleanLibrary(loadLibrary());
    setTracks(cleaned);
    setSettings(loadSettings());
    if (cleaned.length !== loadLibrary().length) saveLibrary(cleaned);
    setReady(true);
  }, []);

  const persistTracks = (next) => {
    setTracks(next);
    saveLibrary(next);
  };

  const addTrack = async (asset) => {
    const track = await importAudioFile(asset);
    persistTracks([track, ...tracks]);
    return track;
  };

  const addDeviceTracks = (deviceTracks) => {
    const knownUris = new Set(tracks.map((t) => t.uri));
    const knownIds = new Set(tracks.map((t) => t.deviceId).filter(Boolean));
    const fresh = deviceTracks.filter(
      (t) => !knownUris.has(t.uri) && !knownIds.has(t.deviceId)
    );
    if (fresh.length) persistTracks([...fresh, ...tracks]);
    return fresh.length;
  };

  const removeTrack = (id) => {
    const track = tracks.find((t) => t.id === id);
    if (track && track.source !== 'device') deleteTrackFile(track.uri);
    persistTracks(tracks.filter((t) => t.id !== id));
  };

  const updateTrack = (id, patch) => {
    persistTracks(tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
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
