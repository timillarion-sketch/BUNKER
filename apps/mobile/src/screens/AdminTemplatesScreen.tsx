import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { api } from '@/core';
import type { PromptTemplate } from '../data/promptTemplates';

interface FormState {
  title: string;
  category: string;
  description: string;
  icon: string;
  prompt: string;
}

const EMPTY_FORM: FormState = {
  title: '', category: 'VIDEO', description: '', icon: '📝', prompt: '',
};

export default function AdminTemplatesScreen({ navigation }: any) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PromptTemplate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newCategory, setNewCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<PromptTemplate[]>('/api/templates');
      setTemplates(data || []);
      const cats = await api.get<string[]>('/api/templates/categories');
      setCategories(cats || []);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить шаблоны');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNewCategory('');
    setModalVisible(true);
  };

  const openEdit = (t: PromptTemplate) => {
    setEditing(t);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description,
      icon: t.icon,
      prompt: t.prompt,
    });
    setNewCategory('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.prompt.trim()) {
      Alert.alert('Ошибка', 'Название и тело промта обязательны');
      return;
    }

    const category = newCategory.trim() || form.category;

    try {
      if (editing) {
        await api.request(`/api/templates/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, category }),
        });
      } else {
        await api.request('/api/templates', {
          method: 'POST',
          body: JSON.stringify({ ...form, category }),
        });
      }
      setModalVisible(false);
      await load();
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить шаблон');
    }
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
            await load();
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PromptTemplate }) => (
    <View style={[styles.itemCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemCat}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity
          onPress={() => openEdit(item)}
          style={[styles.actionBtn, { borderColor: accent }]}
        >
          <Text style={{ color: accent, fontSize: 12, fontWeight: '600' }}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={[styles.actionBtn, { borderColor: '#ff3366' }]}
        >
          <Text style={{ color: '#ff3366', fontSize: 12, fontWeight: '600' }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: accent }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSub, { color: accent }]}>⚙️ АДМИН</Text>
          <Text style={styles.headerTitle}>Управление шаблонами</Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          style={[styles.addBtn, { borderColor: accent }]}
        >
          <Text style={[styles.addBtnText, { color: accent }]}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: '#404060' }}>Загрузка...</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={t => String(t.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: '#404060' }}>Нет шаблонов</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalSheet]}>
            <View style={styles.handlebar} />
            <Text style={[styles.modalTitle, { color: accent }]}>
              {editing ? '✎ РЕДАКТИРОВАТЬ' : '➕ НОВЫЙ ШАБЛОН'}
            </Text>

            <Text style={styles.label}>Emoji-иконка</Text>
            <TextInput
              value={form.icon}
              onChangeText={v => setForm(p => ({ ...p, icon: v }))}
              style={styles.input}
              maxLength={4}
            />

            <Text style={styles.label}>Название</Text>
            <TextInput
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
              style={styles.input}
              placeholder="Вирусный Reels"
              placeholderTextColor="#404060"
            />

            <Text style={styles.label}>Категория</Text>
            <View style={styles.categoryRow}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setForm(p => ({ ...p, category: c }));
                    setNewCategory('');
                  }}
                  style={[
                    styles.catChip,
                    form.category === c && { backgroundColor: accent + '30', borderColor: accent },
                  ]}
                >
                  <Text style={{
                    color: form.category === c ? accent : '#606080',
                    fontSize: 11, fontWeight: '600',
                  }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Или введи новую категорию..."
              placeholderTextColor="#404060"
              style={[styles.input, { marginTop: 4 }]}
            />

            <Text style={styles.label}>Описание (превью)</Text>
            <TextInput
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              style={styles.input}
              placeholder="Короткое описание карточки"
              placeholderTextColor="#404060"
            />

            <Text style={styles.label}>Текст промта</Text>
            <TextInput
              value={form.prompt}
              onChangeText={v => setForm(p => ({ ...p, prompt: v }))}
              style={[styles.input, styles.promptInput]}
              multiline
              placeholder="Полный текст промта..."
              placeholderTextColor="#404060"
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.saveBtnText}>
                  {editing ? 'СОХРАНИТЬ' : 'СОЗДАТЬ'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ alignItems: 'center', paddingVertical: 10 }}
              >
                <Text style={{ color: '#404060' }}>ОТМЕНА</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  back: { fontSize: 24, paddingRight: 4, lineHeight: 30 },
  headerSub: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  headerTitle: { color: '#e0e0ff', fontSize: 18, fontWeight: '600' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, lineHeight: 26, fontWeight: '300' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  itemCard: {
    backgroundColor: 'rgba(25,25,27,0.65)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6,
  },
  itemIcon: { fontSize: 24 },
  itemTitle: { color: '#e0e0ff', fontSize: 15, fontWeight: '600' },
  itemCat: { color: '#404060', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  itemDesc: { color: '#606080', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  itemActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24, maxHeight: '85%',
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 14, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  label: { color: '#606080', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: 'rgba(10,10,15,0.6)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: '#e0e0ff', fontSize: 14,
  },
  promptInput: { minHeight: 120 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modalActions: { gap: 10, marginTop: 16, marginBottom: 20 },
  saveBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 14, fontWeight: '600', letterSpacing: 1 },
});
