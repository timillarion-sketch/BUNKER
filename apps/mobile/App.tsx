import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { initOfflineQueue } from './src/services/OfflineQueueService';
import { OfflineBanner } from './src/components/OfflineBanner';

export default function App() {
  useEffect(() => {
    const unsubscribe = initOfflineQueue();
    return () => unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <OfflineBanner />
      <AppNavigator />
    </>
  );
}
