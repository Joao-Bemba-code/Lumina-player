import { fetch as expoFetch } from 'expo/fetch';

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
const GROQ_MODEL = 'whisper-large-v3-turbo';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_FILE_SIZE = 24 * 1024 * 1024;

export const TRANSCRIBE_MODEL = GROQ_MODEL;

const LANG_NAMES = {
  english: 'en',
  portuguese: 'pt',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it',
  japanese: 'ja',
  chinese: 'zh',
  korean: 'ko',
  russian: 'ru',
  arabic: 'ar',
  hindi: 'hi',
  dutch: 'nl',
  polish: 'pl',
  turkish: 'tr',
  swedish: 'sv',
  danish: 'da',
  norwegian: 'no',
  finnish: 'fi',
  greek: 'el',
  hebrew: 'he',
  thai: 'th',
  vietnamese: 'vi',
  indonesian: 'id',
  malay: 'ms',
  ukrainian: 'uk',
  czech: 'cs',
  hungarian: 'hu',
  romanian: 'ro',
  catalan: 'ca',
  serbian: 'sr',
  croatian: 'hr',
  bulgarian: 'bg',
  slovak: 'sk',
  slovenian: 'sl',
  lithuanian: 'lt',
  latvian: 'lv',
  estonian: 'et',
  persian: 'fa',
  urdu: 'ur',
  bengali: 'bn',
  tamil: 'ta',
  telugu: 'te',
  marathi: 'mr',
  gujarati: 'gu',
  kannada: 'kn',
  malayalam: 'ml',
  punjabi: 'pa',
  nepali: 'ne',
  sinhala: 'si',
  khmer: 'km',
  lao: 'lo',
  burmese: 'my',
  amharic: 'am',
  swahili: 'sw',
  afrikaans: 'af',
  welsh: 'cy',
  irish: 'ga',
  icelandic: 'is',
  macedonian: 'mk',
  albanian: 'sq',
  bosnian: 'bs',
  galician: 'gl',
  basque: 'eu',
  luxembourgish: 'lb',
};

function normalizeLang(lang) {
  const c = String(lang || '').toLowerCase().trim();
  if (LANG_NAMES[c]) return LANG_NAMES[c];
  const base = c.split('-')[0];
  return base || 'en';
}

function primaryLang(code) {
  return String(code || '').toLowerCase().split('-')[0];
}

function mapLang(code) {
  const c = String(code || '').toLowerCase();
  if (c.startsWith('pt')) return 'pt';
  return c;
}

export async function transcribeAudio(fileRef, { apiKey, language }) {
  if (!apiKey) {
    throw new Error('Adicione sua chave da API nas Configurações.');
  }
  if (fileRef?.size != null && fileRef.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo maior que 24 MB. Use um áudio mais curto.');
  }

  const form = new FormData();
  form.append('model', GROQ_MODEL);
  form.append('response_format', 'verbose_json');
  if (language) form.append('language', language);
  form.append('file', fileRef);

  const response = await expoFetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    body: form,
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Erro da API (${response.status})`;
    throw new Error(message);
  }

  const segments = (data.segments || [])
    .map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: (s.text || '').trim(),
    }))
    .filter((s) => s.text);

  return {
    text: data.text || '',
    language: normalizeLang(data.language),
    duration: data.duration || 0,
    segments,
  };
}

async function myMemoryTranslate(text, sourceLang, targetLang) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const langpair = `${sourceLang}|${targetLang}`;
      const url = `${MYMEMORY_URL}?q=${encodeURIComponent(
        text
      )}&langpair=${encodeURIComponent(langpair)}`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      const translated = data?.responseData?.translatedText;
      if (!translated) {
        throw new Error(data?.responseDetails || 'Falha na tradução');
      }
      return translated;
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastError;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function translateSegments(segments, sourceLang, targetLang, onProgress) {
  const src = mapLang(normalizeLang(sourceLang));
  const tgt = mapLang(targetLang);
  const sameLanguage = primaryLang(src) === primaryLang(tgt);
  const results = [];

  for (let i = 0; i < segments.length; i++) {
    let translation = null;
    if (sameLanguage) {
      translation = segments[i].text;
    } else {
      try {
        const translated = await myMemoryTranslate(segments[i].text, src, tgt);
        if (translated.trim() !== segments[i].text.trim()) {
          translation = translated;
        }
      } catch (e) {
        console.warn('translate segment failed', i, e);
      }
    }
    results.push({ ...segments[i], translation });
    if (onProgress) onProgress(i + 1, segments.length);
    await sleep(300);
  }
  return results;
}

export async function validateApiKey(apiKey) {
  const response = await fetch(GROQ_MODELS_URL, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Chave inválida (${response.status})`);
  }
  return true;
}
