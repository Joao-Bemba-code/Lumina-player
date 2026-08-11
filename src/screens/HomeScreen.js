import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '../components/TopAppBar';
import TrackRow from '../components/TrackRow';
import { useApp } from '../context/AppContext';
import { loadDeviceTracks } from '../services/deviceMusic';
import { colors, fonts, spacing, radius } from '../theme';

const BREAKPOINT = 768;

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const padding = isWide ? spacing.paddingDesktop : spacing.paddingMobile;
  const { tracks, addTrack, addDeviceTracks, removeTrack, settings } = useApp();
  const [picking, setPicking] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const openPlayer = (track) => navigation.navigate('Player', { itemId: track.id });

  const handleSync = async () => {
    try {
      setSyncing(true);
      const deviceTracks = await loadDeviceTracks();
      if (!deviceTracks.length) {
        Alert.alert('Nenhuma música', 'Nenhuma música encontrada no aparelho.');
        return;
      }
      const added = addDeviceTracks(deviceTracks);
      Alert.alert(
        'Sincronizado',
        added > 0
          ? `${added} músicas do aparelho adicionadas à biblioteca.`
          : 'Sua biblioteca já está em dia com as músicas do aparelho.'
      );
    } catch (e) {
      Alert.alert('Erro ao sincronizar', e.message || 'Não foi possível ler as músicas do aparelho.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    try {
      setPicking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.length) {
        await addTrack(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Erro ao importar', e.message || 'Não foi possível importar o arquivo.');
    } finally {
      setPicking(false);
    }
  };

  const handleRemove = (track) =>
    Alert.alert('Remover', `Remover "${track.title}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeTrack(track.id) },
    ]);

  const emptyState = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="music-note-plus" size={48} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Sua biblioteca está vazia</Text>
      <Text style={styles.emptyHint}>
        Sincronize as músicas do aparelho ou adicione áudios. O app gera transcrição e legendas
        automáticas.
      </Text>
      <Pressable
        onPress={handleSync}
        disabled={syncing}
        style={({ pressed }) => [styles.addButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        {syncing ? (
          <ActivityIndicator color={colors.onSecondaryContainer} />
        ) : (
          <MaterialCommunityIcons name="cellphone" size={18} color={colors.onSecondaryContainer} />
        )}
        <Text style={styles.addButtonText}>
          {syncing ? 'Buscando músicas…' : 'Sincronizar músicas do aparelho'}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleAdd}
        disabled={picking}
        style={({ pressed }) => [styles.secondaryButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        {picking ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
        )}
        <Text style={styles.secondaryButtonText}>{picking ? 'Importando…' : 'Adicionar mídia'}</Text>
      </Pressable>
    </View>
  );

  const featured = tracks[0];

  return (
    <View style={styles.container}>
      <TopAppBar
        onTranslate={() =>
          Alert.alert('Tradução', 'Legendas e tradução automáticas nas Configurações.')
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: padding, paddingTop: 108, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tracks.length === 0 ? (
          emptyState()
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Recentes</Text>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={handleSync}
                  disabled={syncing}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { transform: [{ scale: pressed ? 0.93 : 1 }] },
                  ]}
                >
                  {syncing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <MaterialCommunityIcons name="cellphone" size={20} color={colors.primary} />
                  )}
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  disabled={picking}
                  style={({ pressed }) => [
                    styles.addButton,
                    { transform: [{ scale: pressed ? 0.93 : 1 }] },
                  ]}
                >
                  {picking ? (
                    <ActivityIndicator color={colors.onSecondaryContainer} size="small" />
                  ) : (
                    <MaterialCommunityIcons name="plus" size={18} color={colors.onSecondaryContainer} />
                  )}
                  <Text style={styles.addButtonText}>Adicionar</Text>
                </Pressable>
              </View>
            </View>

            {featured && (
              <Pressable
                onPress={() => openPlayer(featured)}
                style={({ pressed }) => [
                  styles.featured,
                  { transform: [{ scale: pressed ? 0.985 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[colors.secondaryContainer, colors.primaryContainer]}
                  style={StyleSheet.absoluteFill}
                />
                <MaterialCommunityIcons
                  name="music-note"
                  size={72}
                  color="rgba(218, 226, 253, 0.25)"
                  style={styles.featuredIcon}
                />
                <View style={styles.featuredContent}>
                  <View style={styles.featuredRow}>
                    <View style={styles.featuredTextWrap}>
                      <View style={styles.playingBadge}>
                        <Text style={styles.playingBadgeText}>Destaque</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={1}>
                        {featured.title}
                      </Text>
                      <Text style={styles.featuredSubtitle}>
                        {featured.transcription ? 'Legendas automáticas' : 'Toque para reproduzir'}
                      </Text>
                    </View>
                    <View style={styles.playButton}>
                      <MaterialCommunityIcons name="play" size={34} color={colors.onPrimary} />
                    </View>
                  </View>
                </View>
              </Pressable>
            )}

            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onPress={() => openPlayer(track)}
                onDelete={() => handleRemove(track)}
              />
            ))}

            {!settings.apiKey && tracks.length > 0 && (
              <View style={styles.apiHint}>
                <MaterialCommunityIcons name="key-outline" size={20} color={colors.primary} />
                <Text style={styles.apiHintText}>
                  Adicione sua chave gratuita nas Configurações para legendas automáticas.
                </Text>
                <Pressable onPress={() => navigation.navigate('Main', { screen: 'Settings' })}>
                  <Text style={styles.apiHintLink}>Configurar</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    gap: spacing.gutter,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heading: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    minHeight: 42,
    shadowColor: colors.secondaryContainer,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  addButtonText: {
    ...fonts.labelSm,
    color: colors.onSecondaryContainer,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(196, 193, 251, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    minHeight: 42,
  },
  secondaryButtonText: {
    ...fonts.labelSm,
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 14,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  emptyTitle: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptyHint: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
  },
  featured: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    justifyContent: 'flex-end',
  },
  featuredIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  featuredContent: {
    padding: 24,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  playingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  playingBadgeText: {
    ...fonts.labelSm,
    color: colors.onSecondaryContainer,
  },
  featuredTitle: {
    ...fonts.headlineMdMobile,
    color: colors.onSurface,
    marginBottom: 2,
  },
  featuredSubtitle: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    opacity: 0.85,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  apiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  apiHintText: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  apiHintLink: {
    ...fonts.labelSm,
    color: colors.primary,
  },
});
