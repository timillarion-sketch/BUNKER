import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { theme as baseTheme } from '../theme';
import { useBunkerData } from '../hooks/useBunkerData';

interface CharacterCard {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  systemPrompt?: string;
}

const DEFAULT_CHARACTERS: CharacterCard[] = [
  {
    id: 'psychologist',
    name: 'ИИ Психолог',
    emoji: '🧠',
    description: 'Конфиденциальные сессии с AI терапевтом',
    color: '#00F0FF',
  },
  {
    id: 'alt',
    name: 'Альтушка',
    emoji: '💜',
    description: 'Альтернативная собеседница',
    color: '#FF2D78',
  },
  {
    id: 'alfons',
    name: 'Альфонс',
    emoji: '🕴️',
    description: 'Харизматичный советник',
    color: '#FF6B35',
  },
  {
    id: 'producer',
    name: 'Контент Продюсер',
    emoji: '🎬',
    description: 'Генерация идей и контента',
    color: '#00FF88',
  },
];

const CARD_COLORS = ['#00F0FF', '#FF2D78', '#FF6B35', '#00FF88', '#B44FFF', '#FFD700'];
const CARD_EMOJIS = ['🧠', '🖤', '😎', '🎬', '👁', '⚡', '🔥', '💀', '🌙', '🎭', '🔮', '💎'];
const N8N_EMOJIS = ['🤖', '🧑‍💼', '👩‍💻', '🦸', '🧙', '👨‍🔬', '👩‍🎨', '🧑‍🚀', '🕵️', '💂', '🧑‍🍳', '👨‍🏫'];

export default function LobbyScreen() {
  const { accent } = useAccent();
  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, accent },
  };
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { aiCharacterItems, isLoading } = useBunkerData();

  const [characters, setCharacters] = useState<CharacterCard[]>(DEFAULT_CHARACTERS);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (aiCharacterItems.length > 0) {
      const n8nChars: CharacterCard[] = aiCharacterItems.map((item, idx) => ({
        id: `n8n_${item.row_number}`,
        name: item.title,
        emoji: N8N_EMOJIS[idx % N8N_EMOJIS.length],
        description: item.text.length > 80 ? item.text.slice(0, 80) + '…' : item.text,
        color: CARD_COLORS[idx % CARD_COLORS.length],
        systemPrompt: item.text,
      }));
      setCharacters(n8nChars);
    } else {
      setCharacters(DEFAULT_CHARACTERS);
    }
  }, [aiCharacterItems]);

  useEffect(() => {
    if (!aiCharacterItems.length) {
      AsyncStorage.getItem('character_customizations')
        .then(data => {
          if (data) {
            const customs = JSON.parse(data);
            setCharacters(prev => prev.map(c => ({
              ...c,
              ...(customs[c.id] ?? {}),
            })));
          }
        });
    }
  }, [aiCharacterItems]);

  const saveCustomization = (id: string, emoji: string, color: string) => {
    AsyncStorage.getItem('character_customizations')
      .then(data => {
        const customs = data ? JSON.parse(data) : {};
        customs[id] = { emoji, color };
        return AsyncStorage.setItem('character_customizations', JSON.stringify(customs));
      })
      .then(() => {
        setCharacters(prev => prev.map(c =>
          c.id === id ? { ...c, emoji, color } : c
        ));
        setEditingId(null);
      });
  };

  const openChat = (character: CharacterCard) => {
    navigation.navigate('AiChat', {
      characterId: character.id,
      characterName: character.name,
      characterAvatar: character.emoji,
      systemPrompt: character.systemPrompt,
    });
  };

  const [tempEmoji, setTempEmoji] = useState('🧠');
  const [tempColor, setTempColor] = useState('#00F0FF');

  const editingChar = editingId ? characters.find(c => c.id === editingId) : null;

  useEffect(() => {
    if (editingChar) {
      setTempEmoji(editingChar.emoji);
      setTempColor(editingChar.color);
    }
  }, [editingId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.scanlines, { backgroundColor: accent }]} pointerEvents="none" />
      <Text style={[styles.header, { color: accent, textShadowColor: accent }]}>ПЕРСОНАЛ</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>ВЫБЕРИТЕ СОБЕСЕДНИКА</Text>
      {isLoading && characters.length === 0 && (
        <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>Загрузка персонажей...</Text>
      )}
      <ScrollView contentContainerStyle={styles.grid}>
        {characters.map((char) => (
          <TouchableOpacity
            key={char.id}
            onPress={() => openChat(char)}
            onLongPress={() => !char.systemPrompt && setEditingId(char.id)}
            delayLongPress={600}
            style={[styles.card, { borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }]}
          >
            <View style={[styles.cardGlow, { backgroundColor: (char.color || accent) + '15' }]} />
            <Text style={styles.cardEmoji}>{char.emoji}</Text>
            <Text style={styles.cardName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              {char.name}
            </Text>
            <Text style={styles.cardDesc} numberOfLines={3}>
              {char.description}
            </Text>
            {!char.systemPrompt && (
              <Text style={[styles.editHint, { color: (char.color || accent) + '80' }]}>
                удерживай для настройки
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {editingChar && !editingChar.systemPrompt && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingId(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.handlebar} />
              <Text style={styles.modalTitle}>Настройка персонажа</Text>
              <Text style={styles.modalSubtitle}>{editingChar.name}</Text>

              <Text style={styles.sectionLabel}>ЭМОДЗИ</Text>
              <View style={styles.emojiGrid}>
                {CARD_EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setTempEmoji(e)}
                    style={[
                      styles.emojiBtn,
                      tempEmoji === e && { backgroundColor: tempColor + '33', borderColor: tempColor, borderWidth: 1 },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>ЦВЕТ КАРТОЧКИ</Text>
              <View style={styles.colorRow}>
                {CARD_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setTempColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      tempColor === c && styles.colorDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tempColor }]}
                onPress={() => saveCustomization(editingId!, tempEmoji, tempColor)}
              >
                <Text style={styles.saveBtnText}>СОХРАНИТЬ</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setEditingId(null)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: '#404060' }}>ОТМЕНА</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scanlines: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    pointerEvents: 'none',
  },
  header: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginTop: 6,
    marginBottom: 28,
  },
  loadingLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 14,
    paddingBottom: 20,
  },
  card: {
    width: '47%',
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    minHeight: 160,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardName: {
    color: '#e0e0ff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDesc: {
    color: '#606080',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  editHint: {
    fontSize: 9,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: {
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
  modalTitle: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#606080',
    fontSize: 13,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#404060',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(30,30,46,0.5)',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorDotActive: {
    transform: [{ scale: 1.25 }],
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 2,
  },
});
