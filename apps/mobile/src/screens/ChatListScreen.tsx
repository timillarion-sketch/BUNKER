import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { theme as baseTheme } from '../theme';
import { api, getUserId, storage } from '@/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SecretPinScreen from './SecretPinScreen';

type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; title: string };
  UserChat: { peerId: string; peerName?: string; roomId: string };
  SecretArchive: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;
};

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  emoji: string;
  color: string;
  roomId: string;
  lastMessage?: string;
  updatedAt: number;
}

export default function ChatListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, accent },
  };
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactName, setContactName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [searching, setSearching] = useState(false);
  const [secretPinVisible, setSecretPinVisible] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<ChatRoom[]>('/chats');
      setChats(data);
    } catch {}
  }, []);

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    AsyncStorage.getItem('p2p_contacts').then(data => {
      if (data) setContacts(JSON.parse(data));
    });
  }, []);

  const saveContact = async (contact: Contact) => {
    const updated = [contact, ...contacts.filter(c => c.id !== contact.id)];
    setContacts(updated);
    await AsyncStorage.setItem('p2p_contacts', JSON.stringify(updated));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const handleInitChat = async () => {
    const trimmed = targetId.trim().toUpperCase();

    if (!trimmed) {
      Alert.alert('Ошибка', 'Введите ID собеседника');
      return;
    }

    const myId = await getUserId(storage);

    const myFormatted = myId
      ? `BNKR-${myId.slice(0,4).toUpperCase()}-${myId.slice(4,8).toUpperCase()}`
      : '';

    if (trimmed === myFormatted) {
      Alert.alert('Ошибка', 'Нельзя начать чат с собой');
      return;
    }

    const roomId = `dm_${Date.now()}`;
    const newContact: Contact = {
      id: trimmed,
      name: contactName.trim() || trimmed,
      emoji: '💬',
      color: '#00F0FF',
      roomId,
      updatedAt: Date.now(),
    };
    await saveContact(newContact);
    setModalVisible(false);
    setTargetId('');
    setContactName('');

    navigation.navigate('UserChat', {
      peerId: trimmed,
      peerName: newContact.name,
      roomId,
    });
  };

  const renderChat = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderColor: 'rgba(255,255,255,0.08)' }]}
      onPress={() => navigation.navigate('Chat', { chatId: item.id, title: item.name })}
    >
      <View style={[styles.chatDot, { borderColor: theme.colors.accent }]} />
      <View style={styles.chatContent}>
        <Text style={[styles.chatName, { color: theme.colors.text }]}>{item.name}</Text>
        {item.lastMessage && (
          <Text style={[styles.chatPreview, { color: theme.colors.textMuted }]} numberOfLines={1}>{item.lastMessage}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
      }}>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => setSecretPinVisible(true)}
          delayLongPress={1000}
        >
          <Text style={{
            fontSize: 28,
            fontWeight: '600',
            color: '#e0e0ff',
            letterSpacing: 0.5,
          }}>
            СООБЩЕНИЯ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            color: accent,
            fontSize: 22,
            lineHeight: 26,
            fontWeight: '300',
          }}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>e2e шифрование • протокол Signal</Text>

      {contacts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: accent }]}>⬡</Text>
          <Text style={styles.emptyText}>Нет диалогов</Text>
          <Text style={styles.emptyHint}>Нажми + чтобы найти оперативника</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('UserChat', {
                peerId: item.id,
                peerName: item.name,
                roomId: item.roomId,
              })}
              onLongPress={() => {}}
              style={[styles.contactRow, { borderLeftColor: item.color, borderLeftWidth: 3 }]}
            >
              <Text style={styles.contactEmoji}>{item.emoji}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactId}>{item.id}</Text>
                {item.lastMessage && (
                  <Text style={styles.contactLast} numberOfLines={1}>{item.lastMessage}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalSheet]}
            onPress={() => {}}
          >
            <View style={styles.handlebar} />
            <Text style={{
              color: accent,
              fontSize: 11,
              letterSpacing: 3,
              fontWeight: '600',
              marginBottom: 4,
            }}>
              ЗАЩИЩЁННЫЙ КАНАЛ
            </Text>
            <Text style={{
              color: '#e0e0ff',
              fontSize: 20,
              fontWeight: '600',
              letterSpacing: 0.5,
              marginBottom: 20,
            }}>
              Найти оперативника
            </Text>

            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Имя контакта (необязательно)"
              placeholderTextColor="#404060"
              style={styles.idInput}
            />

            <TextInput
              value={targetId}
              onChangeText={t =>
                setTargetId(t.toUpperCase())
              }
              placeholder="BNKR-XXXX-XXXX"
              placeholderTextColor="#404060"
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.idInput, styles.idInputCode]}
            />

            <TouchableOpacity
              onPress={handleInitChat}
              disabled={searching}
              style={[styles.confirmBtn, { backgroundColor: accent }]}
            >
              <Text style={styles.confirmBtnText}>
                {searching
                  ? 'ПОИСК...'
                  : 'ИНИЦИИРОВАТЬ КАНАЛ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setTargetId('');
              }}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#404060', fontSize: 13 }}>
                ОТМЕНА
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={secretPinVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSecretPinVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
        }}>
          <SecretPinScreen
            onSuccess={() => {
              setSecretPinVisible(false);
              navigation.navigate('SecretArchive');
            }}
            onCancel={() => setSecretPinVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
    paddingTop: 60,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 16,
    marginTop: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  chatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 3,
  },
  chatPreview: {
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#404060',
    fontSize: 13,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  contactEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  contactId: {
    color: '#404060',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  contactLast: {
    color: '#606080',
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
  modalSheet: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  idInput: {
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e0e0ff',
    fontSize: 14,
    marginBottom: 10,
  },
  idInputCode: {
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  confirmBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
