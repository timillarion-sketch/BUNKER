import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { ensureBnkrId } from '../services/p2pService';

export type SecretChatMode =
  'hidden' | 'incognito';

export interface SecretContact {
  id: string;
  peerId: string;
  peerName: string;
  mode: SecretChatMode;
  roomId: string;
  lastMessage?: string;
  updatedAt: number;
}

const MODE_CONFIG = {
  hidden: {
    icon: '🔒',
    title: 'СКРЫТЫЙ ЧАТ',
    desc: 'Только на этом устройстве.\nНе виден в обычных диалогах.',
    color: '#00F0FF',
  },
  incognito: {
    icon: '💀',
    title: 'ИНКОГНИТО',
    desc: 'Скрытый чат + сообщения\nудаляются через 10 минут.',
    color: '#FF2D78',
  },
};

export default function SecretArchiveScreen({
  navigation,
}: any) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<SecretContact[]>([]);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showIdInput, setShowIdInput] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SecretChatMode | null>(null);
  const [peerId, setPeerId] = useState('');
  const [peerName, setPeerName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('secret_contacts').then(d => {
      if (d) setContacts(JSON.parse(d));
    });
  }, []);

  const openIdInput = (mode: SecretChatMode) => {
    setShowModeSelect(false);
    setSelectedMode(mode);
    setPeerId('');
    setPeerName('');
    setShowIdInput(true);
  };

  const handleCreateSecret = async () => {
    const trimmedId = peerId.trim().toUpperCase();
    if (!trimmedId) {
      Alert.alert('Ошибка', 'Введи BNKR-ID собеседника');
      return;
    }

    const myId = await ensureBnkrId().catch(() => '');

    if (trimmedId === myId) {
      Alert.alert('Ошибка', 'Нельзя начать чат с собой');
      return;
    }

    const roomId = `secret_${Date.now()}`;
    const newContact: SecretContact = {
      id: roomId,
      peerId: trimmedId,
      peerName: peerName.trim() || trimmedId,
      mode: selectedMode!,
      roomId,
      updatedAt: Date.now(),
    };

    const updated = [newContact, ...contacts.filter(c => c.id !== newContact.id)];
    setContacts(updated);
    await AsyncStorage.setItem('secret_contacts', JSON.stringify(updated));

    setShowIdInput(false);
    setPeerId('');
    setPeerName('');

    navigation.navigate('UserChat', {
      peerId: trimmedId,
      peerName: newContact.peerName,
      roomId,
      mode: selectedMode,
    });
  };

  const renderContact = ({ item }: { item: SecretContact }) => {
    const cfg = MODE_CONFIG[item.mode];
    return (
      <TouchableOpacity
        style={[
          styles.contactRow,
          { borderLeftColor: cfg.color, borderLeftWidth: 3 },
        ]}
        onPress={() =>
          navigation.navigate('UserChat', {
            peerId: item.peerId,
            peerName: item.peerName,
            roomId: item.roomId,
            mode: item.mode,
          })
        }
      >
        <Text style={styles.contactIcon}>{cfg.icon}</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.peerName}</Text>
          <Text style={[styles.contactMode, { color: cfg.color }]}>
            {cfg.title}
          </Text>
          {item.lastMessage && (
            <Text style={styles.contactLast} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: accent }]}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerSub, { color: accent }]}>
            ЗАСЕКРЕЧЕНО
          </Text>
          <Text style={styles.headerTitle}>
            СКРЫТЫЕ КАНАЛЫ
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModeSelect(true)}
          style={[styles.addBtn, { borderColor: accent }]}
        >
          <Text style={[styles.addBtnText, { color: accent }]}>+</Text>
        </TouchableOpacity>
      </View>

      {showModeSelect && (
        <View style={styles.modeSelect}>
          <Text style={styles.modeTitle}>ВЫБЕРИ РЕЖИМ</Text>
          {(Object.entries(MODE_CONFIG) as [SecretChatMode, typeof MODE_CONFIG.hidden][]).map(
            ([mode, cfg]) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeCard, { borderColor: 'rgba(255,255,255,0.08)' }]}
                onPress={() => openIdInput(mode)}
              >
                <View style={[styles.modeIconWrap, { backgroundColor: cfg.color + '18' }]}>
                  <Text style={styles.modeIcon}>{cfg.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modeCardTitle, { color: cfg.color }]}>
                    {cfg.title}
                  </Text>
                  <Text style={styles.modeCardDesc}>{cfg.desc}</Text>
                </View>
              </TouchableOpacity>
            ),
          )}
          <TouchableOpacity
            onPress={() => setShowModeSelect(false)}
            style={{ marginTop: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#404060' }}>ОТМЕНА</Text>
          </TouchableOpacity>
        </View>
      )}

      {contacts.length === 0 && !showModeSelect ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon, { color: accent }]}>🔐</Text>
          <Text style={styles.emptyTitle}>Нет скрытых каналов</Text>
          <Text style={styles.emptyHint}>Нажми + для создания</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={c => c.id}
          renderItem={renderContact}
        />
      )}

      <Modal
        visible={showIdInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIdInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handlebar} />
            <Text style={[styles.idModalTitle, { color: accent }]}>
              {selectedMode === 'incognito' ? '💀 ИНКОГНИТО' : '🔒 СКРЫТЫЙ ЧАТ'}
            </Text>
            <Text style={styles.idModalHint}>
              Введи BNKR-ID собеседника
            </Text>
            <TextInput
              value={peerName}
              onChangeText={setPeerName}
              placeholder="Имя контакта (необязательно)"
              placeholderTextColor="#404060"
              style={styles.idInput}
            />
            <TextInput
              value={peerId}
              onChangeText={t => setPeerId(t.toUpperCase())}
              placeholder="BNKR-XXXX-XXXX"
              placeholderTextColor="#404060"
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.idInput, styles.idInputCode]}
            />
            <View style={styles.idActions}>
              <TouchableOpacity
                onPress={handleCreateSecret}
                style={[styles.idConfirmBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.idConfirmText}>СОЗДАТЬ КАНАЛ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowIdInput(false)}
                style={styles.idCancelBtn}
              >
                <Text style={{ color: '#404060' }}>ОТМЕНА</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 24, paddingRight: 8 },
  headerSub: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#e0e0ff',
    fontSize: 20,
    fontWeight: '600',
  },
  addBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 22, lineHeight: 26,
    fontWeight: '300',
  },
  modeSelect: {
    margin: 16,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
  },
  modeTitle: {
    color: '#606080',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  modeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIcon: { fontSize: 22 },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modeCardDesc: {
    color: '#606080',
    fontSize: 12,
    lineHeight: 17,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  contactIcon: { fontSize: 28, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  contactMode: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 2,
  },
  contactLast: {
    color: '#606080',
    fontSize: 13,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#404060',
    fontSize: 13,
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
  idModalTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  idModalHint: {
    color: '#606080',
    fontSize: 12,
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
  idActions: {
    gap: 10,
    marginTop: 6,
  },
  idConfirmBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  idConfirmText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  idCancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
