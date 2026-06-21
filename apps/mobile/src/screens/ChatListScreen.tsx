import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import { api } from '../core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ChatStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string; title: string };
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

export default function ChatListScreen({ navigation }: Props) {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<ChatRoom[]>('/chats');
      setChats(data);
    } catch {}
  }, []);

  useEffect(() => { fetchChats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const renderChat = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { chatId: item.id, title: item.name })}
    >
      <Text style={styles.chatName}>{item.name}</Text>
      {item.lastMessage && <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ЧАТЫ</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>Нет чатов</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 60 },
  header: {
    fontSize: 24, fontWeight: '700', color: theme.colors.text,
    paddingHorizontal: 20, marginBottom: 16, letterSpacing: 4,
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  chatItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  chatName: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  chatPreview: { fontSize: 13, color: theme.colors.textMuted },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
});
