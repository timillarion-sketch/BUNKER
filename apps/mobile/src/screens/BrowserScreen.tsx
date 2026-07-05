import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Dimensions, Switch, Animated, RefreshControl, ScrollView } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewProgressEvent, WebViewErrorEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { theme as baseTheme } from '../theme';
import { useVpnProxy } from '../hooks/useVpnProxy';
import { checkDnsLeak } from '../utils/dnsLeakDetector';
import { WEBVIEW_INJECTED_JS, isUrlSafe, NEURAL_ANALYSIS_JS } from '../utils/webViewSecurity';

const { width } = Dimensions.get('window');

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
const INITIAL_URL = 'https://duckduckgo.com';

const COOKIE_CLEAR_JS = `
  (function() {
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
    });
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=' + location.hostname);
    });
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}
    window.ReactNativeWebView.postMessage('cookies_cleared');
  })();
`;

export default function BrowserScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const theme = { ...baseTheme, colors: { ...baseTheme.colors, accent } };
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState(INITIAL_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vpnProxy = useVpnProxy();
  const [currentIp, setCurrentIp] = useState<string>('');
  const [isCheckingIp, setIsCheckingIp] = useState(false);
  const [neuralEnabled, setNeuralEnabled] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setWebViewKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const onNavigationStateChange = (navState: any) => {
    const { url: newUrl, canGoBack: back, canGoForward: forward, loading } = navState;
    if (newUrl) setUrl(newUrl);
    setCanGoBack(back);
    setCanGoForward(forward);
    setIsLoading(loading);
    if (!loading) setError(null);
  };

  const onLoadProgress = (event: WebViewProgressEvent) => {
    setProgress(event.nativeEvent.progress);
  };

  const onLoadStart = () => { setIsLoading(true); setError(null); };
  const onLoadEnd = () => { setIsLoading(false); setProgress(1); };

  const onLoadError = (event: WebViewErrorEvent) => {
    setIsLoading(false);
    setError(event.nativeEvent.description || 'Ошибка загрузки');
  };

  const onMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === 'cookies_cleared') {
      showToast('Цифровой след очищен. Cookie удалены');
    }
  };

  const handleClearCookies = () => {
    webViewRef.current?.injectJavaScript(COOKIE_CLEAR_JS);
  };

  const handleNeuralToggle = (value: boolean) => {
    setNeuralEnabled(value);
    if (value && webViewRef.current) {
      webViewRef.current.injectJavaScript(NEURAL_ANALYSIS_JS);
    }
  };

  const goBack = () => webViewRef.current?.goBack();
  const goForward = () => webViewRef.current?.goForward();
  const reload = () => webViewRef.current?.reload();
  const stopLoading = () => webViewRef.current?.stopLoading();

  const onSubmitUrl = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setUrl(formattedUrl);
  };

  const handleCheckIp = async () => {
    setIsCheckingIp(true);
    const result = await checkDnsLeak();
    setCurrentIp(result.currentIp);
    setIsCheckingIp(false);
  };

  const injectedJs = neuralEnabled
    ? WEBVIEW_INJECTED_JS + '\n' + NEURAL_ANALYSIS_JS
    : WEBVIEW_INJECTED_JS;

  const webViewProps: Record<string, unknown> = {
    ref: webViewRef,
    source: { uri: url },
    userAgent: USER_AGENT,
    javaScriptEnabled: true,
    domStorageEnabled: false,
    sharedCookiesEnabled: false,
    thirdPartyCookiesEnabled: false,
    cacheEnabled: false,
    incognito: true,
    onNavigationStateChange,
    onLoadProgress,
    onLoadStart,
    onLoadEnd,
    onError: onLoadError,
    onMessage,
    style: styles.webView,
    injectedJavaScriptBeforeContentLoaded: injectedJs,
    onShouldStartLoadWithRequest: (request: { url: string }) => {
      if (!isUrlSafe(request.url)) {
        console.warn('[Browser] Blocked unsafe URL:', request.url);
        return false;
      }
      return true;
    },
    ...(vpnProxy.isVpnActive && Platform.OS === 'android'
      ? { proxyHost: vpnProxy.proxyHost, proxyPort: vpnProxy.proxyPort }
      : {}),
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={[styles.urlRow, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.urlBar, { color: theme.colors.text }]}
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={onSubmitUrl}
            placeholder="Поиск или URL"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>
        <TouchableOpacity style={styles.ipBtn} onPress={handleCheckIp} disabled={isCheckingIp}>
          <Text style={styles.ipBtnText}>
            {isCheckingIp ? '...' : currentIp ? `IP:${currentIp}` : 'IP'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.headerNavBtn} onPress={goBack}>
            <Text style={[styles.headerNavText, { color: accent }]}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerNavBtn} onPress={goForward}>
            <Text style={[styles.headerNavText, { color: accent }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerNavBtn} onPress={reload}>
            <Text style={[styles.headerNavText, { color: accent }]}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.controlBar, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={handleClearCookies} style={styles.controlBtn}>
          <Text style={[styles.controlBtnIcon, { color: accent }]}>🗑</Text>
          <Text style={[styles.controlBtnLabel, { color: accent }]}>ОЧИСТИТЬ</Text>
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <Text style={styles.neuralLabel}>НЕЙРО-АНАЛИЗ</Text>
        <Switch
          value={neuralEnabled}
          onValueChange={handleNeuralToggle}
          trackColor={{ false: '#1e1e2e', true: accent }}
          thumbColor={neuralEnabled ? '#fff' : '#606080'}
        />
      </View>

      {isLoading && progress < 1 && (
        <View style={[styles.progressBar, { backgroundColor: theme.colors.accent, width: width * progress }]} />
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent}
            progressBackgroundColor="#1e1e2e"
          />
        }
      >
        <WebView key={webViewKey} {...webViewProps} />
      </ScrollView>

      {error && (
        <View style={styles.errorOverlay}>
          <View style={[styles.errorCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={[styles.errorBtn, { backgroundColor: theme.colors.accent }]} onPress={reload}>
              <Text style={styles.errorBtnText}>Перезагрузить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Animated.View pointerEvents="none" style={[styles.toastWrap, { opacity: toastOpacity }]}>
        <View style={[styles.toast, { backgroundColor: accent }]}>
          <Text style={styles.toastIcon}>✓</Text>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    backgroundColor: 'rgba(25,25,27,0.65)',
  },
  urlRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingLeft: 12,
    height: 40,
    backgroundColor: 'rgba(10,10,15,0.4)',
  },
  urlBar: { flex: 1, fontSize: 14, paddingVertical: 0 },
  ipBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  ipBtnText: { color: '#505090', fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 10,
    backgroundColor: 'rgba(25,25,27,0.4)',
  },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  controlBtnIcon: { fontSize: 16 },
  controlBtnLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  controlDivider: { width: 1, height: 20, backgroundColor: '#1e1e2e' },
  neuralLabel: { color: '#606080', fontSize: 9, fontWeight: '700', letterSpacing: 1, flex: 1 },
  progressBar: { position: 'absolute', top: Platform.OS === 'ios' ? 140 : 108, left: 0, height: 2, zIndex: 10 },
  webView: { flex: 1 },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  headerNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerNavText: { fontSize: 20, fontWeight: '500' },
  errorOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20 },
  errorCard: { borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, maxWidth: 300 },
  errorText: { color: '#e0e0ff', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  errorBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  errorBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  toastWrap: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  toastIcon: { color: '#000', fontSize: 16, fontWeight: '800' },
  toastText: { color: '#000', fontSize: 13, fontWeight: '700' },
});
