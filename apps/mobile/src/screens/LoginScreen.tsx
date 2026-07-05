import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { theme } from '../theme';
import { api, storage, ApiError } from '../core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

WebBrowser.maybeCompleteAuthSession();

const YANDEX_CLIENT_ID = '93f7e6c6b16c42c89c91ebb5923a6c32';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Введите имя пользователя и пароль');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>('/api/auth/login', { username, password });
      await api.setToken(res.accessToken);
      await api.setRefreshToken(res.refreshToken);
      try {
        const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
        if (payload.username) {
          await storage.set('current_username', payload.username);
        }
      } catch {}
      navigation.replace('MainTabs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения';
      if (e instanceof ApiError && e.status !== 0) {
        Alert.alert('Ошибка входа', msg);
      } else {
        Alert.alert('Ошибка сети', 'Не удалось подключиться к серверу. Проверьте соединение.', [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Повторить', onPress: handleLogin },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleYandexLogin = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bunker', path: 'oauth' });
      const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        return;
      }

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) {
        Alert.alert('Ошибка', 'Не удалось получить код авторизации');
        return;
      }

      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        '/api/auth/yandex/callback',
        { code, redirect_uri: redirectUri },
      );

      await api.setToken(res.accessToken);
      await api.setRefreshToken(res.refreshToken);
      try {
        const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
        if (payload.username) {
          await storage.set('current_username', payload.username);
        }
      } catch {}
      navigation.replace('MainTabs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка авторизации';
      Alert.alert('Ошибка', msg);
    }
  };

  const handleTelegramLogin = async () => {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bunker', path: 'auth/success' });
      const authUrl = `${api.baseUrl}/auth/telegram/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        return;
      }

      const url = new URL(result.url);
      const accessToken = url.searchParams.get('accessToken');
      const refreshToken = url.searchParams.get('refreshToken');

      if (!accessToken || !refreshToken) {
        Alert.alert('Ошибка', 'Не удалось получить токены');
        return;
      }

      await api.setToken(accessToken);
      await api.setRefreshToken(refreshToken);
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.username) {
          await storage.set('current_username', payload.username);
        }
      } catch {}
      navigation.replace('MainTabs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка авторизации';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>БУНКЕР</Text>
      <Text style={styles.subtitle}>ЗАЩИЩЁННЫЙ ВХОД</Text>
      <TextInput
        style={styles.input}
        placeholder="Имя пользователя"
        placeholderTextColor={theme.colors.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        placeholderTextColor={theme.colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'ВХОД...' : 'ВОЙТИ'}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ИЛИ</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.yandexButton} onPress={handleYandexLogin}>
        <Text style={styles.yandexButtonText}>Войти через Яндекс ID</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.telegramButton, loading && styles.buttonDisabled]}
        onPress={handleTelegramLogin}
        disabled={loading}
      >
        <Text style={styles.telegramButtonText}>Войти через Telegram</Text>
      </TouchableOpacity>

      <Text style={styles.version}>// AUTH v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 44,
    fontWeight: '600',
    color: theme.colors.accent,
    letterSpacing: 14,
    marginBottom: 4,
    textShadowColor: theme.colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    letterSpacing: 6,
    marginBottom: 48,
    fontFamily: theme.fonts.mono,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    color: theme.colors.text,
    fontSize: 15,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginHorizontal: 14,
    letterSpacing: 4,
  },
  yandexButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderWidth: 1,
    borderColor: theme.colors.accentPink,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  yandexButtonText: {
    color: theme.colors.accentPink,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
  },
  telegramButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderWidth: 1,
    borderColor: theme.colors.accentPurple,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  telegramButtonText: {
    color: theme.colors.accentPurple,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
  },
  version: {
    position: 'absolute',
    bottom: 32,
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: theme.fonts.mono,
    letterSpacing: 2,
    opacity: 0.3,
  },
});
