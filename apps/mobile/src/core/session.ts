import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, storage } from './index';
import { resetBnkrIdCache } from '../services/p2pService';
import { ChatStorageService } from '../services/ChatStorageService';

export async function clearSession(): Promise<void> {
  resetBnkrIdCache();
  await api.clearTokens();
  await ChatStorageService.clearAll();
  await storage.remove('bunker_user_id');
  await AsyncStorage.removeItem('p2p_contacts');
  await AsyncStorage.removeItem('secret_contacts');
}
