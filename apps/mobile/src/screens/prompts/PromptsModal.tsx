import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Alert, TextInput, FlatList,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAccent } from '../../core/AccentContext';
import { api, storage } from '@/core';
import {
  TAB_CATEGORIES,
  PromptTemplate,
  fetchTemplates,
} from '../../data/promptTemplates';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PromptsModal({ visible, onClose }: Props) {
  const { accent } = useAccent();
  const [activeTab, setActiveTab] = useState<string>('ВСЕ');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | 'create' | null>(null);
  const [editForm, setEditForm] = useState({ title: '', prompt: '', description: '', icon: '', category: '' });

  const isAdmin = currentUsername.toLowerCase() === 'timgood';

  useEffect(() => {
    if (visible) {
      fetchTemplates().then(setTemplates);
      storage.get('current_username').then(name => {
        if (name) setCurrentUsername(name);
      });
    }
  }, [visible]);

  const activeFilter = TAB_CATEGORIES.find(
    (t) => t.label === activeTab,
  )?.filter ?? null;

  const filtered = activeFilter
    ? templates.filter((t) => t.category === activeFilter)
    : templates;

  const categoryColors: Record<string, string> = {
    VIDEO: '#00F0FF',
    PHOTO: '#FF6B35',
    BUSINESS: '#00FF88',
    SOCIAL: '#B44FFF',
    AVATAR: '#FF2D78',
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    onClose();
  };

  const handleDelete = (t: PromptTemplate) => {
    Alert.alert('Удалить', `Удалить "${t.title}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'УДАЛИТЬ',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.request(`/api/templates/${t.id}`, { method: 'DELETE' });
            const updated = await fetchTemplates();
            setTemplates(updated);
            setSelectedPrompt(null);
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const openEdit = (t: PromptTemplate) => {
    setEditForm({
      title: t.title,
      prompt: t.prompt,
      description: t.description,
      icon: t.icon,
      category: t.category,
    });
    setEditingPrompt(t);
  };

  const openCreate = () => {
    setEditForm({ title: '', prompt: '', description: '', icon: '📝', category: 'VIDEO' });
    setEditingPrompt('create');
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.prompt.trim()) {
      Alert.alert('Ошибка', 'Название и текст промта обязательны');
      return;
    }
    try {
      const id = (editingPrompt as PromptTemplate).id;
      await api.request(`/api/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setEditingPrompt(null);
      const updated = await fetchTemplates();
      setTemplates(updated);
      const updatedSel = updated.find(t => t.id === id) ?? null;
      setSelectedPrompt(updatedSel);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    }
  };

  const handleSaveCreate = async () => {
    if (!editForm.title.trim() || !editForm.prompt.trim()) {
      Alert.alert('Ошибка', 'Название и текст промта обязательны');
      return;
    }
    try {
      await api.request('/api/templates', {
        method: 'POST',
        body: JSON.stringify(editForm),
      });
      setEditingPrompt(null);
      const updated = await fetchTemplates();
      setTemplates(updated);
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.handlebar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Промпты и идеи</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isAdmin && (
                <TouchableOpacity
                  onPress={openCreate}
                  style={[styles.addButton, { borderColor: accent }]}
                >
                  <Text style={[styles.addButtonText, { color: accent }]}>+ ДОБАВИТЬ ПРОМПТ</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {TAB_CATEGORIES.map((tab) => {
              const active = activeTab === tab.label;
              return (
                <TouchableOpacity
                  key={tab.label}
                  onPress={() => setActiveTab(tab.label)}
                  style={[
                    styles.tab,
                    active && { backgroundColor: accent + '20', borderColor: accent },
                  ]}
                >
                  <Text style={[styles.tabText, { color: active ? accent : '#606080' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Prompts list */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Нет шаблонов в этой категории</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.promptCard}>
                <View style={styles.promptCardTop}>
                  <View style={[styles.cardIconWrap, { backgroundColor: accent + '15' }]}>
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: (categoryColors[item.category] ?? accent) + '22' }]}>
                      <Text style={[styles.categoryText, { color: categoryColors[item.category] ?? accent }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                {isAdmin ? (
                  <View style={styles.adminActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPrompt(item);
                        openEdit(item);
                      }}
                      style={styles.editBtn}
                    >
                      <Text style={[styles.actionBtnText, { color: accent }]}>📝 Редактировать</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>❌ Удалить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPrompt(item);
                      }}
                      style={styles.viewBtn}
                    >
                      <Text style={styles.viewBtnText}>👁 Просмотр</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleCopy(item.prompt)}
                    style={styles.copyBtn}
                  >
                    <Text style={[styles.copyBtnText, { color: accent }]}>📋 Скопировать</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      </View>

      {/* Prompt detail modal */}
      {selectedPrompt && !editingPrompt && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedPrompt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.handlebar} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                <View style={{
                  backgroundColor: (categoryColors[selectedPrompt.category] ?? accent) + '22',
                  borderWidth: 1,
                  borderColor: categoryColors[selectedPrompt.category] ?? accent,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}>
                  <Text style={{ color: categoryColors[selectedPrompt.category] ?? accent, fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>
                    {selectedPrompt.category}
                  </Text>
                </View>
                <Text style={{ color: '#e0e0ff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5, flex: 1 }}>
                  {selectedPrompt.title}
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 200 }}>
                <Text style={{ color: '#c0c0e0', fontSize: 14, lineHeight: 22 }}>
                  {selectedPrompt.prompt}
                </Text>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(selectedPrompt.prompt);
                    setSelectedPrompt(null);
                    onClose();
                  }}
                  style={{ flex: 1, backgroundColor: accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#000', fontWeight: '600', fontSize: 14, letterSpacing: 1 }}>
                    ⎘ СКОПИРОВАТЬ
                  </Text>
                </TouchableOpacity>

                {isAdmin && (
                  <>
                    <TouchableOpacity
                      onPress={() => openEdit(selectedPrompt)}
                      style={styles.adminIconBtn}
                    >
                      <Text style={{ color: accent, fontSize: 18 }}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(selectedPrompt)}
                      style={styles.adminIconBtn}
                    >
                      <Text style={{ color: '#ff3366', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </>
                )}

                {!isAdmin && (
                  <TouchableOpacity
                    onPress={() => setSelectedPrompt(null)}
                    style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(30,30,46,0.6)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#707090', fontWeight: '600', fontSize: 14, letterSpacing: 1 }}>
                      НАЗАД
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit / Create modal */}
      {editingPrompt && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingPrompt(null)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.editSheet}>
              <View style={styles.handlebar} />
              <Text style={[styles.editTitle, { color: accent }]}>
                {editingPrompt === 'create' ? '➕ НОВЫЙ ПРОМПТ' : '✎ РЕДАКТИРОВАТЬ'}
              </Text>

              <Text style={styles.label}>Иконка</Text>
              <TextInput
                value={editForm.icon}
                onChangeText={v => setEditForm(p => ({ ...p, icon: v }))}
                style={styles.input}
                maxLength={4}
              />

              <Text style={styles.label}>Название</Text>
              <TextInput
                value={editForm.title}
                onChangeText={v => setEditForm(p => ({ ...p, title: v }))}
                style={styles.input}
                placeholder="Название промпта"
                placeholderTextColor="#404060"
              />

              <Text style={styles.label}>Категория</Text>
              <TextInput
                value={editForm.category}
                onChangeText={v => setEditForm(p => ({ ...p, category: v }))}
                style={styles.input}
                placeholder="VIDEO, PHOTO, BUSINESS, SOCIAL..."
                placeholderTextColor="#404060"
              />

              <Text style={styles.label}>Описание</Text>
              <TextInput
                value={editForm.description}
                onChangeText={v => setEditForm(p => ({ ...p, description: v }))}
                style={styles.input}
                placeholder="Короткое описание"
                placeholderTextColor="#404060"
              />

              <Text style={styles.label}>Текст промпта</Text>
              <TextInput
                value={editForm.prompt}
                onChangeText={v => setEditForm(p => ({ ...p, prompt: v }))}
                style={[styles.input, { minHeight: 120 }]}
                multiline
                placeholder="Полный текст промпта..."
                placeholderTextColor="#404060"
                textAlignVertical="top"
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 }}>
                <TouchableOpacity
                  onPress={editingPrompt === 'create' ? handleSaveCreate : handleSaveEdit}
                  style={{ flex: 1, backgroundColor: accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#000', fontWeight: '600', fontSize: 14, letterSpacing: 1 }}>
                    {editingPrompt === 'create' ? 'СОЗДАТЬ' : 'СОХРАНИТЬ'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingPrompt(null)}
                  style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(30,30,46,0.6)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#707090', fontWeight: '600', fontSize: 14, letterSpacing: 1 }}>
                    ОТМЕНА
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'rgba(25,25,27,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#e0e0ff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addButton: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeBtn: {
    color: '#707090',
    fontSize: 20,
    padding: 4,
  },
  tabBar: {
    maxHeight: 48,
    marginBottom: 12,
  },
  tabBarContent: {
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },
  promptCard: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  promptCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardDesc: {
    color: '#606080',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30,30,46,0.6)',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30,30,46,0.6)',
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30,30,46,0.6)',
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(30,30,46,0.6)',
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtnText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '600',
  },
  viewBtnText: {
    color: '#707090',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#404060',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 60,
  },
  adminIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(30,30,46,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSheet: {
    backgroundColor: 'rgba(25,25,27,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  editTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 16,
  },
  label: {
    color: '#606080',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#e0e0ff',
    fontSize: 14,
  },
});
