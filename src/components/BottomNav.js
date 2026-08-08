import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

const TABS = [
  { name: 'Home', icon: 'home', iconActive: 'home' },
  { name: 'Media', icon: 'play-circle-outline', iconActive: 'play-circle' },
  { name: 'Settings', icon: 'cog-outline', iconActive: 'cog' },
];

function TabItem({ label, icon, iconActive, focused, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        focused && styles.tabActive,
        { transform: [{ scale: pressed ? 0.93 : 1 }] },
      ]}
    >
      <MaterialCommunityIcons
        name={focused ? iconActive : icon}
        size={24}
        color={focused ? colors.onSecondaryContainer : colors.onSurfaceVariant}
        style={{ marginBottom: 2 }}
      />
      <Text
        style={[
          styles.label,
          { color: focused ? colors.onSecondaryContainer : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function BottomNav({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const navigate = (name) => {
    const route = state.routes.find((r) => r.name === name);
    if (route) {
      navigation.navigate(name);
    }
  };

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={60}
        tint="dark"
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      >
        {TABS.map((tab) => {
          const focused = state.index === state.routes.findIndex((r) => r.name === tab.name);
          return (
            <TabItem
              key={tab.name}
              label={tab.name}
              icon={tab.icon}
              iconActive={tab.iconActive}
              focused={focused}
              onPress={() => navigate(tab.name)}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(218, 226, 253, 0.05)',
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 72,
  },
  tabActive: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: -2,
  },
  label: {
    ...fonts.labelSm,
  },
});
