import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { theme } from '../theme';
import { api } from '../core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

WebBrowser.maybeCompleteAuthSession();

const YANDEX_CLIENT_ID = '93f7e6c6b16c42c89c91ebb5923a6c32';
const TELEGRAM_BOT_URL = 'https://t.me/BunkerUserBot';

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
      navigation.replace('MainTabs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения';
      Alert.alert('Ошибка входа', msg);
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
      navigation.replace('MainTabs');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка авторизации';
      Alert.alert('Ошибка', msg);
    }
  };

  const handleTelegramRegister = () => {
    Linking.openURL(TELEGRAM_BOT_URL);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scanlines} pointerEvents="none" />

      <Text style={styles.cornerTL}>╔</Text>
      <Text style={styles.cornerTR}>╗</Text>
      <Text style={styles.cornerBL}>╚</Text>
      <Text style={styles.cornerBR}>╝</Text>

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

      <TouchableOpacity style={styles.telegramButton} onPress={handleTelegramRegister}>
        <Text style={styles.telegramButtonText}>Регистрация через Telegram</Text>
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
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: '#00f0ff',
    pointerEvents: 'none',
  },

  cornerTL: {
    position: 'absolute',
    top: 48,
    left: 20,
    color: theme.colors.accent,
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    opacity: 0.4,
  },
  cornerTR: {
    position: 'absolute',
    top: 48,
    right: 20,
    color: theme.colors.accent,
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    opacity: 0.4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    color: theme.colors.accent,
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    opacity: 0.4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    color: theme.colors.accent,
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    opacity: 0.4,
  },

  title: {
    fontSize: 44,
    fontWeight: '800',
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
    backgroundColor: 'rgba(10,10,26,0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 18,
    marginBottom: 14,
    color: theme.colors.text,
    fontSize: 15,
    fontFamily: theme.fonts.mono,
  },

  button: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
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
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: theme.fonts.mono,
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
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginHorizontal: 14,
    letterSpacing: 4,
    fontFamily: theme.fonts.mono,
  },

  yandexButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255,0,110,0.12)',
    borderWidth: 1,
    borderColor: theme.colors.accentPink,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.accentPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  yandexButtonText: {
    color: theme.colors.accentPink,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: theme.fonts.mono,
  },

  telegramButton: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: theme.colors.accentPurple,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.accentPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  telegramButtonText: {
    color: theme.colors.accentPurple,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: theme.fonts.mono,
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
