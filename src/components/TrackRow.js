import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Artwork from './Artwork';
import IconButton from './IconButton';
import { trackGradient, formatDuration } from '../utils/art';
import { colors, fonts, radius } from '../theme';

export default function TrackRow({ track, onPress, onDelete, showSubtitle }) {
  const subtitle = showSubtitle
    ? `${formatDuration(track.duration)}${track.size ? ` • ${Math.round(track.size / 1024)} KB` : ''}`
    : track.transcription
    ? `${track.transcription.segments.length} legendas automáticas`
    : formatDuration(track.duration);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Artwork
        source={null}
        gradient={trackGradient(track.id)}
        icon="music-note"
        style={styles.thumb}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {onDelete && (
        <IconButton
          icon="trash-can-outline"
          size={22}
          color={colors.onSurfaceVariant}
          onPress={onDelete}
          accessibilityLabel="Remover"
        />
      )}
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  title: {
    ...fonts.bodyLg,
    fontFamily: 'Inter_600SemiBold',
    color: colors.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    ...fonts.labelSm,
    color: colors.onSurfaceVariant,
  },
});
