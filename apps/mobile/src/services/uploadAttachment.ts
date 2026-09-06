import { File, UploadType as ExpoUploadType } from 'expo-file-system';
import { api, API_URL } from '@/core';

export interface AttachmentMeta {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function uploadAttachment(
  file: { uri: string; type: string },
): Promise<AttachmentMeta> {
  const token = await api.getToken();
  const fileToUpload = new File(file.uri);
  const res = await fileToUpload.upload(`${API_URL}/api/upload/attachment`, {
    httpMethod: 'POST',
    uploadType: ExpoUploadType.MULTIPART,
    fieldName: 'attachment',
    mimeType: file.type,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = JSON.parse(res.body);

  if (res.status !== 200) {
    throw new Error(data.error || 'Не удалось загрузить вложение.');
  }

  return {
    url: data.url,
    name: data.name,
    type: data.type,
    size: data.size,
  };
}