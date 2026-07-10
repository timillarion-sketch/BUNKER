import React from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet,
} from 'react-native';
import {
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import type {
  BottomTabBarProps
} from '@react-navigation/bottom-tabs';

const TAB_CONFIG = [
  { name: 'Personal',  icon: '◈', label: 'Персонал' },
  { name: 'Browser',   icon: '◉', label: 'Браузер'  },
  { name: 'Messages',  icon: '◆', label: 'Сообще...' },
  { name: 'Content',   icon: '▣', label: 'Контент'  },
  { name: 'Profile',   icon: '◎', label: 'Профиль'  },
] as const;

export default function FloatingTabBar({
  state, navigation,
}: BottomTabBarProps) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.wrapper,
      { paddingBottom: insets.bottom + 8 }
    ]}>
      <View style={[styles.bar, { shadowColor: accent }]}>
        {state.routes.map((route, index) => {
          const tab = TAB_CONFIG[index];
          const focused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() =>
                navigation.navigate(route.name)
              }
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.icon,
                { color: focused ? accent : '#404060' }
              ]}>
                {tab?.icon ?? '○'}
              </Text>
              <Text style={[
                styles.label,
                { color: focused ? accent : '#404060' }
              ]}>
                {tab?.label ?? route.name}
              </Text>
              {focused && (
                <View style={[styles.dot, { backgroundColor: accent }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
    minHeight: 52,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
