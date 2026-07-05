import { api } from '@/core';

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  prompt: string;
}

export const TAB_CATEGORIES = [
  { label: 'ВСЕ', filter: null },
  { label: 'ВИДЕО', filter: 'VIDEO' },
  { label: 'ФОТО', filter: 'PHOTO' },
  { label: 'БИЗНЕС', filter: 'BUSINESS' },
  { label: 'СОЦСЕТИ', filter: 'SOCIAL' },
];

const STATIC_FALLBACKS: PromptTemplate[] = [
  {
    id: 'fallback_video',
    title: 'ВИРУСНЫЙ REELS',
    category: 'VIDEO',
    description: 'Сценарий 60-секундного Reels с хуком и призывом к действию',
    icon: '🎬',
    prompt: 'Напиши сценарий для вирусного Reels/TikTok на тему [ТВОЯ ТЕМА]. Длительность: до 60 секунд. Структура:\n1. Сильный хук (первые 3 секунды).\n2. 3 быстрых совета без воды.\n3. Смена динамики каждые 5 секунд.\n4. Четкий CTA в конце.',
  },
  {
    id: 'fallback_photo',
    title: 'КИНО-ФОТО',
    category: 'PHOTO',
    description: 'Кинематографичный снимок с освещением Rembrandt',
    icon: '📷',
    prompt: 'Cinematic full-body shot, golden hour, Rembrandt lighting, 35mm lens, f/1.8, photorealistic, 8k, cyber-noir aesthetic.',
  },
  {
    id: 'fallback_business',
    title: 'КОНТЕНТ-ПЛАН',
    category: 'BUSINESS',
    description: '30-дневный план публикаций для Instagram и TikTok',
    icon: '📊',
    prompt: 'Составь контент-план на 30 дней для ниши [ТВОЯ НИША]. Пропорция: 50% полезный, 30% вовлекающий, 20% продающий.',
  },
  {
    id: 'fallback_social',
    title: 'BIO СОЦСЕТЕЙ',
    category: 'SOCIAL',
    description: 'Цепляющая биография с ключевыми словами и CTA',
    icon: '📱',
    prompt: 'Создай 5 вариантов продающего описания профиля (BIO) для Instagram/Telegram на тему [ТВОЙ БЛОГ/БИЗНЕС]. До 150 символов.',
  },
];

export async function fetchTemplates(): Promise<PromptTemplate[]> {
  try {
    const data = await api.get<PromptTemplate[]>('/api/templates');
    if (data && data.length > 0) return data;
    return STATIC_FALLBACKS;
  } catch {
    return STATIC_FALLBACKS;
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const data = await api.get<string[]>('/api/templates/categories');
    if (data && data.length > 0) return data;
    return ['VIDEO', 'PHOTO', 'BUSINESS', 'SOCIAL'];
  } catch {
    return ['VIDEO', 'PHOTO', 'BUSINESS', 'SOCIAL'];
  }
}
