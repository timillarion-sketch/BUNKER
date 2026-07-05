import { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Animated, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';
import { theme } from '../theme';
import { sendMessage } from '../services/AiCharacterService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

type ChatStackParamList = {
  ChatList: undefined;
  Chat: { characterId: string; characterName: string; characterAvatar: string };
};

type Props = NativeStackScreenProps<ChatStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { characterId, characterName } = route.params;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText('');
    setError(null);

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendMessage(characterId, history, text);
      const assistantMsg: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setError('Ошибка отправки сообщения');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Очистить историю',
      'Вы уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(1)).current;
    const dot2 = useRef(new Animated.Value(1)).current;
    const dot3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const anim = (dot: Animated.Value, delay: number) => {
        const seq = Animated.sequence([
          Animated.timing(dot, {
            toValue: 1.4, duration: 400, useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 1, duration: 400, useNativeDriver: true,
          }),
        ]);
        const loop = Animated.loop(seq);
        setTimeout(() => loop.start(), delay);
        return loop;
      };

      const loops = [anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)];
      return () => loops.forEach(l => l.stop());
    }, []);

    return (
      <View style={[styles.msgRow, styles.msgRowAssistant]}>
        <View style={[styles.avatar, { width: 24, height: 24, borderRadius: 12 }]}>
          <Text style={styles.avatarText}>?</Text>
        </View>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <View style={styles.typingRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[styles.typingDot, { transform: [{ scale: dot }] }]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: AiChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={[styles.avatar, { width: 24, height: 24, borderRadius: 12 }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.msgText, isUser && styles.userMsgText]}>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{characterName}</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.headerButton}>Очистить</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
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
          placeholderTextColor={theme.colors.textMuted}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (isTyping || !inputText.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isTyping || !inputText.trim()}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, letterSpacing: 0.5 },
  headerButton: { fontSize: 14, color: theme.colors.danger, fontWeight: '600' },
  msgList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAssistant: { justifyContent: 'flex-start' },
  avatar: {
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: { color: theme.colors.text, fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: theme.colors.accent, alignSelf: 'flex-end' },
  assistantBubble: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  msgText: { color: theme.colors.text, fontSize: 15, lineHeight: 20 },
  userMsgText: { color: '#fff' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },
  errorBar: {
    backgroundColor: theme.colors.danger,
    padding: 8, alignItems: 'center',
  },
  errorText: { color: theme.colors.text, fontSize: 13 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(25,25,27,0.65)',
  },
  input: {
    flex: 1, height: 44, backgroundColor: 'rgba(10,10,15,0.4)',
    borderRadius: 16, paddingHorizontal: 16,
    color: theme.colors.text, fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
