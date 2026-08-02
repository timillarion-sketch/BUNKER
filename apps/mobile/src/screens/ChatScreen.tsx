import { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, Image, ImageBackground, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Animated, Keyboard, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';
import { theme } from '../theme';
import { sendMessage } from '../services/AiCharacterService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ColorPickerModal from '../components/ColorPickerModal';
import ImageViewerModal from '../components/ImageViewerModal';
import { uploadAttachment, type AttachmentMeta } from '../services/uploadAttachment';
import { api } from '@/core';

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentMeta[];
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
  const sendingRef = useRef(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatBackgroundColor, setChatBackgroundColor] = useState('#000000');
  const [chatTextColor, setChatTextColor] = useState('#ffffff');
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [colorPickerMode, setColorPickerMode] = useState<'background' | 'text'>('background');
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ uri: string; type: string }[]>([]);
  const MAX_ATTACHMENTS = 10;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load chat background preference for AI character
    api.get<{ backgroundType: string; backgroundColor: string; textColor: string; backgroundImageUrl: string | null }>(`/api/chat-prefs/ai_character/${characterId}`)
      .then(res => {
        setBackgroundType(res.backgroundType === 'image' ? 'image' : 'color');
        setChatBackgroundColor(res.backgroundColor || '#000000');
        setChatTextColor(res.textColor || '#ffffff');
        setBackgroundImageUrl(res.backgroundImageUrl ?? null);
      })
      .catch(() => {
        setBackgroundType('color');
        setChatBackgroundColor('#000000');
        setChatTextColor('#ffffff');
        setBackgroundImageUrl(null);
      });
  }, [characterId]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [backgroundImageUrl]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && attachedFiles.length === 0) || sendingRef.current) return;
    sendingRef.current = true;
    setIsTyping(true);
    setInputText('');
    setError(null);

    let userAttachments: AttachmentMeta[] | undefined;
    try {
      if (attachedFiles.length > 0) {
        userAttachments = await Promise.all(attachedFiles.map(file => uploadAttachment(file)));
      }
    } catch (err) {
      sendingRef.current = false;
      setIsTyping(false);
      setError(err instanceof Error ? err.message : 'Не удалось загрузить вложения');
      return;
    }

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments: userAttachments,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setAttachedFiles([]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendMessage(characterId, history, text, userAttachments);
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
      sendingRef.current = false;
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

  const saveChatBackground = async (value: string, kind?: 'color' | 'image' | 'text') => {
    try {
      if (kind === 'text') {
        await api.put(`/api/chat-prefs/ai_character/${characterId}`, {
          textColor: value,
        });
        setChatTextColor(value);
      } else if (kind === 'image') {
        await api.put(`/api/chat-prefs/ai_character/${characterId}`, {
          backgroundType: 'image',
          backgroundImageUrl: value,
        });
        setBackgroundType('image');
        setBackgroundImageUrl(value);
      } else {
        await api.put(`/api/chat-prefs/ai_character/${characterId}`, {
          backgroundType: 'color',
          backgroundColor: value,
        });
        setBackgroundType('color');
        setChatBackgroundColor(value);
        setBackgroundImageUrl(null);
      }
      setIsColorPickerVisible(false);
    } catch (err) {
      console.error('BG SAVE ERROR:', err);
    }
  };

  const appendAttachments = (items: { uri: string; type: string }[]) => {
    setAttachedFiles(prev => {
      const merged = [...prev, ...items];
      return merged.slice(0, MAX_ATTACHMENTS);
    });
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Доступ запрещён", "Разрешите доступ к медиатеке в настройках.");
      return;
    }
    const remaining = MAX_ATTACHMENTS - attachedFiles.length;
    if (remaining <= 0) {
      Alert.alert("Лимит", `Можно прикрепить не более ${MAX_ATTACHMENTS} файлов.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    appendAttachments(result.assets.map(a => ({ uri: a.uri, type: a.mimeType ?? 'image/*' })));
  };

  const pickDocument = async () => {
    const remaining = MAX_ATTACHMENTS - attachedFiles.length;
    if (remaining <= 0) {
      Alert.alert("Лимит", `Можно прикрепить не более ${MAX_ATTACHMENTS} файлов.`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ['image/*', 'video/*', 'application/pdf', 'text/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    appendAttachments(result.assets.slice(0, remaining).map(a => ({
      uri: a.uri,
      type: a.mimeType ?? 'application/octet-stream',
    })));
  };

  const onAttachPress = () => {
    Alert.alert("Прикрепить", "Выберите тип вложения", [
      { text: "Отмена", style: "cancel" },
      { text: "Фото/Видео", onPress: () => { pickMedia(); } },
      { text: "Файл", onPress: () => { pickDocument(); } },
    ]);
  };

  const removeAttachment = (uri: string) => {
    setAttachedFiles(prev => prev.filter(f => f.uri !== uri));
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

  const openAttachment = (att: AttachmentMeta) => {
    if (att.type.startsWith('image/')) {
      setViewerUri(att.url);
      return;
    }
    Linking.openURL(att.url).catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть вложение');
    });
  };

  const renderMessage = ({ item }: { item: AiChatMessage }) => {
    const isUser = item.role === 'user';
    const hasContent = item.content || (item.attachments && item.attachments.length > 0);
    if (!hasContent) return null;
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={[styles.avatar, { width: 24, height: 24, borderRadius: 12 }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {item.content ? (
            <Text style={[styles.msgText, isUser ? styles.userMsgText : { color: chatTextColor }]}>
              {item.content}
            </Text>
          ) : null}
          {item.attachments && item.attachments.length > 0 ? (
            <View style={styles.attachmentsInMsg}>
              {item.attachments.map((att, idx) => {
                const isImage = att.type.startsWith('image/');
                return (
                  <TouchableOpacity
                    key={`${att.url}_${idx}`}
                    onPress={() => openAttachment(att)}
                    style={[styles.attachmentChip, isImage ? styles.attachmentChipImage : null]}
                  >
                    {isImage ? (
                      <Image source={{ uri: att.url }} style={styles.attachmentPreview} resizeMode="cover" />
                    ) : (
                      <View style={styles.attachmentFileRow}>
                        <Text style={styles.attachmentFileIcon}>📄</Text>
                        <Text style={[styles.attachmentFileName, isUser ? null : { color: chatTextColor }]} numberOfLines={2}>
                          {att.name || 'Файл'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const bgImageSource = useMemo(
    () => (backgroundImageUrl ? { uri: backgroundImageUrl } : null),
    [backgroundImageUrl],
  );
  const showImage = backgroundType === 'image' && bgImageSource !== null && !imageLoadFailed;

  return (
    <KeyboardAvoidingView
      style={[styles.container, showImage ? null : { backgroundColor: chatBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + insets.bottom + 8 : 0}
    >
      {showImage && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ImageBackground
            source={bgImageSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImageLoadFailed(true)}
          />
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{characterName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => { setColorPickerMode('background'); setIsColorPickerVisible(true); }}
            style={styles.colorPickerBtn}
          >
            <Text style={styles.colorPickerText}>🎨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setColorPickerMode('text'); setIsColorPickerVisible(true); }}
            style={styles.colorPickerBtn}
          >
            <Text style={styles.colorPickerText}>А</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.headerButton}>Очистить</Text>
          </TouchableOpacity>
        </View>
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
      {attachedFiles.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attachmentsRow}
          contentContainerStyle={styles.attachmentsContent}
        >
          {attachedFiles.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            return (
              <View key={`${file.uri}_${idx}`} style={styles.attachThumb}>
                {isImage ? (
                  <Image source={{ uri: file.uri }} style={styles.attachThumbImg} />
                ) : (
                  <View style={[styles.attachThumbImg, styles.attachThumbIconWrap]}>
                    <Text style={styles.attachThumbIcon}>📄</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.attachRemove}
                  onPress={() => removeAttachment(file.uri)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.attachRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
      <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'android' ? TAB_BAR_HEIGHT + insets.bottom : Math.max(insets.bottom, 16) }]}> 
        <TouchableOpacity onPress={onAttachPress} style={styles.attachBtn}>
          <Text style={styles.attachBtnText}>📎</Text>
        </TouchableOpacity>
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
          style={[styles.sendBtn, (isTyping || (!inputText.trim() && attachedFiles.length === 0)) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isTyping || sendingRef.current || (!inputText.trim() && attachedFiles.length === 0)}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>

      <ColorPickerModal
        visible={isColorPickerVisible}
        initialColor={colorPickerMode === 'text' ? chatTextColor : chatBackgroundColor}
        allowImage
        mode={colorPickerMode}
        onModeChange={setColorPickerMode}
        onClose={saveChatBackground}
      />
      <ImageViewerModal
        visible={viewerUri !== null}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  colorPickerBtn: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorPickerText: {
    fontSize: 14,
    color: theme.colors.text,
  },
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  attachmentsInMsg: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachmentChip: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  attachmentChipImage: { width: 120, height: 120 },
  attachmentPreview: { width: 120, height: 120 },
  attachmentFileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    maxWidth: 200,
  },
  attachmentFileIcon: { fontSize: 20 },
  attachmentFileName: { color: theme.colors.text, fontSize: 13, flexShrink: 1 },
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
  attachmentsRow: { maxHeight: 64, paddingTop: 8 },
  attachmentsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  attachThumb: {
    width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  attachThumbImg: { width: 48, height: 48 },
  attachThumbIconWrap: { alignItems: 'center', justifyContent: 'center' },
  attachThumbIcon: { fontSize: 20 },
  attachRemove: {
    position: 'absolute', top: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  attachRemoveText: { color: '#fff', fontSize: 11, lineHeight: 13 },
  attachBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  attachBtnText: { fontSize: 18 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
