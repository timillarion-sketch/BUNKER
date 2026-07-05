import { useCallback, useState, useEffect } from 'react';
import {
  View, Image, Text, StyleSheet, Dimensions,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { theme } from '@/theme';
import { FeedVideo } from '@/core/types/feed';
import { getCachedUri } from '@/services/VideoCacheService';

interface Props {
  video: FeedVideo;
  isActive: boolean;
  onEnded?: (duration: number) => void;
  onLike?: (videoId: number, liked: boolean) => void;
  onSave?: (videoId: number, saved: boolean) => void;
}

export default function VideoItem({ video, isActive, onEnded, onLike, onSave }: Props) {
  const [uri, setUri] = useState<string>(video.url);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = isMuted;
    if (isActive) player.play();
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive) {
      player.play();
      getCachedUri(video).then(setUri).catch(() => {});
    } else {
      player.pause();
    }
  }, [isActive, video, player]);

  useEffect(() => {
    const unsubStatus = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsReady(true);
        setIsBuffering(false);
      } else if (payload.status === 'loading') {
        setIsBuffering(true);
      }
    });

    const unsubPlay = player.addListener('playToEnd', () => {
      if (player.duration) {
        onEnded?.(player.duration);
      }
    });

    const unsubBuffer = player.addListener('bufferOptions', () => {});
    const unsubWait = player.addListener('waiting', () => {
      setIsBuffering(true);
    });

    return () => {
      unsubStatus.remove();
      unsubPlay.remove();
      unsubBuffer.remove();
      unsubWait.remove();
    };
  }, [player, onEnded]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      onLike?.(video.id, next);
      return next;
    });
  }, [video.id, onLike]);

  const toggleSave = useCallback(() => {
    setSaved((prev) => {
      const next = !prev;
      onSave?.(video.id, next);
      return next;
    });
  }, [video.id, onSave]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleMute} activeOpacity={1}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {(!isReady || isBuffering) && (
        <View style={styles.bufferOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {!isReady && (
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.bottomLeft}>
          <Text style={styles.authorName}>{video.authorName ?? `@user_${video.authorId}`}</Text>
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{video.description}</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
              {liked ? '♥' : '♡'}
            </Text>
            <Text style={styles.actionLabel}>{video.likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleSave} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, saved && styles.savedIcon]}>
              {saved ? '📋' : '📄'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionBtn}>
            <Text style={styles.actionIcon}>⏱</Text>
            <Text style={styles.actionLabel}>{formatDuration(video.duration)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  thumbnail: {
    ...StyleSheet.absoluteFill,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: 16,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  bottomLeft: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  authorName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    marginBottom: 2,
  },
  title: {
    color: '#e0e0ff',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    marginBottom: 4,
  },
  description: {
    color: '#c0c0e0',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  rightActions: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 60,
    paddingLeft: 16,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  actionIcon: {
    fontSize: 24,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  likedIcon: {
    color: '#ff2d55',
  },
  savedIcon: {
    color: '#ffcc00',
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
});
