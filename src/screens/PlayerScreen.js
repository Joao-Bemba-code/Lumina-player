import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import TopAppBar from '../components/TopAppBar';
import Artwork from '../components/Artwork';
import PlaybackBar from '../components/PlaybackBar';
import TranscriptionView from '../components/TranscriptionView';
import { useApp } from '../context/AppContext';
import { transcribeAudio, translateSegments } from '../services/ai';
import { trackGradient, formatDuration } from '../utils/art';
import { colors, fonts, spacing, radius } from '../theme';

const BREAKPOINT = 768;

function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ArtworkPanel({ track, isWide }) {
  const size = isWide ? 360 : 240;

  return (
    <View style={styles.artworkSection}>
      <View
        style={[
          styles.artworkGlow,
          { width: size + 80, height: size + 80, borderRadius: (size + 80) / 2 },
        ]}
      />
      <View style={[styles.artworkPanel, { width: size, height: size }]}>
        <Artwork
          source={null}
          gradient={trackGradient(track.id)}
          icon="music-note"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(11, 19, 38, 0.85)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.artworkCaption}>
          <Text style={styles.artworkTitle} numberOfLines={2}>
            {track.title}
          </Text>
          <Text style={styles.artworkSubtitle}>
            {formatDuration(track.duration)}
            {track.size ? ` • ${Math.round(track.size / 1024)} KB` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SubtitleHeader({ sourceLang, targetLang, count }) {
  return (
    <View style={styles.transHeader}>
      <View style={styles.langBadge}>
        <Text style={styles.langBadgeText}>{String(sourceLang || '?').toUpperCase()}</Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.onSecondaryContainer} />
        <Text style={styles.langBadgeText}>{String(targetLang).toUpperCase()}</Text>
      </View>
      <Text style={styles.autoSyncText}>{count > 0 ? `${count} legendas` : 'Sem legendas'}</Text>
    </View>
  );
}

function TrackPlayer({ track, index, tracks, onSeekIndex, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const padding = isWide ? spacing.paddingDesktop : spacing.paddingMobile;
  const { updateTrack, settings } = useApp();

  const player = useAudioPlayer(track.uri, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [phase, setPhase] = useState('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const segments = track.transcription?.segments || [];
  const sourceLang = track.transcription?.language;
  const hasSubtitles = segments.length > 0;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, [track.id]);

  useEffect(() => {
    if (status.duration && !track.duration) {
      updateTrack(track.id, { duration: status.duration });
    }
  }, [status.duration]);

  useEffect(() => {
    if (status.didJustFinish && index < tracks.length - 1) {
      onSeekIndex(index + 1);
    }
  }, [status.didJustFinish]);

  const generateSubtitles = async () => {
    if (phase === 'transcribing' || phase === 'translating') return;
    setErrorMsg('');
    setPhase('transcribing');
    try {
      const file = new File(track.uri);
      const result = await transcribeAudio(file, { apiKey: settings.apiKey });
      let finalSegments = result.segments;
      if (
        settings.autoTranslate &&
        result.language &&
        result.language.toLowerCase() !== settings.targetLang.toLowerCase() &&
        finalSegments.length
      ) {
        setPhase('translating');
        finalSegments = await translateSegments(
          finalSegments,
          result.language,
          settings.targetLang,
          (done, total) => setProgressMsg(`Traduzindo ${done}/${total}`)
        );
      }
      updateTrack(track.id, {
        duration: result.duration || track.duration,
        transcription: {
          segments: finalSegments,
          language: result.language,
          generatedAt: Date.now(),
        },
      });
      setPhase('done');
    } catch (e) {
      setErrorMsg(e.message || 'Falha ao gerar legendas.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (hasSubtitles || phase !== 'idle') return;
    if (settings.apiKey) {
      generateSubtitles();
    }
  }, [track.id]);

  let activeIndex = -1;
  if (segments.length) {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (status.currentTime >= segments[i].start) {
        activeIndex = i;
        break;
      }
    }
  }

  const lines = segments.map((s, i) => ({
    id: s.id ?? i,
    text: s.text,
    translation: s.translation,
  }));

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const playing = status.playing;

  const togglePlay = () => {
    if (status.isLoaded === false) return;
    if (playing) player.pause();
    else player.play();
  };

  const openSettings = () => navigation.navigate('Main', { screen: 'Settings' });

  const subtitleArea = () => {
    if (phase === 'transcribing' || phase === 'translating') {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateTitle}>
            {phase === 'transcribing' ? 'Gerando transcrição automática…' : progressMsg || 'Traduzindo…'}
          </Text>
          <Text style={styles.stateHint}>Enviando áudio para transcrição (grátis, via Groq).</Text>
        </View>
      );
    }
    if (!hasSubtitles) {
      return (
        <View style={styles.stateCard}>
          <MaterialCommunityIcons name="subtitles-outline" size={40} color={colors.primary} />
          <Text style={styles.stateTitle}>
            {errorMsg || 'Sem legendas ainda'}
          </Text>
          {!settings.apiKey ? (
            <>
              <Text style={styles.stateHint}>
                Adicione uma chave gratuita nas Configurações para gerar legendas e tradução
                automáticas.
              </Text>
              <Pressable style={styles.primaryButton} onPress={openSettings}>
                <Text style={styles.primaryButtonText}>Ir para Configurações</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.primaryButton} onPress={generateSubtitles}>
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
          )}
        </View>
      );
    }
    return <TranscriptionView lines={lines} activeIndex={activeIndex} />;
  };

  return (
    <View style={styles.container}>
      <TopAppBar
        title="Lumina Player"
        onTranslate={() => Alert.alert('Tradução', 'Tradução automática de legendas ativada nas configurações.')}
        onSearch={() => Alert.alert('Buscar', 'Busca em breve.')}
      />

      <View style={[styles.content, { paddingHorizontal: padding, paddingTop: 108, paddingBottom: isWide ? 24 : 12 }]}>
        {isWide ? (
          <View style={styles.wideRow}>
            <View style={styles.wideLeft}>
              <ArtworkPanel track={track} isWide />
            </View>
            <View style={styles.wideRight}>
              <SubtitleHeader
                sourceLang={sourceLang}
                targetLang={settings.targetLang}
                count={segments.length}
              />
              {subtitleArea()}
            </View>
          </View>
        ) : (
          <>
            <ArtworkPanel track={track} isWide={false} />
            <View style={styles.transcriptionBlock}>
              <SubtitleHeader
                sourceLang={sourceLang}
                targetLang={settings.targetLang}
                count={segments.length}
              />
              {subtitleArea()}
            </View>
          </>
        )}
      </View>

      <BlurView intensity={60} tint="dark" style={[styles.controlsBar, { marginBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.progressRow}>
          <Text style={styles.timeLabel}>{formatTime(status.currentTime)}</Text>
          <PlaybackBar
            progress={progress}
            showThumb
            height={6}
            onSeek={(v) => player.seekTo(v * status.duration)}
          />
          <Text style={styles.timeLabel}>{formatTime(status.duration)}</Text>
        </View>
        <View style={styles.controlsRow}>
          <View style={styles.controlsGroup}>
            <MaterialCommunityIcons name="volume-high" size={24} color={colors.onSurfaceVariant} />
            {isWide && (
              <MaterialCommunityIcons name="speedometer" size={24} color={colors.onSurfaceVariant} />
            )}
          </View>
          <View style={styles.centerControls}>
            <Pressable onPress={() => onSeekIndex((index - 1 + tracks.length) % tracks.length)}>
              <MaterialCommunityIcons name="skip-previous" size={30} color={colors.onSurface} />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              style={({ pressed }) => [styles.mainButton, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
            >
              <MaterialCommunityIcons name={playing ? 'pause' : 'play'} size={32} color={colors.onPrimary} />
            </Pressable>
            <Pressable onPress={() => onSeekIndex((index + 1) % tracks.length)}>
              <MaterialCommunityIcons name="skip-next" size={30} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={styles.controlsGroup}>
            <MaterialCommunityIcons name="closed-caption" size={24} color={colors.onSurfaceVariant} />
            <MaterialCommunityIcons name="playlist-music" size={24} color={colors.onSurfaceVariant} />
          </View>
        </View>
      </BlurView>
    </View>
  );
}

export default function PlayerScreen({ route, navigation }) {
  const { tracks } = useApp();
  const itemId = route?.params?.itemId;
  const [index, setIndex] = useState(() =>
    Math.max(0, tracks.findIndex((t) => t.id === itemId))
  );

  useEffect(() => {
    const i = tracks.findIndex((t) => t.id === itemId);
    if (i >= 0) setIndex(i);
  }, [itemId]);

  const track = tracks[index];

  if (!track) {
    return (
      <View style={styles.container}>
        <TopAppBar title="Lumina Player" />
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Faixa não encontrada</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <TrackPlayer
      key={track.id}
      track={track}
      index={index}
      tracks={tracks}
      onSeekIndex={setIndex}
      navigation={navigation}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    gap: spacing.gutter,
  },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.gutter,
  },
  wideLeft: {
    flex: 1,
  },
  wideRight: {
    flex: 1,
    gap: 16,
  },
  artworkSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkGlow: {
    position: 'absolute',
    backgroundColor: colors.secondaryContainer,
    opacity: 0.18,
  },
  artworkPanel: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  artworkCaption: {
    padding: 20,
  },
  artworkTitle: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
  },
  artworkSubtitle: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  transcriptionBlock: {
    flex: 1,
    gap: 16,
  },
  transHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  langBadgeText: {
    ...fonts.labelSm,
    color: colors.onSecondaryContainer,
  },
  autoSync: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoSyncText: {
    ...fonts.labelSm,
    color: colors.onSurfaceVariant,
  },
  stateCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  stateTitle: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
    textAlign: 'center',
  },
  stateHint: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    ...fonts.labelSm,
    color: colors.onSecondaryContainer,
  },
  controlsBar: {
    borderRadius: radius.xl,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeLabel: {
    ...fonts.labelSm,
    color: colors.onSurfaceVariant,
    width: 44,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 72,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
