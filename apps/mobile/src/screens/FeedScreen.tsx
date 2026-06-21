import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { theme } from '@/theme';
import { useFeed } from '@/hooks/useFeed';
import { preloadNext } from '@/services/VideoCacheService';
import VideoItem from './feed/VideoItem';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const {
    videos,
    currentIndex,
    setCurrentIndex,
    loadMore,
    isLoading,
    error,
    refresh,
  } = useFeed();

  const data = useMemo(() => videos, [videos]);

  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: Array<{ index: number | null }> }) => {
      if (info.viewableItems.length > 0) {
        const index = info.viewableItems[0].index;
        if (index !== null && index !== undefined) {
          setCurrentIndex(index);
          preloadNext(videos, index);
        }
      }
    },
    [setCurrentIndex, videos]
  );

  useEffect(() => {
    if (videos.length === 0 && !isLoading) {
      loadMore();
    }
  }, []);

  const renderItem = useCallback(({ item, index }: { item: typeof videos[0]; index: number }) => (
    <VideoItem video={item} isActive={index === currentIndex} />
  ), [currentIndex]);

  if (videos.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет видео</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        pagingEnabled
        viewabilityConfig={{
          itemVisiblePercentThreshold: 80,
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[theme.colors.accent]} />
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
      />
      {error && <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.danger,
    padding: 12,
    borderRadius: theme.radius.md,
  },
  errorText: {
    color: theme.colors.text,
    textAlign: 'center',
  },
});
