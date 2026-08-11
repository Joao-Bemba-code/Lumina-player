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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '../components/TopAppBar';
import TrackRow from '../components/TrackRow';
import { useApp } from '../context/AppContext';
import { colors, fonts, spacing, radius } from '../theme';

const BREAKPOINT = 768;

export default function MediaScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const padding = isWide ? spacing.paddingDesktop : spacing.paddingMobile;
  const { tracks, addTrack, removeTrack } = useApp();
  const [picking, setPicking] = useState(false);

  const openPlayer = (track) => navigation.navigate('Player', { itemId: track.id });

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
      Alert.alert('Erro', 'Não foi possível importar o arquivo.');
    } finally {
      setPicking(false);
    }
  };

  const handleRemove = (track) =>
    Alert.alert('Remover', `Remover "${track.title}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeTrack(track.id) },
    ]);

  return (
    <View style={styles.container}>
      <TopAppBar
        onTranslate={() => Alert.alert('Tradução', 'Legendas e tradução automáticas nas Configurações.')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: padding, paddingTop: 108, paddingBottom: 120, gap: spacing.gutter },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Todas as mídias</Text>
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

        {tracks.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="playlist-music" size={44} color={colors.outline} />
            <Text style={styles.emptyText}>Nenhuma mídia na biblioteca.</Text>
          </View>
        ) : (
          tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              onPress={() => openPlayer(track)}
              onDelete={() => handleRemove(track)}
            />
          ))
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
  content: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  addButtonText: {
    ...fonts.labelSm,
    color: colors.onSecondaryContainer,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  emptyText: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
