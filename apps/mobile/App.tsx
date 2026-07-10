import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initOfflineQueue } from './src/services/OfflineQueueService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AccentProvider } from './src/core/AccentContext';
import { BunkerDataProvider } from './src/core/BunkerDataContext';
import { connectSse, disconnectSse, getSseConnection } from './src/services/p2pService';
import { api } from '@/core';

export default function App() {
  useEffect(() => {
    const unsubscribe = initOfflineQueue();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    api.getToken().then((token) => {
      if (token) connectSse();
    });

    const interval = setInterval(async () => {
      const token = await api.getToken();
      const sse = getSseConnection();
      if (token && !sse.connected) {
        sse.connect(token);
      } else if (!token && sse.connected) {
        sse.disconnect();
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
      disconnectSse();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AccentProvider>
        <BunkerDataProvider>
          <StatusBar style="light" />
          <OfflineBanner />
          <AppNavigator />
        </BunkerDataProvider>
      </AccentProvider>
    </SafeAreaProvider>
  );
}
