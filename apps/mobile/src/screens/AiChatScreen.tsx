import { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';
import { useAccent } from '../core/AccentContext';
import { sendMessage } from '../services/AiCharacterService';
import { ChatStorageService } from '../services/ChatStorageService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const CHARACTER_GREETINGS: Record<string, string> = {
  psychologist:
    'Я слушаю. Расскажи, что тебя тревожит. Этот разговор останется между нами.',
  alt:
    'Оу, приветик! Не ожидала тут тебя увидеть. Ну что, погрузимся в глубины твоей души?',
  alfons:
    'Слушай сюда. В этом мире либо ты ешь, либо тебя едят. Садись, рассказывай, что стряслось.',
  producer:
    'Готов к продакшену? Садись, придумаем контент, который взорвёт ленту. Погнали.',
};

function getGreeting(characterId: string, characterName: string, systemPrompt?: string): string {
  if (systemPrompt) {
    const firstLine = systemPrompt.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 120) {
      return firstLine;
    }
    return `Чат с ${characterName} открыт. Чем могу помочь?`;
  }
  return CHARACTER_GREETINGS[characterId] || 'Чат открыт. Чем могу помочь?';
}

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'greeting';
  content: string;
  createdAt: number;
}

type PersonalStackParamList = {
  Lobby: undefined;
  AiChat: { characterId: string; characterName: string; characterAvatar: string; systemPrompt?: string };
};

type Props = NativeStackScreenProps<PersonalStackParamList, 'AiChat'>;

export default function AiChatScreen({ route, navigation }: Props) {
  const { characterId, characterName, characterAvatar, systemPrompt } = route.params;
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    const greeting = getGreeting(characterId, characterName, systemPrompt);
    const initial: AiChatMessage[] = [
      {
        id: 'greeting',
        role: 'greeting',
        content: greeting,
        createdAt: Date.now(),
      },
    ];

    ChatStorageService.getMessages(characterId).then(saved => {
      if (saved.length > 0) {
        const history: AiChatMessage[] = saved.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages([...initial, ...history]);
      } else {
        setMessages(initial);
      }
    });
  }, [characterId]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: 'rgba(25,25,27,0.65)' },
      headerTintColor: accent,
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>{characterAvatar}</Text>
          <Text style={{ color: '#e0e0ff', fontSize: 17, fontWeight: '600', letterSpacing: 0.5 }}>
            {characterName}
          </Text>
        </View>
      ),
    });
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setInputText('');
    setError(null);

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const history = messages
        .filter(m => m.role !== 'greeting')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const reply = await sendMessage(characterId, history, text, systemPrompt);

      const assistantMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      ChatStorageService.saveMessage({
        id: userMsg.id,
        characterId,
        role: 'user',
        content: userMsg.content,
        createdAt: userMsg.createdAt,
      });
      ChatStorageService.saveMessage({
        id: assistantMsg.id,
        characterId,
        role: 'assistant',
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt,
      });
    } catch {
      setError('Ошибка связи с сервером');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: AiChatMessage }) => {
    const isGreeting = item.role === 'greeting';
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.msgRow,
          isUser ? styles.msgRowUser : styles.msgRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: accent + '33' }]}>
            <Text style={styles.avatarText}>{characterAvatar}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: accent }]
              : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.msgText,
              isUser && styles.userMsgText,
              isGreeting && styles.greetingText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + insets.bottom + 8 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          sending ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={accent} />
              <Text style={[styles.typingText, { color: accent }]}>печатает...</Text>
            </View>
          ) : null
        }
      />

      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'android' ? TAB_BAR_HEIGHT + insets.bottom : Math.max(insets.bottom, 16) }]}> 
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Сообщение..."
          placeholderTextColor="#404060"
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: inputText.trim() && !sending ? accent : '#1e1e2e' },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Text style={[styles.sendBtnText, { color: inputText.trim() && !sending ? '#000' : '#404060' }]}>
            →
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '78%', padding: 14, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end' },
  assistantBubble: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  msgText: { color: '#e0e0ff', fontSize: 15, lineHeight: 21 },
  userMsgText: { color: '#000' },
  greetingText: { color: '#9090b0', fontStyle: 'italic', lineHeight: 22 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginLeft: 36 },
  typingText: { fontSize: 12, fontWeight: '500' },
  errorBar: {
    backgroundColor: '#ff3366',
    padding: 8,
    alignItems: 'center',
  },
  errorText: { color: '#fff', fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(25,25,27,0.65)',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(10,10,15,0.4)',
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#e0e0ff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 20, fontWeight: '600' },
});
