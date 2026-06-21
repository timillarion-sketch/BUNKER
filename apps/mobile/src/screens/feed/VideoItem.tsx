import { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { theme } from '@/theme';
import { FeedVideo } from '@/core/types/feed';
import { getCachedUri } from '@/services/VideoCacheService';

interface Props {
  video: FeedVideo;
  isActive: boolean;
}

export default function VideoItem({ video, isActive }: Props) {
  const [uri, setUri] = useState<string>(video.url);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
      getCachedUri(video).then((resolvedUri: string) => {
        setUri(resolvedUri);
      });
    } else {
      player.pause();
    }
  }, [isActive, video, player]);

  useEffect(() => {
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsLoaded(true);
      }
    });
    return () => sub.remove();
  }, [player]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

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
      {!isLoaded && (
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.bottomLeft}>
          <Text style={styles.authorName}>{video.authorName}</Text>
          <Text style={styles.description} numberOfLines={2}>{video.description}</Text>
        </View>
        <View style={styles.bottomRight}>
          <Text style={styles.duration}>{formatDuration(video.duration)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Dimensions.get('window').height,
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  thumbnail: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: 16,
    justifyContent: 'flex-end',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomRight: {
    alignItems: 'flex-end',
  },
  authorName: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'black',
    textShadowRadius: 4,
    marginBottom: 4,
  },
  description: {
    color: theme.colors.text,
    fontSize: 14,
    textShadowColor: 'black',
    textShadowRadius: 4,
  },
  duration: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'black',
    textShadowRadius: 4,
    fontFamily: theme.fonts.mono,
  },
});
