import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initOfflineQueue } from './src/services/OfflineQueueService';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AccentProvider } from './src/core/AccentContext';
import { BunkerDataProvider } from './src/core/BunkerDataContext';

export default function App() {
  useEffect(() => {
    const unsubscribe = initOfflineQueue();
    return () => unsubscribe();
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
