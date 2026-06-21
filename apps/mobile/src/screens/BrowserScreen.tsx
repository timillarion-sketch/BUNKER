import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, AppState, Dimensions, Alert } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import type { WebViewProgressEvent, WebViewErrorEvent, WebViewNavigationEvent, ShouldStartLoadRequestEvent } from 'react-native-webview/lib/WebViewTypes';
import { theme } from '@/theme';
import { useVpnProxy } from '@/hooks/useVpnProxy';
import { checkDnsLeak } from '@/utils/dnsLeakDetector';
import { WEBVIEW_INJECTED_JS, isUrlSafe } from '@/utils/webViewSecurity';

const { width } = Dimensions.get('window');

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
const INITIAL_URL = 'https://duckduckgo.com';

export default function BrowserScreen() {
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

  const onNavigationStateChange = (navState: WebViewNavigationEvent['nativeEvent']) => {
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

  const onLoadStart = (event: WebViewNavigationEvent) => {
    setIsLoading(true);
    setError(null);
  };

  const onLoadEnd = (event: WebViewNavigationEvent) => {
    setIsLoading(false);
    setProgress(1);
  };

  const onLoadError = (event: WebViewErrorEvent) => {
    setIsLoading(false);
    setError(event.nativeEvent.description || 'Ошибка загрузки');
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

  const handleVpnBadgePress = () => {
    Alert.alert('VPN', 'Переключитесь на вкладку VPN для управления');
  };

  const handleCheckIp = async () => {
    setIsCheckingIp(true);
    const result = await checkDnsLeak();
    setCurrentIp(result.currentIp);
    setIsCheckingIp(false);
  };

  const cleanupSession = () => {
    webViewRef.current?.clearCache(true);
    webViewRef.current?.clearHistory?.();
    setUrl(INITIAL_URL);
    console.log('[BrowserScreen] Session cleared');
  };

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

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
    style: styles.webView,
    injectedJavaScriptBeforeContentLoaded: WEBVIEW_INJECTED_JS,
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
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={goBack} disabled={!canGoBack}>
          <Text style={[styles.toolbarBtnText, !canGoBack && styles.toolbarBtnDisabled]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={goForward} disabled={!canGoForward}>
          <Text style={[styles.toolbarBtnText, !canGoForward && styles.toolbarBtnDisabled]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={isLoading ? stopLoading : reload}>
          <Text style={styles.toolbarBtnText}>{isLoading ? '✕' : '↻'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.urlBar}
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={onSubmitUrl}
          placeholder="Введите URL"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="url"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity style={styles.vpnBadge} onPress={handleVpnBadgePress}>
          <View
            style={[
              styles.vpnIndicator,
              vpnProxy.isVpnActive ? styles.vpnOn : styles.vpnOff,
            ]}
          />
          <Text style={styles.vpnBadgeText}>
            {vpnProxy.isVpnActive ? 'VPN: Включён' : 'VPN: Выключен'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCheckIp} disabled={isCheckingIp}>
          <Text style={styles.vpnBadgeText}>
            {isCheckingIp ? 'Проверка...' : 'Проверить IP'}
          </Text>
        </TouchableOpacity>
        {currentIp ? (
          <Text style={styles.vpnBadgeText}>IP: {currentIp}</Text>
        ) : null}
      </View>
      {progress < 1 && isLoading && (
        <View style={[styles.progressBar, { width: width * progress }]} />
      )}
      <WebView {...webViewProps} />
      {error && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorBtn} onPress={reload}>
              <Text style={styles.errorBtnText}>Перезагрузить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toolbarBtnText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  toolbarBtnDisabled: {
    opacity: 0.4,
  },
  urlBar: {
    flex: 1,
    height: 36,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    color: theme.colors.text,
    fontSize: 14,
  },
  vpnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vpnIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vpnOn: {
    backgroundColor: theme.colors.success,
  },
  vpnOff: {
    backgroundColor: theme.colors.textMuted,
  },
  vpnBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: theme.colors.accent,
    zIndex: 10,
  },
  webView: {
    flex: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  errorCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 300,
  },
  errorText: {
    color: theme.colors.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  errorBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
