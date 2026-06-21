import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../theme';
import { VpnService, type VpnConfig } from '../services/VpnService';
import { parseProxyUri } from '../utils/configParser';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export default function VpnScreen() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [configUri, setConfigUri] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vpn = VpnService.getInstance();

  const pulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  useEffect(() => {
    vpn.loadSavedConfig().then((saved) => {
      if (saved) setConfigUri(saved.configJson);
    });
  }, []);

  useEffect(() => {
    if (status === 'connecting') pulse();
    else stopPulse();

    if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    statusCheckRef.current = setInterval(async () => {
      const s = await vpn.getStatus();
      setStatus(s);
    }, 3000);

    return () => {
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [status]);

  const handleConnect = async () => {
    if (!configUri.trim()) {
      Alert.alert('Ошибка', 'Вставьте конфиг прокси');
      return;
    }
    setStatus('connecting');
    try {
      let configJson = configUri.trim();
      if (configUri.startsWith('vless://') || configUri.startsWith('vmess://') || configUri.startsWith('ss://')) {
        configJson = parseProxyUri(configUri);
      }
      await vpn.connect({ name: 'Бункер VPN', configJson });
      setStatus('connected');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения';
      Alert.alert('Ошибка VPN', msg);
      setStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    await vpn.disconnect();
    setStatus('disconnected');
  };

  const handleSave = async () => {
    await SecureStore.setItemAsync('vpn_config', JSON.stringify({ name: 'Бункер VPN', configJson: configUri }));
    Alert.alert('Сохранено', 'Конфигурация сохранена');
  };

  const statusColor = status === 'connected' ? theme.colors.success
    : status === 'connecting' ? theme.colors.accent
    : theme.colors.danger;

  const statusText = status === 'connected' ? 'ПОДКЛЮЧЕНО'
    : status === 'connecting' ? 'ПОДКЛЮЧЕНИЕ...'
    : 'ОТКЛЮЧЕНО';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>VPN</Text>

      <TouchableOpacity
        style={styles.connectArea}
        onPress={status === 'connected' ? handleDisconnect : handleConnect}
      >
        <Animated.View
          style={[
            styles.glow,
            { borderColor: statusColor, opacity: status === 'connecting' ? pulseAnim : 1 },
          ]}
        >
          <View style={[styles.innerCircle, { backgroundColor: statusColor }]}>
            <Text style={styles.statusSymbol}>
              {status === 'connected' ? '✓' : status === 'connecting' ? '⋯' : '✕'}
            </Text>
          </View>
        </Animated.View>
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusText}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>КОНФИГУРАЦИЯ</Text>
      <TextInput
        style={styles.configInput}
        value={configUri}
        onChangeText={setConfigUri}
        placeholder="vless://... / vmess://... / ss://..."
        placeholderTextColor={theme.colors.textMuted}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.configButtons}>
        <TouchableOpacity style={styles.configBtn} onPress={handleSave}>
          <Text style={styles.configBtnText}>СОХРАНИТЬ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 140;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  header: {
    fontSize: 24, fontWeight: '700', color: theme.colors.text,
    marginBottom: 24, letterSpacing: 4,
  },
  connectArea: { alignItems: 'center', marginBottom: 32 },
  glow: {
    width: CIRCLE_SIZE + 16, height: CIRCLE_SIZE + 16, borderRadius: (CIRCLE_SIZE + 16) / 2,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  innerCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  statusSymbol: { fontSize: 48, color: '#000', fontWeight: '700' },
  statusLabel: { fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: theme.colors.textMuted,
    letterSpacing: 3, marginBottom: 12,
  },
  configInput: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 16, color: theme.colors.text, fontSize: 13,
    fontFamily: theme.fonts.mono, minHeight: 120, marginBottom: 16,
  },
  configButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  configBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: theme.colors.accent, borderRadius: theme.radius.sm,
  },
  configBtnText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
});
