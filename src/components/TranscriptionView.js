import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius } from '../theme';

function CaptionLine({ line, isActive }) {
  return (
    <View style={[styles.lineWrap, isActive && styles.lineActive]}>
      <View style={[styles.accent, !isActive && styles.accentHidden]} />
      <Text
        style={[
          styles.text,
          { color: isActive ? colors.onSurface : colors.onSurfaceVariant },
        ]}
      >
        {line.text}
      </Text>
      {line.translation ? (
        <Text
          style={[
            styles.translation,
            { color: isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant },
          ]}
        >
          {line.translation}
        </Text>
      ) : null}
    </View>
  );
}

function LiveCaption({ active }) {
  if (!active) return null;
  const hasTranslation = !!active.translation && active.translation !== active.text;

  return (
    <View style={styles.liveWrap} pointerEvents="none">
      <View style={styles.liveCard}>
        {hasTranslation ? (
          <>
            <Text style={styles.liveOriginal} numberOfLines={3}>
              {active.text}
            </Text>
            <Text style={styles.liveText} numberOfLines={3}>
              {active.translation}
            </Text>
          </>
        ) : (
          <Text style={styles.liveText} numberOfLines={3}>
            {active.text}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function TranscriptionView({ lines, activeIndex }) {
  const scrollRef = useRef(null);
  const positions = useRef({});
  const containerHeight = useRef(0);

  const active = activeIndex >= 0 ? lines[activeIndex] : null;

  useEffect(() => {
    if (!scrollRef.current) return;
    const pos = positions.current[active?.id];
    if (pos == null) return;
    const target = pos.y - containerHeight.current / 2 + pos.height / 2;
    scrollRef.current.scrollTo({ y: Math.max(0, target), animated: true });
  }, [activeIndex, active?.id]);

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => (containerHeight.current = e.nativeEvent.layout.height)}
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {lines.map((line) => {
          const isActive = line.id === activeIndex;
          return (
            <View
              key={line.id}
              onLayout={(e) => {
                positions.current[line.id] = e.nativeEvent.layout;
              }}
            >
              <CaptionLine line={line} isActive={isActive} />
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, 'transparent']}
        style={[styles.mask, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', colors.background]}
        style={[styles.mask, { bottom: 0 }]}
      />
      <LiveCaption active={active} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingVertical: '40%',
    gap: 20,
  },
  lineWrap: {
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
  },
  lineActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(196,193,251,0.18)',
  },
  accent: {
    position: 'absolute',
    left: 4,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  accentHidden: {
    opacity: 0.15,
  },
  text: {
    ...fonts.captionDisplay,
  },
  translation: {
    ...fonts.bodyMd,
    marginTop: 4,
  },
  mask: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 48,
  },
  liveWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 56,
    alignItems: 'center',
  },
  liveCard: {
    backgroundColor: 'rgba(13, 21, 42, 0.92)',
    borderColor: 'rgba(196,193,251,0.28)',
    borderWidth: 0.5,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: 560,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  liveOriginal: {
    ...fonts.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  liveText: {
    ...fonts.captionDisplay,
    fontSize: 20,
    lineHeight: 28,
    color: colors.onSurface,
  },
});
