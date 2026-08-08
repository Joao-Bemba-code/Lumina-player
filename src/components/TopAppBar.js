import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from './IconButton';
import { colors, fonts } from '../theme';

export default function TopAppBar({ title = 'Lumina Player', onTranslate, onSearch }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={40}
        tint="dark"
        style={[styles.bar, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.row}>
          <IconButton
            icon="translate"
            color={colors.primary}
            onPress={onTranslate}
            accessibilityLabel="Translate"
          />
          <Text style={styles.title}>{title}</Text>
          <IconButton
            icon="magnify"
            color={colors.onSurfaceVariant}
            onPress={onSearch}
            accessibilityLabel="Search"
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bar: {
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218, 226, 253, 0.1)',
    overflow: 'hidden',
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...fonts.headlineMdMobile,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    letterSpacing: -0.5,
  },
});
