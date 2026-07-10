import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';
import { useAccent } from '../core/AccentContext';
import { storage, formatBnkrId, getUserId } from '@/core';
import {
  ensureBnkrId,
  sendP2pMessage,
  fetchP2pHistory,
  onP2pMessage,
  type P2pServerMessage,
} from '../services/p2pService';

interface P2PMessage {
  id: number | string;
  senderId: string;
  text: string;
  createdAt: number;
  status: 'sending' | 'sent' | 'error';
  isOptimistic: boolean;
}

export default function UserChatScreen({
  route, navigation
}: any) {
  const { peerId, roomId, mode } = route.params as {
    peerId: string;
    roomId: string;
    mode?: 'hidden' | 'incognito';
  };
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const isIncognito = mode === 'incognito';

  useEffect(() => {
    (async () => {
      try {
        const id = await ensureBnkrId();
        setMyId(id);
      } catch {
        const uuid = await getUserId(storage);
        setMyId(formatBnkrId(uuid));
      }

      try {
        const history = await fetchP2pHistory(peerId);
        setMessages(
          history.map((m: P2pServerMessage) => ({
            id: m.id,
            senderId: m.senderId,
            text: m.content,
            createdAt: new Date(m.createdAt).getTime(),
            status: m.status === "sent" ? "sent" as const : "sent" as const,
            isOptimistic: false,
          })),
        );
      } catch {
        // History fetch failed — start empty
      }
    })();

    navigation.setOptions({
      title: peerId,
      headerStyle: { backgroundColor: '#0a0a0f' },
      headerTintColor: accent,
    });
  }, [peerId]);

  // Incognito auto-delete: remove messages older than 10 minutes
  useEffect(() => {
    if (!isIncognito) return;

    const interval = setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000;
      setMessages(prev => {
        const filtered = prev.filter(m => m.createdAt > cutoff);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isIncognito]);

  useEffect(() => {
    if (!peerId) return;
    const unsub = onP2pMessage((data) => {
      if (!data) return;
      try {
        const msg = JSON.parse(data) as P2pServerMessage;
        if (msg.senderId !== peerId && msg.receiverId !== peerId) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return prev.concat({
            id: msg.id,
            senderId: msg.senderId,
            text: msg.content,
            createdAt: new Date(msg.createdAt).getTime(),
            status: "sent" as const,
            isOptimistic: false,
          });
        });
      } catch {
        // ignore parse errors
      }
    });
    return unsub;
  }, [peerId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !myId) return;

    const optimistic: P2PMessage = {
      id: `opt_${Date.now()}`,
      senderId: myId,
      text,
      createdAt: Date.now(),
      status: 'sending',
      isOptimistic: true,
    };

    setMessages(prev => prev.concat(optimistic));
    setInput('');
    setSending(true);
    listRef.current?.scrollToEnd({ animated: true });

    try {
      const serverMsg = await sendP2pMessage(peerId, text);
      setMessages(prev =>
        prev.map(m =>
          m.id === optimistic.id
            ? {
                id: serverMsg.id,
                senderId: serverMsg.senderId,
                text: serverMsg.content,
                createdAt: new Date(serverMsg.createdAt).getTime(),
                status: 'sent' as const,
                isOptimistic: false,
              }
            : m,
        ),
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimistic.id ? { ...m, status: 'error' as const } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }, [input, myId, sending, peerId]);

  const renderMessage = ({ item }: { item: P2PMessage }) => {
    const isMe = item.senderId === myId;
    const statusIcon =
      item.status === 'sending' ? ' ·' :
      item.status === 'sent' ? ' ✓' :
      ' ✗';
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleMe, { backgroundColor: accent + '22', borderColor: accent }]
            : styles.bubbleThem
        ]}>
          <Text style={[styles.msgText, isMe && { color: '#e0e0ff' }]}>
            {item.text}
          </Text>
          <Text style={styles.msgMeta}>
            {new Date(item.createdAt).toLocaleTimeString('ru', {
              hour: '2-digit', minute: '2-digit'
            })}
            {isMe && statusIcon}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + insets.bottom + 8 : 0}
    >
      <View style={[styles.peerHeader, { borderBottomColor: accent + '33' }]}>
        <View style={[styles.peerBadge, { borderColor: accent }]}>
          <Text style={[styles.peerLabel, { color: accent }]}>
            {isIncognito ? '💀 ИНКОГНИТО' : '🔒 СКРЫТЫЙ'}
          </Text>
          <Text style={styles.peerId}>{peerId}</Text>
        </View>
        <View style={styles.e2eTag}>
          <Text style={styles.e2eText}>🔒 E2E</Text>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: accent }]}>⬡</Text>
          <Text style={styles.emptyTitle}>Канал установлен</Text>
          <Text style={styles.emptySubtitle}>
            {isIncognito
              ? 'Сообщения удаляются через 10 минут'
              : 'Сообщения видны только участникам'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />
      )}

      <View style={[styles.inputRow, { borderTopColor: accent + '33', paddingBottom: Platform.OS === 'android' ? TAB_BAR_HEIGHT + insets.bottom : Math.max(insets.bottom, 16) }]}> 
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Сообщение..."
          placeholderTextColor="#404060"
          multiline
          maxLength={2000}
          style={styles.input}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || sending}
          style={[styles.sendBtn, { backgroundColor: input.trim() && !sending ? accent : '#1e1e2e' }]}
        >
          <Text style={[styles.sendIcon, { color: input.trim() && !sending ? '#000' : '#404060' }]}>
            ➤
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  peerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  peerBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  peerLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  peerId: { color: '#e0e0ff', fontSize: 13, fontFamily: 'monospace', fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  e2eTag: { backgroundColor: '#0a2a1a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  e2eText: { color: '#00ff88', fontSize: 11, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#e0e0ff', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#404060', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  msgList: { padding: 16, gap: 8 },
  msgRow: { marginVertical: 3 },
  msgRowMe: { alignItems: 'flex-end' },
  msgRowThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  bubbleMe: { borderRadius: 14 },
  bubbleThem: { backgroundColor: 'rgba(25,25,27,0.65)', borderColor: 'rgba(255,255,255,0.08)' },
  msgText: { color: '#c0c0e0', fontSize: 15, lineHeight: 21 },
  msgMeta: { color: '#404060', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 10,
    backgroundColor: 'rgba(25,25,27,0.65)',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(10,10,15,0.4)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: '#e0e0ff', fontSize: 15, maxHeight: 120, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 18, marginLeft: 2 },
});
