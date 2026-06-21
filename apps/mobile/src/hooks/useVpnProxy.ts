import { useState, useEffect, useCallback } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { VpnService } from '@/services/VpnService';

export interface ProxyConfig {
  isVpnActive: boolean;
  proxyHost: string;
  proxyPort: number;
}

const DEFAULT_PROXY_PORT = 10808;

export function useVpnProxy(): ProxyConfig {
  const [config, setConfig] = useState<ProxyConfig>({
    isVpnActive: false,
    proxyHost: '127.0.0.1',
    proxyPort: DEFAULT_PROXY_PORT,
  });

  const refreshVpnStatus = useCallback(async () => {
    try {
      const vpn = VpnService.getInstance();

      const [isActive, port] = await Promise.all([
        vpn.isConnected(),
        vpn.getProxyPort().catch(() => DEFAULT_PROXY_PORT),
      ]);

      setConfig(prev => {
        if (
          prev.isVpnActive === isActive &&
          prev.proxyPort === port
        ) return prev;

        return {
          isVpnActive: isActive,
          proxyHost: '127.0.0.1',
          proxyPort: port,
        };
      });
    } catch (err) {
      console.warn('[useVpnProxy] Status check failed:', err);
      setConfig(prev => {
        if (!prev.isVpnActive) return prev;
        return { ...prev, isVpnActive: false };
      });
    }
  }, []);

  useEffect(() => {
    refreshVpnStatus();

    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          refreshVpnStatus();
        }
      }
    );

    let vpnEventSub: { remove: () => void } | null = null;
    try {
      const emitter = new NativeEventEmitter(
        NativeModules.NitroXrayCore ??
        NativeModules.RNXrayCore ??
        NativeModules.VpnModule
      );

      vpnEventSub = emitter.addListener(
        'vpnStatusChanged',
        () => {
          refreshVpnStatus();
        }
      );
    } catch {
      console.log(
        '[useVpnProxy] Native VPN events unavailable, using AppState only'
      );
    }

    return () => {
      appStateSub.remove();
      vpnEventSub?.remove();
    };
  }, [refreshVpnStatus]);

  return config;
}
