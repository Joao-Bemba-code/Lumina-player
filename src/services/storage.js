import { Directory, File, Paths } from 'expo-file-system';

const DATA_DIR = new Directory(Paths.document, 'lumina');
const LIBRARY_FILE = 'library.json';
const SETTINGS_FILE = 'settings.json';

const CONFIGURED_API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

export const DEFAULT_API_KEY = CONFIGURED_API_KEY;

export const DEFAULT_SETTINGS = {
  apiKey: DEFAULT_API_KEY,
  targetLang: 'pt-BR',
  autoTranslate: true,
};

function uniqueId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function niceTitle(name) {
  const base = name.replace(/\.[^.]*$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Mídia';
}

function ensureDir() {
  if (!DATA_DIR.exists) {
    DATA_DIR.create({ idempotent: true, intermediates: true });
  }
}

function dataFile(name) {
  return new File(DATA_DIR, name);
}

function readJson(name, fallback) {
  try {
    const file = dataFile(name);
    if (file.exists) {
      return JSON.parse(file.textSync());
    }
  } catch (e) {
    console.warn('readJson failed', name, e);
  }
  return fallback;
}

function writeJson(name, value) {
  try {
    ensureDir();
    const file = dataFile(name);
    file.create({ idempotent: true, overwrite: true });
    file.write(JSON.stringify(value));
  } catch (e) {
    console.warn('writeJson failed', name, e);
  }
}

export function loadLibrary() {
  return readJson(LIBRARY_FILE, []);
}

export function saveLibrary(tracks) {
  writeJson(LIBRARY_FILE, tracks);
}

export function loadSettings() {
  const saved = readJson(SETTINGS_FILE, {});
  saved.apiKey = DEFAULT_API_KEY;
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings) {
  writeJson(SETTINGS_FILE, settings);
}

export async function importAudioFile(asset) {
  ensureDir();
  if (!asset?.uri) throw new Error('Arquivo inválido selecionado.');
  const safe = (asset.name || 'audio').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${safe}`;
  const dest = new File(DATA_DIR, fileName);

  try {
    const src = new File(asset.uri);
    if (src.exists) {
      await src.copy(dest);
    } else {
      const res = await fetch(asset.uri);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = await res.arrayBuffer();
      dest.create({ idempotent: true, overwrite: true });
      dest.write(new Uint8Array(bytes));
    }
  } catch (e) {
    throw new Error(`Não foi possível copiar o arquivo. (${String(asset.uri).slice(0, 80)}) ${e.message}`);
  }

  if (!dest.exists) throw new Error('Falha ao copiar o arquivo para a biblioteca.');
  return {
    id: uniqueId(),
    title: niceTitle(asset.name),
    uri: dest.uri,
    size: dest.size,
    addedAt: Date.now(),
  };
}

export function deleteTrackFile(uri) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('deleteTrackFile failed', uri, e);
  }
}

export function cleanLibrary(tracks) {
  return tracks.filter((track) => {
    if (track.source === 'device') return true;
    try {
      return new File(track.uri).exists;
    } catch (e) {
      return false;
    }
  });
}
