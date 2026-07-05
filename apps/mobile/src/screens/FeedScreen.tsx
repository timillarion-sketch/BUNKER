import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Dimensions, TouchableOpacity, RefreshControl, Alert, ScrollView, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/core';
import { FeedVideo } from '@/core/types/feed';
import { useFeed } from '@/hooks/useFeed';
import { useVideoTracker } from '@/hooks/useVideoTracker';
import VideoItem from './feed/VideoItem';
import PromptsModal from './prompts/PromptsModal';
import { preloadNext } from '@/services/VideoCacheService';
import { useAccent } from '@/core/AccentContext';
import { useBunkerData } from '@/hooks/useBunkerData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const { contentItems, refetch: refetchBunkerData } = useBunkerData();
  const {
    videos, currentIndex, setCurrentIndex,
    loadMore, isLoading, isRefreshing, error, refresh,
  } = useFeed();
  const [showPrompts, setShowPrompts] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const trackerRef = useRef<Map<number, ReturnType<typeof useVideoTracker>>>(new Map());
  const onViewableRef = useRef<((info: { changed: any[] }) => void) | null>(null);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (videos.length > 0 && currentIndex >= 0) {
      preloadNext(videos, currentIndex);
    }
  }, [currentIndex, videos]);

  const handleLike = useCallback(async (videoId: number, liked: boolean) => {
    try {
      await api.post('/api/interaction', { videoId, isLiked: liked });
    } catch {}
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
    refetchBunkerData();
  }, [refresh, refetchBunkerData]);

  const handleSave = useCallback(async (videoId: number, saved: boolean) => {
    try {
      await api.post('/api/interaction', { videoId, isSaved: saved });
    } catch {}
  }, []);

  const handleUploadVideo = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'video.mp4',
        type: file.mimeType || 'video/mp4',
      } as any);

      const token = await api.getToken();
      const res = await fetch(`${api.baseUrl}/api/videos/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        refresh();
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить видео');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить видео');
    }
  }, [refresh]);

  const handleEnded = useCallback((videoId: number, _duration: number) => {
    const tracker = trackerRef.current.get(videoId);
    tracker?.onEnded(_duration);
  }, []);

  const onViewableItemsChanged = useCallback(({ changed }: { changed: any[] }) => {
    const visibleItem = changed.find((c) => c.isViewable);
    if (!visibleItem) return;

    const idx = videos.findIndex((v) => v.id === visibleItem.item.id);
    if (idx === -1 || idx === currentIndex) return;

    const prevTracker = trackerRef.current.get(videos[currentIndex]?.id);
    prevTracker?.flush();

    setCurrentIndex(idx);
  }, [videos, currentIndex, setCurrentIndex]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 100,
  }).current;

  const handleScrollToIndexFailed = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: currentIndex, animated: false });
  }, [currentIndex]);

  const renderItem = useCallback(({ item }: { item: FeedVideo }) => {
    const idx = videos.findIndex((v) => v.id === item.id);
    const isActive = idx === currentIndex;

    return (
      <TrackerWrapper
        videoId={item.id}
        isActive={isActive}
        trackerRef={trackerRef}
        onEnded={handleEnded}
      >
        <VideoItem
          video={item}
          isActive={isActive}
          onEnded={(dur) => handleEnded(item.id, dur)}
          onLike={handleLike}
          onSave={handleSave}
        />
      </TrackerWrapper>
    );
  }, [videos, currentIndex, handleEnded, handleLike, handleSave]);

  const keyExtractor = useCallback((item: FeedVideo) => String(item.id), []);

  const PromptsHeader = (
    <View style={[styles.promptsHeader, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.promptsBtn}
          onPress={() => setShowPrompts(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.promptsIcon}>💡</Text>
          <Text style={styles.promptsLabel}>Промпты и идеи</Text>
          <Text style={styles.promptsArrow}>›</Text>
        </TouchableOpacity>

        {contentItems.length > 0 && (
          <TouchableOpacity
            style={[styles.promptsBtn, { marginLeft: 8 }]}
            onPress={() => setShowContent(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.promptsIcon}>📦</Text>
            <Text style={styles.promptsLabel}>Контент</Text>
            <Text style={styles.contentBadge}>{contentItems.length}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {videos.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToAlignment="start"
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadMore}
          onEndReachedThreshold={3}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={3}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Нет видео для показа</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          {isLoading && <Text style={styles.loadingText}>Загрузка...</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {!isLoading && !error && (
            <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Повторить</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {PromptsHeader}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={handleUploadVideo}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <PromptsModal visible={showPrompts} onClose={() => setShowPrompts(false)} />

      <ContentModal visible={showContent} onClose={() => setShowContent(false)} contentItems={contentItems} accent={accent} />
    </View>
  );
}

function TrackerWrapper({
  videoId, isActive, trackerRef, onEnded, children,
}: {
  videoId: number;
  isActive: boolean;
  trackerRef: React.MutableRefObject<Map<number, ReturnType<typeof useVideoTracker>>>;
  onEnded: (videoId: number, duration: number) => void;
  children: React.ReactNode;
}) {
  const tracker = useVideoTracker(videoId, isActive);

  useEffect(() => {
    trackerRef.current.set(videoId, tracker);
    return () => { trackerRef.current.delete(videoId); };
  }, [videoId, tracker, trackerRef]);

  return <>{children}</>;
}

function ContentModal({
  visible, onClose, contentItems, accent,
}: {
  visible: boolean;
  onClose: () => void;
  contentItems: { title: string; text: string }[];
  accent: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={contentModalStyles.overlay}>
        <View style={contentModalStyles.sheet}>
          <View style={contentModalStyles.handlebar} />
          <View style={contentModalStyles.headerRow}>
            <Text style={contentModalStyles.title}>Контент из n8n</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={contentModalStyles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {contentItems.length === 0 ? (
            <Text style={contentModalStyles.empty}>Нет контента</Text>
          ) : (
            <ScrollView style={contentModalStyles.scroll}>
              {contentItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={contentModalStyles.card}
                >
                  <Text style={[contentModalStyles.cardTitle, { color: accent }]}>
                    {item.title}
                  </Text>
                  <Text style={contentModalStyles.cardText} numberOfLines={4}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const contentModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(25,25,27,0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
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
  title: {
    color: '#e0e0ff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    color: '#707090',
    fontSize: 20,
    padding: 4,
  },
  empty: {
    color: '#404060',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  scroll: {
    maxHeight: 400,
  },
  card: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    color: '#9090b0',
    fontSize: 13,
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050508',
  },
  promptsHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentBadge: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#00F0FF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 6,
    marginLeft: 6,
    overflow: 'hidden',
  },
  promptsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,30,0.8)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    gap: 8,
  },
  promptsIcon: {
    fontSize: 16,
  },
  promptsLabel: {
    color: '#e0e0ff',
    fontSize: 13,
    fontWeight: '600',
  },
  promptsArrow: {
    color: '#606080',
    fontSize: 18,
    marginLeft: 4,
  },
  emptyContainer: {
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#606080',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#8080a0',
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#000',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
});
