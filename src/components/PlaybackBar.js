import React, { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';
import { colors, radius } from '../theme';

export default function PlaybackBar({
  progress = 0.45,
  onSeek,
  height = 6,
  showThumb = false,
}) {
  const [thumbVisible, setThumbVisible] = useState(false);
  const widthRef = useRef(0);
  const seekRef = useRef(onSeek);
  seekRef.current = onSeek;

  const handleSeek = (value) => {
    if (seekRef.current) seekRef.current(value);
  };

  const updateFromEventRef = useRef();
  updateFromEventRef.current = (evt) => {
    const width = widthRef.current;
    if (!width) return;
    const { locationX } = evt.nativeEvent;
    const value = Math.min(1, Math.max(0, locationX / width));
    handleSeek(value);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setThumbVisible(true);
        updateFromEventRef.current(evt);
      },
      onPanResponderMove: (evt) => {
        updateFromEventRef.current(evt);
      },
      onPanResponderRelease: () => setThumbVisible(false),
      onPanResponderTerminate: () => setThumbVisible(false),
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
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
