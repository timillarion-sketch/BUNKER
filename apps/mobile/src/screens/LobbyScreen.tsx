import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../core';

interface AiCharacter {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline';
}

export default function LobbyScreen() {
  const [characters, setCharacters] = useState<AiCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const fetchCharacters = async () => {
    try {
      const data = await api.get<AiCharacter[]>('/characters');
      setCharacters(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCharacters(); }, []);

  const renderCharacter = ({ item }: { item: AiCharacter }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('Чат', {
          screen: 'Chat',
          params: {
            characterId: item.id,
            characterName: item.name,
            characterAvatar: '',
          },
        })
      }
    >
      <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? theme.colors.success : theme.colors.textMuted }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ЛОББИ</Text>
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={renderCharacter}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchCharacters}
        ListEmptyComponent={<Text style={styles.empty}>Нет персонажей</Text>}
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
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: theme.colors.textMuted },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 },
});
