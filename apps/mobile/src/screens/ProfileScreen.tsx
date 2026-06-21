import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../theme';
import { api, clearTokens } from '../core';

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    (async () => {
      const token = await api.getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username || '');
      }
      try {
        await api.get('/api/healthz');
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти', style: 'destructive', onPress: async () => {
          try {
            await api.post('/api/auth/logout');
          } catch {}
          await clearTokens();
          await SecureStore.deleteItemAsync('bunker_access_token');
          await SecureStore.deleteItemAsync('bunker_refresh_token');
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ПРОФИЛЬ</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Имя пользователя</Text>
        <Text style={styles.value}>{username || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Сервер</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, {
            backgroundColor: backendStatus === 'online' ? theme.colors.success : theme.colors.danger,
          }]} />
          <Text style={styles.value}>
            {backendStatus === 'online' ? 'Подключено' : backendStatus === 'offline' ? 'Отключено' : 'Проверка...'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>ВЫЙТИ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  header: {
    fontSize: 24, fontWeight: '700', color: theme.colors.text,
    marginBottom: 24, letterSpacing: 4,
  },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  label: { fontSize: 12, color: theme.colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  logoutBtn: {
    height: 50, backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md, justifyContent: 'center', alignItems: 'center',
    marginTop: 32,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
});
