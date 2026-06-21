import { NitroXrayCore } from 'react-native-nitro-xray-core';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

export interface VpnConfig {
  name: string;
  configJson: string;
}

export class VpnService {
  private static instance: VpnService;
  private _connected = false;
  private _trafficUp = 0;
  private _trafficDown = 0;
  private _trafficInterval: ReturnType<typeof setInterval> | null = null;
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 5;
  private _appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  static getInstance(): VpnService {
    if (!VpnService.instance) {
      VpnService.instance = new VpnService();
    }
    return VpnService.instance;
  }

  async connect(config: VpnConfig): Promise<void> {
    const hasPerm = await NitroXrayCore.hasVpnPermission();
    if (!hasPerm) {
      await NitroXrayCore.requestVpnPermission();
    }
    await SecureStore.setItemAsync('vpn_config', JSON.stringify(config));
    await NitroXrayCore.startXray(config.configJson);
    this._connected = true;
    this._reconnectAttempts = 0;
    this._startTrafficPolling();
    this._monitorAppState();
  }

  async disconnect(): Promise<void> {
    await NitroXrayCore.stopXray();
    this._connected = false;
    this._stopTrafficPolling();
    this._stopAppStateMonitor();
  }

  async reconnect(): Promise<void> {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this._connected = false;
      return;
    }
    this._reconnectAttempts++;
    try {
      const saved = await this.loadSavedConfig();
      if (saved) {
        await NitroXrayCore.startXray(saved.configJson);
        this._connected = true;
        this._reconnectAttempts = 0;
      }
    } catch {}
  }

  async getStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    try {
      if (NitroXrayCore.isVpnConnected()) return 'connected';
      return this._connected ? 'connecting' : 'disconnected';
    } catch {
      return 'disconnected';
    }
  }

  async isConnected(): Promise<boolean> {
    const status = await this.getStatus();
    return status === 'connected';
  }

  async getProxyPort(): Promise<number> {
    try {
      // @ts-ignore
      return await NitroXrayCore.getProxyPort();
    } catch {
      return 10808;
    }
  }

  async getTrafficStats(): Promise<{ up: number; down: number }> {
    return { up: this._trafficUp, down: this._trafficDown };
  }

  private _startTrafficPolling(): void {
    this._stopTrafficPolling();
    this._trafficInterval = setInterval(async () => {
      try {
        // @ts-ignore
        const stats = await NitroXrayCore.getTrafficStats();
        this._trafficUp = stats.up ?? this._trafficUp;
        this._trafficDown = stats.down ?? this._trafficDown;
      } catch {}
    }, 5000);
  }

  private _stopTrafficPolling(): void {
    if (this._trafficInterval) {
      clearInterval(this._trafficInterval);
      this._trafficInterval = null;
    }
  }

  private _monitorAppState(): void {
    this._stopAppStateMonitor();
    this._appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && this._connected) {
        this.reconnect();
      }
    });
  }

  private _stopAppStateMonitor(): void {
    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
      this._appStateSubscription = null;
    }
  }

  async loadSavedConfig(): Promise<VpnConfig | null> {
    try {
      const saved = await SecureStore.getItemAsync('vpn_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }
}
