import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Artwork({
  source,
  style,
  icon = 'music-note',
  overlay,
  opacity = 0.8,
  gradient,
}) {
  const hasImage = !!source;
  const gradientColors =
    gradient || [colors.primaryContainer, colors.surfaceContainerHigh];
  return (
    <View style={[styles.container, style]}>
      {hasImage ? (
        <Image
          source={{ uri: source }}
          style={[StyleSheet.absoluteFill, { opacity }]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      )}
      {!hasImage && (
        <MaterialCommunityIcons
          name={icon}
          size={44}
          color={colors.onSurfaceVariant}
          style={{ opacity: 0.5 }}
        />
      )}
      {overlay && (
        <LinearGradient colors={overlay} style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
});
