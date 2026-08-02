import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
  View, Text, FlatList, TextInput, Image, ScrollView,
  TouchableOpacity, StyleSheet, Alert, Linking, Modal,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Image as ExpoImage, ImageBackground as ExpoImageBackground } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';
import { useAccent } from '../core/AccentContext';
import { api } from '@/core';
import ColorPickerModal from '../components/ColorPickerModal';
import ImageViewerModal from '../components/ImageViewerModal';
import { uploadAttachment, type AttachmentMeta } from '../services/uploadAttachment';
import {
  ensureBnkrId,
  sendP2pMessage,
  fetchP2pHistory,
  onP2pMessage,
  onProfileUpdated,
  onMessageDeleted,
  deleteP2pMessages,
  deleteChat,
  fetchContactStatus,
  type P2pServerMessage,
  type ContactStatus,
} from '../services/p2pService';

interface P2PMessage {
  id: number | string;
  senderId: string;
  text: string;
  attachments?: AttachmentMeta[];
  createdAt: number;
  status: 'sending' | 'sent' | 'error';
  isOptimistic: boolean;
  deletedAt?: number | null;
  deletedBy?: string | null;
}

export default function UserChatScreen({
  route, navigation
}: any) {
  const { peerId, peerName, roomId, mode, contactId: navContactId, contactStatus: navContactStatus, isRequester: navIsRequester, peerAvatarUrl: navPeerAvatarUrl } = route.params as {
    peerId: string;
    peerName?: string;
    peerAvatarUrl?: string | null;
    roomId: string;
    mode?: 'hidden' | 'incognito';
    contactId?: number;
    contactStatus?: 'accepted' | 'pending';
    isRequester?: boolean;
  };
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [contactStatus, setContactStatus] = useState<ContactStatus | null>(() => {
    if (navContactStatus && typeof navContactId === 'number') {
      return { id: navContactId, status: navContactStatus, isRequester: navIsRequester ?? false };
    }
    return null;
  });
  const [contactActionLoading, setContactActionLoading] = useState(false);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(navPeerAvatarUrl ?? null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const isIncognito = mode === 'incognito';

  const [chatBackgroundColor, setChatBackgroundColor] = useState('#000000');
  const [chatTextColor, setChatTextColor] = useState('#ffffff');
  const [chatOwnTextColor, setChatOwnTextColor] = useState('#e0e0ff');
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [colorPickerMode, setColorPickerMode] = useState<'background' | 'ownText' | 'peerText'>('background');
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ uri: string; type: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<P2PMessage | null>(null);
  const [bothDeletedIds, setBothDeletedIds] = useState<Set<number>>(new Set());
  const MAX_ATTACHMENTS = 10;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [backgroundImageUrl]);

  useEffect(() => {
    // Load chat background preference
    api.get<{ backgroundType: string; backgroundColor: string; textColor: string; ownTextColor: string; backgroundImageUrl: string | null }>(`/api/chat-prefs/p2p/${peerId}`)
      .then(res => {
        setBackgroundType(res.backgroundType === 'image' ? 'image' : 'color');
        setChatBackgroundColor(res.backgroundColor || '#000000');
        setChatTextColor(res.textColor || '#ffffff');
        setChatOwnTextColor(res.ownTextColor || '#e0e0ff');
        setBackgroundImageUrl(res.backgroundImageUrl ?? null);
      })
      .catch(() => {
        setBackgroundType('color');
        setChatBackgroundColor('#000000');
        setChatTextColor('#ffffff');
        setChatOwnTextColor('#e0e0ff');
        setBackgroundImageUrl(null);
      });

    const controller = new AbortController();

    (async () => {
      const id = await ensureBnkrId();
      setMyId(id);

      try {
        const { messages: history } = await fetchP2pHistory(peerId, undefined, 50, controller.signal);
        if (controller.signal.aborted) return;
        setMessages(
          history.map((m: P2pServerMessage) => ({
            id: m.id,
            senderId: m.senderId,
            text: m.content,
            attachments: m.attachments,
            createdAt: new Date(m.createdAt).getTime(),
            status: m.status === "sent" ? "sent" as const : "sent" as const,
            isOptimistic: false,
            deletedAt: m.deletedAt ? new Date(m.deletedAt).getTime() : null,
            deletedBy: m.deletedBy ?? null,
          })),
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }

      if (!navContactId) {
        try {
          const { contact } = await fetchContactStatus(peerId);
          if (contact) {
            setContactStatus(contact);
          }
        } catch {
          // non-critical
        }
      }
    })();

    navigation.setOptions({
      title: peerName || peerId,
      headerStyle: { backgroundColor: '#0a0a0f' },
      headerTintColor: accent,
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {peerAvatarUrl ? (
            <ExpoImage source={{ uri: peerAvatarUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} cachePolicy="memory-disk" />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>
                {(peerName || peerId || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ color: '#e0e0ff', fontSize: 17, fontWeight: '600' }}>{peerName || peerId}</Text>
        </View>
      ),
    });

    return () => controller.abort();
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
            attachments: msg.attachments,
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

  useEffect(() => {
    if (!peerId) return;
    const unsub = onProfileUpdated((data) => {
      if (!data) return;
      try {
        const { peerId: updatedPeerId, avatarUrl } = JSON.parse(data);
        if (updatedPeerId === peerId) {
          setPeerAvatarUrl(avatarUrl ?? null);
        }
      } catch {}
    });
    return unsub;
  }, [peerId]);

  useEffect(() => {
    if (!peerId) return;
    let mounted = true;
    AsyncStorage.getItem(`p2p_deleted_both_${peerId}`).then((raw) => {
      if (!raw || !mounted) return;
      try {
        const ids = JSON.parse(raw) as number[];
        setBothDeletedIds(new Set(ids.filter((n) => typeof n === 'number')));
      } catch {}
    });
    return () => { mounted = false; };
  }, [peerId]);

  useEffect(() => {
    if (!peerId) return;
    const unsub = onMessageDeleted((data) => {
      if (!data) return;
      try {
        const { peerId: deletedPeerId, messageIds } = JSON.parse(data);
        if (deletedPeerId !== peerId || !Array.isArray(messageIds)) return;
        const numericIds = messageIds.filter((n: unknown) => typeof n === 'number');
        if (numericIds.length === 0) return;
        setBothDeletedIds((prev) => {
          const next = new Set(prev);
          numericIds.forEach((id: number) => next.add(id));
          AsyncStorage.setItem(`p2p_deleted_both_${peerId}`, JSON.stringify([...next]));
          return next;
        });
        setMessages((prev) =>
          prev.map((m) =>
            typeof m.id === 'number' && numericIds.includes(m.id)
              ? { ...m, deletedAt: Date.now(), deletedBy: peerId }
              : m,
          ),
        );
      } catch {}
    });
    return unsub;
  }, [peerId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || sendingRef.current || !myId) return;
    sendingRef.current = true;
    setSending(true);

    const optimisticId = `opt_${Date.now()}`;
    const optimistic: P2PMessage = {
      id: optimisticId,
      senderId: myId,
      text,
      createdAt: Date.now(),
      status: 'sending',
      isOptimistic: true,
    };

    setMessages(prev => prev.concat(optimistic));
    setInput('');
    listRef.current?.scrollToEnd({ animated: true });

    const clientMsgId = crypto.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      let attachments: AttachmentMeta[] = [];
      if (attachedFiles.length > 0) {
        attachments = await Promise.all(attachedFiles.map(file => uploadAttachment(file)));
      }

      const serverMsg = await sendP2pMessage(peerId, text, clientMsgId, attachments);

      if (serverMsg.contactPending) {
        setContactStatus(prev => {
          if (prev) {
            return { ...prev, id: serverMsg.contactId!, status: "pending" };
          }
          return { id: serverMsg.contactId!, status: "pending", isRequester: true };
        });
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId
            ? {
                id: serverMsg.id,
                senderId: serverMsg.senderId,
                text: serverMsg.content,
                attachments: serverMsg.attachments ?? attachments,
                createdAt: new Date(serverMsg.createdAt).getTime(),
                status: 'sent' as const,
                isOptimistic: false,
              }
            : m,
        ),
      );
      setAttachedFiles([]);
    } catch (err: unknown) {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId ? { ...m, status: 'error' as const } : m,
        ),
      );
      const msg = err instanceof Error ? err.message : 'Не удалось отправить сообщение';
      Alert.alert('Ошибка', msg);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [input, myId, sendingRef, peerId, attachedFiles]);

  const saveChatBackground = async (value: string, kind?: 'color' | 'image' | 'ownText' | 'peerText') => {
    try {
      if (kind === 'ownText') {
        await api.put(`/api/chat-prefs/p2p/${peerId}`, {
          ownTextColor: value,
        });
        setChatOwnTextColor(value);
      } else if (kind === 'peerText') {
        await api.put(`/api/chat-prefs/p2p/${peerId}`, {
          textColor: value,
        });
        setChatTextColor(value);
      } else if (kind === 'image') {
        await api.put(`/api/chat-prefs/p2p/${peerId}`, {
          backgroundType: 'image',
          backgroundImageUrl: value,
        });
        setBackgroundType('image');
        setBackgroundImageUrl(value);
      } else {
        await api.put(`/api/chat-prefs/p2p/${peerId}`, {
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

  const handleAcceptContact = async () => {
    if (!contactStatus || contactActionLoading) return;
    setContactActionLoading(true);
    try {
      await api.patch(`/api/contacts/${contactStatus.id}`, { status: "accepted" });
      setContactStatus({ ...contactStatus, status: "accepted" });
    } catch {
      Alert.alert("Ошибка", "Не удалось добавить в контакты");
    } finally {
      setContactActionLoading(false);
    }
  };

  const handleBlockContact = async () => {
    if (!contactStatus || contactActionLoading) return;
    setContactActionLoading(true);
    try {
      await api.patch(`/api/contacts/${contactStatus.id}`, { status: "blocked" });
      setContactStatus({ ...contactStatus, status: "blocked" });
      Alert.alert("Заблокирован", "Пользователь больше не сможет вам писать");
    } catch {
      Alert.alert("Ошибка", "Не удалось заблокировать");
    } finally {
      setContactActionLoading(false);
    }
  };

  const handleDeleteMessage = async (mode: "self" | "both") => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target || typeof target.id !== 'number' || !myId) return;
    const messageId = target.id;

    try {
      await deleteP2pMessages([messageId], mode);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deletedAt: Date.now(), deletedBy: myId } : m,
        ),
      );
      if (mode === 'both') {
        setBothDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(messageId);
          AsyncStorage.setItem(`p2p_deleted_both_${peerId}`, JSON.stringify([...next]));
          return next;
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось удалить сообщение';
      Alert.alert('Ошибка', msg);
    }
  };

  const handleClearChat = () => {
    Alert.alert('Очистить чат', 'Вся переписка с собеседником будет удалена.', [
      { text: 'Только у меня', style: 'destructive', onPress: () => clearChat('self') },
      { text: 'У всех', style: 'destructive', onPress: () => clearChat('both') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const clearChat = async (mode: "self" | "both") => {
    try {
      await deleteChat(peerId, mode);
      setMessages([]);
      AsyncStorage.removeItem(`p2p_deleted_both_${peerId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось очистить чат';
      Alert.alert('Ошибка', msg);
    }
  };

  const isMessageDeleted = (m: P2PMessage): boolean =>
    m.deletedAt != null &&
    (m.deletedBy === myId ||
      (typeof m.id === 'number' && bothDeletedIds.has(m.id)));

  const openAttachment = (att: AttachmentMeta) => {
    if (att.type.startsWith('image/')) {
      setViewerUri(att.url);
      return;
    }
    Linking.openURL(att.url).catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть вложение');
    });
  };

  const renderAttachments = (atts: AttachmentMeta[], isMe: boolean) => (
    <View style={styles.attachmentsInMsg}>
      {atts.map((att, idx) => {
        const isImage = att.type.startsWith('image/');
        return (
          <TouchableOpacity
            key={`${att.url}_${idx}`}
            onPress={() => openAttachment(att)}
            style={[styles.attachmentChip, isImage ? styles.attachmentChipImage : null]}
          >
            {isImage ? (
              <ExpoImage source={{ uri: att.url }} style={styles.attachmentPreview} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={styles.attachmentFileRow}>
                <Text style={styles.attachmentFileIcon}>📄</Text>
                <Text style={[styles.attachmentFileName, isMe ? null : { color: chatTextColor }]} numberOfLines={2}>
                  {att.name || 'Файл'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMessage = ({ item }: { item: P2PMessage }) => {
    const isMe = item.senderId === myId;
    const statusIcon =
      item.status === 'sending' ? ' ·' :
      item.status === 'sent' ? ' ✓' :
      ' ✗';
    if (isMessageDeleted(item)) {
      return (
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          <View style={[styles.bubble, styles.bubbleDeleted]}>
            <Text style={styles.deletedText}>Сообщение удалено</Text>
          </View>
        </View>
      );
    }
    const hasContent = item.text || (item.attachments && item.attachments.length > 0);
    if (!hasContent) return null;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        <TouchableOpacity
          onLongPress={() => setDeleteTarget(item)}
          activeOpacity={0.8}
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: accent + '22', borderColor: accent }]
              : styles.bubbleThem
          ]}
        >
          {item.text ? (
            <Text style={[styles.msgText, isMe ? { color: chatOwnTextColor } : { color: chatTextColor }]}>
              {item.text}
            </Text>
          ) : null}
          {item.attachments && item.attachments.length > 0
            ? renderAttachments(item.attachments, isMe)
            : null}
          <Text style={styles.msgMeta}>
            {new Date(item.createdAt).toLocaleTimeString('ru', {
              hour: '2-digit', minute: '2-digit'
            })}
            {isMe && statusIcon}
          </Text>
        </TouchableOpacity>
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
      style={[styles.root, showImage ? null : { backgroundColor: chatBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + insets.bottom + 8 : 0}
    >
      {showImage && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ExpoImageBackground
            source={bgImageSource}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setImageLoadFailed(true)}
          />
        </View>
      )}
      <View style={[styles.peerHeader, { borderBottomColor: accent + '33' }]}>
        <View style={[styles.peerBadge, { borderColor: accent }]}>
          <Text style={[styles.peerLabel, { color: accent }]}>
            {isIncognito ? '💀 ИНКОГНИТО' : '🔒 СКРЫТЫЙ'}
          </Text>
          {peerName ? (
            <>
              <Text style={styles.peerName}>{peerName}</Text>
              <Text style={styles.peerId}>{peerId}</Text>
            </>
          ) : (
            <Text style={styles.peerId}>{peerId}</Text>
          )}
        </View>
        <View style={styles.e2eTag}>
          <Text style={styles.e2eText}>🔒 E2E</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setColorPickerMode('background'); setIsColorPickerVisible(true); }}
          style={{ marginLeft: 8, padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text style={{ fontSize: 16, color: '#e0e0ff' }}>🎨</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setColorPickerMode('peerText'); setIsColorPickerVisible(true); }}
          style={{ marginLeft: 8, padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text style={{ fontSize: 16, color: '#e0e0ff' }}>А</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClearChat}
          style={{ marginLeft: 8, padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text style={{ fontSize: 16, color: '#ff6b6b' }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {contactStatus && contactStatus.status === "pending" && !contactStatus.isRequester ? (
        <View style={styles.contactBanner}>
          <Text style={styles.contactBannerTitle}>⚠️ Незнакомый пользователь</Text>
          <Text style={styles.contactBannerSub}>Добавить в контакты или заблокировать?</Text>
          <View style={styles.contactBannerActions}>
            <TouchableOpacity
              onPress={handleAcceptContact}
              disabled={contactActionLoading}
              style={[styles.contactAcceptBtn, { backgroundColor: accent }]}
            >
              <Text style={styles.contactAcceptText}>✅ Добавить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBlockContact}
              disabled={contactActionLoading}
              style={styles.contactBlockBtn}
            >
              <Text style={styles.contactBlockText}>🚫 Заблокировать</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
          keyExtractor={m => String(m.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          ListHeaderComponent={
            contactStatus && contactStatus.status === "pending" && !contactStatus.isRequester ? (
              <View style={styles.contactBanner}>
                <Text style={styles.contactBannerTitle}>⚠️ Незнакомый пользователь</Text>
                <Text style={styles.contactBannerSub}>Добавить в контакты или заблокировать?</Text>
                <View style={styles.contactBannerActions}>
                  <TouchableOpacity
                    onPress={handleAcceptContact}
                    disabled={contactActionLoading}
                    style={[styles.contactAcceptBtn, { backgroundColor: accent }]}
                  >
                    <Text style={styles.contactAcceptText}>✅ Добавить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleBlockContact}
                    disabled={contactActionLoading}
                    style={styles.contactBlockBtn}
                  >
                    <Text style={styles.contactBlockText}>🚫 Заблокировать</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
        />
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

      <View style={[styles.inputRow, { borderTopColor: accent + '33', paddingBottom: Platform.OS === 'android' ? TAB_BAR_HEIGHT + insets.bottom : Math.max(insets.bottom, 16) }]}> 
        <TouchableOpacity onPress={onAttachPress} style={styles.attachBtn}>
          <Text style={styles.attachBtnText}>📎</Text>
        </TouchableOpacity>
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
          disabled={(!input.trim() && attachedFiles.length === 0) || sendingRef.current}
          style={[styles.sendBtn, { backgroundColor: (input.trim() || attachedFiles.length > 0) && !sendingRef.current ? accent : '#1e1e2e' }]}
        >
          <Text style={[styles.sendIcon, { color: (input.trim() || attachedFiles.length > 0) && !sendingRef.current ? '#000' : '#404060' }]}>
            ➤
          </Text>
        </TouchableOpacity>
      </View>

      <ColorPickerModal
        visible={isColorPickerVisible}
        initialColor={colorPickerMode === 'ownText' ? chatOwnTextColor : colorPickerMode === 'peerText' ? chatTextColor : chatBackgroundColor}
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

      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.deleteMenuOverlay}>
          <View style={styles.deleteMenuCard}>
            <Text style={styles.deleteMenuTitle}>🗑 Удалить сообщение?</Text>
            <TouchableOpacity
              style={styles.deleteMenuBtn}
              onPress={() => handleDeleteMessage('self')}
            >
              <Text style={styles.deleteMenuBtnText}>Удалить у себя</Text>
            </TouchableOpacity>
            {deleteTarget && deleteTarget.senderId === myId ? (
              <TouchableOpacity
                style={styles.deleteMenuBtn}
                onPress={() => handleDeleteMessage('both')}
              >
                <Text style={styles.deleteMenuBtnText}>Удалить у всех</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.deleteMenuBtn, styles.deleteMenuCancel]}
              onPress={() => setDeleteTarget(null)}
            >
              <Text style={[styles.deleteMenuBtnText, styles.deleteMenuCancelText]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  bubbleDeleted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 7,
  },
  deletedText: {
    color: '#505060',
    fontSize: 13,
    fontStyle: 'italic',
  },
  deleteMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  deleteMenuCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#12121a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    gap: 10,
  },
  deleteMenuTitle: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  deleteMenuBtn: {
    backgroundColor: 'rgba(255,60,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.4)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteMenuBtnText: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteMenuCancel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  deleteMenuCancelText: {
    color: '#9a9ab0',
  },
  peerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  peerBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  peerLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '700' },
  peerName: { color: '#e0e0ff', fontSize: 15, fontWeight: '600', letterSpacing: 0.5, marginTop: 3 },
  peerId: { color: '#e0e0ff', fontSize: 13, fontFamily: 'monospace', fontWeight: '600', letterSpacing: 1, marginTop: 1 },
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
  attachmentFileName: { color: '#c0c0e0', fontSize: 13, flexShrink: 1 },
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
  },
  attachBtnText: { fontSize: 18 },
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
  contactBanner: {
    backgroundColor: 'rgba(255,180,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,0.2)',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    gap: 6,
  },
  contactBannerTitle: { color: '#ffb400', fontSize: 13, fontWeight: '700' },
  contactBannerSub: { color: '#8080a0', fontSize: 12 },
  contactBannerActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  contactAcceptBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  contactAcceptText: { color: '#000', fontSize: 12, fontWeight: '700' },
  contactBlockBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,50,50,0.15)', borderWidth: 1, borderColor: 'rgba(255,50,50,0.3)' },
  contactBlockText: { color: '#ff3344', fontSize: 12, fontWeight: '700' },
});
