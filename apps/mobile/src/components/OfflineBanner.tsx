import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { isNetworkOnline } from '../services/OfflineQueueService';
import NetInfo from '@react-native-community/netinfo';

export function OfflineBanner(): React.ReactElement | null {
  const [offline, setOffline] = useState(!isNetworkOnline());

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable));
    });
    return () => unsub();
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚡ Офлайн — запросы в очереди</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF6B35',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
