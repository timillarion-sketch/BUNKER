import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '@/core/AccentContext';

export default function PromoIdeasScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.glowContainer}>
        <View style={[styles.glowCircle, { borderColor: accent }]} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: accent }]}>ПРОМО</Text>
        <Text style={styles.subtitle}>ИДЕИ</Text>
        <Text style={styles.description}>
          Скоро здесь будет контент
        </Text>

        <View style={styles.grid}>
          {[
            { icon: '💡', label: 'Идеи' },
            { icon: '🎬', label: 'Видео' },
            { icon: '📝', label: 'Посты' },
            { icon: '🎨', label: 'Дизайн' },
          ].map((item, i) => (
            <View key={i} style={styles.tile}>
              <Text style={styles.tileIcon}>{item.icon}</Text>
              <Text style={styles.tileLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.comingSoon}>Скоро здесь будет контент</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  glowContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 300,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  glowCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.15,
    borderRadius: 150,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#8888aa',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#666688',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  tile: {
    width: 140,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tileIcon: {
    fontSize: 32,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaaacc',
  },
  comingSoon: {
    marginTop: 40,
    fontSize: 14,
    color: '#444466',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});