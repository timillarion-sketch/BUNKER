import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, ScrollView, Switch, LayoutAnimation, Platform, UIManager, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent, ACCENT_PRESETS, AccentKey } from '../core/AccentContext';
import { theme as baseTheme } from '../theme';
import ColorPickerModal from '../components/ColorPickerModal';
import { api, clearTokens, storage } from '../core';
import { ensureBnkrId } from '../services/p2pService';
import * as Clipboard from 'expo-clipboard';
import { VpnService } from '../services/VpnService';
import { parseProxyUri } from '../utils/configParser';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

const PALETTE_COLORS = [
  { name: 'Циан', value: '#00f0ff' },
  { name: 'Розовый', value: '#ff006e' },
  { name: 'Зелёный', value: '#00ff88' },
  { name: 'Оранж', value: '#ff6600' },
  { name: 'Пурпур', value: '#7c3aed' },
  { name: 'Жёлтый', value: '#ffdd00' },
];

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { accentKey, setAccentKey, accent, setCustomColor } = useAccent();
  const [pickerVisible, setPickerVisible] = useState(false);
  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, accent },
  };
  const [username, setUsername] = useState('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const [vpnStatus, setVpnStatus] = useState<ConnectionStatus>('disconnected');
  const [configUri, setConfigUri] = useState('');
  const [gatewayExpanded, setGatewayExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vpn = VpnService.getInstance();

  const [ghostMode, setGhostMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [screenshots, setScreenshots] = useState(false);
  const [userId, setUserId] = useState('');
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState('');
  const [editingNick, setEditingNick] = useState(false);
  const [savingNick, setSavingNick] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

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
    (async () => {
      const saved = await storage.get('current_username');
      if (saved) setUsername(saved);
      try {
        await api.get('/api/healthz');
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    })();
  }, []);

  useEffect(() => {
    vpn.loadSavedConfig().then((saved) => {
      if (saved) setConfigUri(saved.configJson);
    });
  }, [vpn]);

  useEffect(() => {
    if (vpnStatus === 'connecting') pulse();
    else stopPulse();

    if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    statusCheckRef.current = setInterval(async () => {
      const s = await vpn.getStatus();
      setVpnStatus(s);
    }, 3000);

    return () => {
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [vpnStatus, pulse, stopPulse, vpn]);

  useEffect(() => {
    ensureBnkrId().then(id => {
      setUserId(id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('user_nickname').then(n => {
      if (n) setNickname(n);
    });
  }, []);

  const handleCopyId = async () => {
    if (!userId) return;
    await Clipboard.setStringAsync(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    if (!configUri.trim()) {
      Alert.alert('Ошибка', 'Введите ключ безопасного шлюза');
      return;
    }
    setVpnStatus('connecting');
    try {
      let configJson = configUri.trim();
      if (configUri.startsWith('vless://') || configUri.startsWith('vmess://') || configUri.startsWith('ss://')) {
        configJson = parseProxyUri(configUri);
      }
      await vpn.connect({ name: 'Бункер VPN', configJson });
      setVpnStatus('connected');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка подключения';
      Alert.alert('Ошибка шлюза', msg);
      setVpnStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    await vpn.disconnect();
    setVpnStatus('disconnected');
  };

  const handleSaveConfig = async () => {
    await SecureStore.setItemAsync('vpn_config', JSON.stringify({ name: 'Бункер VPN', configJson: configUri }));
    Alert.alert('Сохранено', 'Ключ безопасного шлюза сохранён');
  };

  const handleSelfDestruct = () => {
    Alert.alert(
      'ПРОТОКОЛ НОЛЬ',
      'Запустить протокол самоуничтожения? Все локальные данные будут безвозвратно удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'АКТИВИРОВАТЬ',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/auth/logout');
            } catch {}
            await clearTokens();
            await SecureStore.deleteItemAsync('bunker_access_token');
            await SecureStore.deleteItemAsync('bunker_refresh_token');
            await SecureStore.deleteItemAsync('vpn_config');
            navigation.replace('Login');
          },
        },
      ],
    );
  };

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

  const vpnStatusColor = vpnStatus === 'connected' ? theme.colors.success
    : vpnStatus === 'connecting' ? accent
    : theme.colors.danger;

  const vpnStatusText = vpnStatus === 'connected' ? 'ПОДКЛЮЧЕНО'
    : vpnStatus === 'connecting' ? 'ПОДКЛЮЧЕНИЕ...'
    : 'ОТКЛЮЧЕНО';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={styles.scanlines} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.header, { color: accent, textShadowColor: accent }]}>ПРОФИЛЬ</Text>

        <View style={[styles.card, { borderColor: accent, backgroundColor: theme.colors.card }]}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Имя пользователя</Text>
          {editingNick ? (
            <View style={styles.nickEditRow}>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Придумай никнейм..."
                placeholderTextColor="#404060"
                autoFocus
                maxLength={24}
                style={styles.nickInput}
              />
              <TouchableOpacity
                onPress={async () => {
                  setSavingNick(true);
                  const name = nickname.trim();
                  await AsyncStorage.setItem('user_nickname', name);
                  try {
                    await api.request('/api/auth/me', {
                      method: 'PATCH',
                      body: JSON.stringify({ username: name }),
                    });
                  } catch {}
                  setSavingNick(false);
                  setEditingNick(false);
                }}
                style={[styles.nickSaveBtn, { borderColor: accent }]}
              >
                <Text style={{ color: accent }}>{savingNick ? '...' : '✓'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingNick(false)}
                style={styles.nickCancelBtn}
              >
                <Text style={{ color: '#606080' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setEditingNick(true)}
              style={styles.nickBlock}
            >
              <View style={styles.nickDisplayRow}>
                <Text style={styles.nickName}>{nickname || 'Нажми чтобы задать ник'}</Text>
                <Text style={styles.nickEdit}>✎</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, {
              backgroundColor: backendStatus === 'online' ? theme.colors.success : theme.colors.danger,
            }]} />
            <Text style={[styles.statusText, { color: theme.colors.textMuted }]}>
              {backendStatus === 'online' ? 'Сервер: онлайн' : backendStatus === 'offline' ? 'Сервер: офлайн' : 'Проверка...'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCopyId}
          style={{
            marginTop: 12,
            backgroundColor: 'rgba(0,240,255,0.08)',
            borderWidth: 1,
            borderColor: accent,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{
            color: accent,
            fontSize: 11,
            letterSpacing: 2,
            fontWeight: '700',
          }}>
            МОЙ ID
          </Text>
          <Text style={{
            color: '#e0e0ff',
            fontSize: 15,
            fontWeight: '600',
            fontFamily: 'monospace',
            flex: 1,
          }}>
            {userId || '...'}
          </Text>
          <Text style={{
            color: copied ? accent : '#606080',
            fontSize: 12,
          }}>
            {copied ? '✓ СКОПИРОВАН' : '⎘ КОПИРОВАТЬ'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>БЕЗОПАСНЫЙ ШЛЮЗ</Text>
        <View style={[styles.card, { borderColor: vpnStatusColor, backgroundColor: theme.colors.card }]}>
          <View style={styles.gatewayRow}>
            <View style={[styles.gatewayDot, { backgroundColor: vpnStatusColor }]} />
            <Text style={[styles.gatewayStatus, { color: vpnStatusColor }]}>{vpnStatusText}</Text>
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setGatewayExpanded(!gatewayExpanded);
              }}
              style={styles.gatewayExpandBtn}
            >
              <Text style={[styles.gatewayExpandIcon, { color: theme.colors.textMuted }]}>
                {gatewayExpanded ? '−' : '+'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.configInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={configUri}
            onChangeText={setConfigUri}
            placeholder="vless://... / vmess://... / ss://..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.gatewayButtons}>
            <TouchableOpacity
              style={[styles.gatewayBtn, vpnStatus === 'connected' ? styles.gatewayBtnDisconnect : { backgroundColor: accent }]}
              onPress={vpnStatus === 'connected' ? handleDisconnect : handleConnect}
            >
              <Text style={styles.gatewayBtnText}>
                {vpnStatus === 'connected' ? 'ОТКЛЮЧИТЬ' : 'ПОДКЛЮЧИТЬ'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gatewaySaveBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={handleSaveConfig}>
              <Text style={[styles.gatewaySaveText, { color: theme.colors.text }]}>СОХРАНИТЬ</Text>
            </TouchableOpacity>
          </View>
          {gatewayExpanded && (
            <View style={[styles.gatewayProtocols, { borderTopColor: theme.colors.border }]}>
              <View style={styles.protocolRow}>
                <View style={[styles.protocolDot, { backgroundColor: '#00ff88' }]} />
                <Text style={[styles.protocolLabel, { color: theme.colors.textMuted }]}>VLESS / Reality</Text>
                <Text style={styles.protocolStatus}>● активен</Text>
              </View>
              <View style={styles.protocolRow}>
                <View style={[styles.protocolDot, { backgroundColor: '#00aaff' }]} />
                <Text style={[styles.protocolLabel, { color: theme.colors.textMuted }]}>Shadowsocks</Text>
                <Text style={styles.protocolStatus}>○ ожидание</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>НАСТРОЙКИ</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Призрак-режим</Text>
            <Switch
              value={ghostMode}
              onValueChange={async (v) => {
                setGhostMode(v);
                try {
                  await api.patch('/api/auth/me', { ghostMode: v });
                } catch {}
              }}
              trackColor={{ false: theme.colors.border, true: accent }}
              thumbColor={ghostMode ? '#fff' : theme.colors.textMuted}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Уведомления</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: accent }}
              thumbColor={notifications ? '#fff' : theme.colors.textMuted}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Скриншоты</Text>
            <Switch
              value={screenshots}
              onValueChange={async (v) => {
                setScreenshots(v);
                await SecureStore.setItemAsync('screenshot_block', v ? 'true' : 'false');
                if (Platform.OS === 'android') {
                  try {
                    const { NativeModules } = require('react-native');
                    NativeModules.FlagSecure?.setSecure?.(v);
                  } catch {}
                }
              }}
              trackColor={{ false: theme.colors.border, true: accent }}
              thumbColor={screenshots ? '#fff' : theme.colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>АТМОСФЕРА ФОНА</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.paletteDesc, { color: theme.colors.textMuted }]}>Выберите цвет неонового акцента</Text>
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            style={[
              styles.colorPreviewBtn,
              { borderColor: accent,
                backgroundColor: accent + '15' }
            ]}
          >
            <View style={[
              styles.colorCircle,
              { backgroundColor: accent }
            ]} />
            <Text style={[
              styles.colorBtnText,
              { color: accent }
            ]}>
              {accent.toUpperCase()}
            </Text>
            <Text style={styles.colorBtnHint}>
              нажми для выбора
            </Text>
          </TouchableOpacity>

          <ColorPickerModal
            visible={pickerVisible}
            currentColor={accent}
            onSelect={setCustomColor}
            onClose={() => setPickerVisible(false)}
          />
        </View>

        <TouchableOpacity style={styles.selfDestructBtn} onPress={handleSelfDestruct}>
          <View style={styles.selfDestructGlow} />
          <Text style={styles.selfDestructText}>ПРОТОКОЛ НОЛЬ (САМОУНИЧТОЖЕНИЕ)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SurvivalMenu')}
          style={[styles.guideBtn, { borderColor: accent }]}
        >
          <Text style={styles.guideBtnIcon}>📖</Text>
          <Text style={[styles.guideBtnText, { color: accent }]}>СПРАВОЧНИК ВЫЖИВАЮЩЕГО</Text>
          <Text style={styles.guideBtnArrow}>→</Text>
        </TouchableOpacity>

        {username?.toLowerCase() === 'timgood' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminTemplates')}
            style={[styles.adminBtn, { borderColor: accent }]}
          >
            <Text style={styles.guideBtnIcon}>⚙️</Text>
            <Text style={[styles.guideBtnText, { color: accent }]}>УПРАВЛЕНИЕ ПРОМПТАМИ</Text>
            <Text style={styles.guideBtnArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Бункер v2.4 © 2026  |  О проекте  |  Конфиденциальность</Text>
        </View>

      </ScrollView>

      <TouchableOpacity
        onPress={() => setShowLogoutMenu(true)}
        style={[styles.menuBtn, { top: insets.top + 8 }]}
      >
        <Text style={[styles.menuDots, { color: theme.colors.textMuted }]}>•••</Text>
      </TouchableOpacity>

      <Modal
        visible={showLogoutMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutMenu(false)}
      >
        <TouchableOpacity
          style={styles.popoverOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutMenu(false)}
        >
          <View style={[styles.popover, { top: insets.top + 50, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={[styles.popoverLabel, { color: theme.colors.textMuted }]}>Авторизован как</Text>
            <Text style={[styles.popoverUser, { color: accent }]}>{username || '—'}</Text>
            <View style={[styles.popoverDivider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity
              style={styles.popoverLogoutBtn}
              onPress={() => {
                setShowLogoutMenu(false);
                handleLogout();
              }}
            >
              <Text style={styles.popoverLogoutText}>ВЫЙТИ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  scanlines: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    backgroundColor: '#00f0ff',
    pointerEvents: 'none',
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 10,
    marginTop: 20,
  },
  card: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  nickBlock: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nickDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nickName: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
  },
  nickEdit: {
    color: '#404060',
    fontSize: 18,
  },
  nickEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  nickInput: {
    flex: 1,
    color: '#e0e0ff',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    paddingVertical: 4,
  },
  nickSaveBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nickCancelBtn: {
    width: 32, height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  gatewayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gatewayStatus: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  configInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 80,
    marginBottom: 12,
  },
  gatewayButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  gatewayBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gatewayBtnDisconnect: {
    backgroundColor: '#ff3366',
  },
  gatewayBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  gatewaySaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  gatewaySaveText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gatewayExpandBtn: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayExpandIcon: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  gatewayProtocols: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  protocolDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  protocolLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  protocolStatus: {
    fontSize: 11,
    color: '#606080',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 2,
  },
  paletteDesc: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  palette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  colorCheck: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  colorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    width: 36,
    textAlign: 'center',
  },
  selfDestructBtn: {
    marginTop: 20,
    height: 56,
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderWidth: 1.5,
    borderColor: '#ff3366',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#ff3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  selfDestructGlow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.06,
    backgroundColor: '#ff3366',
  },
  selfDestructText: {
    color: '#ff3366',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  menuBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  menuDots: {
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: '700',
  },
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  popover: {
    position: 'absolute',
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  popoverLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  popoverUser: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  popoverDivider: {
    height: 1,
    marginBottom: 12,
  },
  popoverLogoutBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#ff3366',
    borderRadius: 12,
  },
  popoverLogoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  colorPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(25,25,27,0.65)',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
    flex: 1,
  },
  colorBtnHint: {
    color: '#404060',
    fontSize: 11,
  },
  guideBtn: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  guideBtnIcon: {
    fontSize: 22,
  },
  guideBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  guideBtnArrow: {
    color: '#404060',
    fontSize: 18,
    fontWeight: '300',
  },
  adminBtn: {
    marginTop: 10,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#404060',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    opacity: 0.3,
  },
});