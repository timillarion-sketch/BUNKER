import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File } from 'expo-file-system';
import { api, API_URL } from '@/core';

type UploadType = 'avatar' | 'chat_wallpaper';

interface UseImageUploadReturn {
  pickAndUploadImage: (type: UploadType) => Promise<string>;
  isUploading: boolean;
  error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUploadImage = useCallback(async (type: UploadType): Promise<string> => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      const msg = 'Нет доступа к галерее. Разрешите доступ в настройках.';
      setError(msg);
      throw new Error(msg);
    }

    const aspect: [number, number] | undefined = type === 'avatar' ? [1, 1] : undefined;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: type === 'avatar',
      aspect,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) {
      const msg = 'Выбор изображения отменён.';
      setError(msg);
      throw new Error(msg);
    }

    const file = result.assets[0];
    console.log('Picked file URI:', file.uri);
    let uriToUse = file.uri;

    if (file.uri.startsWith('content://')) {
      const source = new File(file.uri);
      const dest = new File(Paths.cache, `${Date.now()}.webp`);
      await source.copy(dest);
      uriToUse = dest.uri;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: uriToUse,
        name: 'upload.webp',
        type: file.mimeType || 'image/webp',
      } as any);
      formData.append('type', type);

      const token = await api.getToken();
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Не удалось загрузить изображение.';
        setError(msg);
        throw new Error(msg);
      }

      return data.url as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось загрузить изображение.';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { pickAndUploadImage, isUploading, error };
}