import * as MediaLibrary from 'expo-media-library/legacy';

const MAX_SCAN = 2000;
const PAGE_SIZE = 100;

function niceTitle(name) {
  const base = String(name || 'audio').replace(/\.[^.]*$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Música';
}

function mapAsset(asset) {
  return {
    id: `device_${asset.id}`,
    deviceId: asset.id,
    title: niceTitle(asset.filename),
    uri: asset.uri,
    duration: asset.duration || 0,
    size: asset.size || undefined,
    source: 'device',
    addedAt: Date.now(),
  };
}

async function ensurePermission() {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
    if (perm.granted || perm.accessPrivileges === 'limited') return;
  } catch (e) {
    console.warn('granular audio permission failed', e);
  }
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted && perm.accessPrivileges !== 'limited') {
    throw new Error('Permissão negada. Permita o acesso às músicas nas Configurações do aparelho.');
  }
}

export async function loadDeviceTracks() {
  await ensurePermission();

  const assets = [];
  let after;
  let hasNextPage = true;

  while (hasNextPage && assets.length < MAX_SCAN) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      first: PAGE_SIZE,
      ...(after ? { after } : {}),
    });
    assets.push(...page.assets);
    after = page.endCursor;
    hasNextPage = page.hasNextPage;
  }

  return assets.map(mapAsset);
}
