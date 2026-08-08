import React, { useState } from 'react';
import { View, PanResponder } from 'react-native';
import { colors, radius } from '../theme';

export default function PlaybackBar({
  progress = 0.45,
  onSeek,
  height = 6,
  showThumb = false,
}) {
  const [thumbVisible, setThumbVisible] = useState(false);

  const updateFromEvent = (evt, width) => {
    if (!width) return;
    const { locationX, pageX } = evt.nativeEvent;
    const value = width > 0 ? Math.min(1, Math.max(0, locationX / width)) : progress;
    if (onSeek) onSeek(value);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setThumbVisible(true);
      updateFromEvent(evt, trackWidth);
    },
    onPanResponderMove: (evt) => {
      updateFromEvent(evt, trackWidth);
    },
    onPanResponderRelease: () => setThumbVisible(false),
    onPanResponderTerminate: () => setThumbVisible(false),
  });

  let trackWidth = 0;

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(e) => {
        trackWidth = e.nativeEvent.layout.width;
      }}
      style={{
        height: height + 10,
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          height,
          backgroundColor: colors.outlineVariant,
          borderRadius: radius.full,
          overflow: 'visible',
        }}
      >
        <View
          style={{
            height,
            width: `${Math.round(progress * 100)}%`,
            backgroundColor: colors.primary,
            borderRadius: radius.full,
          }}
        />
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: -3,
            left: `${Math.round(progress * 100)}%`,
            marginLeft: -6,
            opacity: showThumb || thumbVisible ? 1 : 0,
          }}
        />
      </View>
    </View>
  );
}
