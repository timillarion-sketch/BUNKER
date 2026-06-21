import { api, storage } from '@/core';
import { getUserId } from '@/core/constants';
import { ChatMessage } from './ChatStorageService';

const FALLBACK_REPLY = '[Персонаж временно недоступен. Попробуйте позже.]';
const TIMEOUT_MS = 30000;
const CONTEXT_WINDOW = 20;

export async function sendMessage(
  characterId: string,
  history: ChatMessage[],
  userText: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const contextMessages = history.slice(-CONTEXT_WINDOW).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    contextMessages.push({ role: 'user', content: userText });

    const userId = await getUserId(storage);

    const response = await api.request<{ reply: string }>(
      '/api/ai/chat',
      {
        method: 'POST',
        body: JSON.stringify({
          characterId,
          userId,
          messages: contextMessages,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    return response.reply ?? FALLBACK_REPLY;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('[AiCharacterService] sendMessage error:', e);
    return FALLBACK_REPLY;
  }
}
