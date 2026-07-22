import { api } from '@/core';

const TIMEOUT_MS = 95000;
const CONTEXT_WINDOW = 20;

const FALLBACK_REPLY = '[Персонаж временно недоступен. Попробуйте позже.]';

interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendMessage(
  characterId: string,
  history: AiMessage[],
  userText: string,
  systemPrompt?: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (systemPrompt) {
      systemPrompt += "\n\nCRITICAL DIRECTIVE: You must respond STRICTLY in the exact language the user writes in. Never mix languages. If the user writes in Russian, respond entirely in Russian. Maintain your persona, but language consistency is your absolute highest priority.";
    }

    const contextMessages: AiMessage[] = [];

    if (systemPrompt) {
      contextMessages.push({ role: 'system', content: systemPrompt });
    }

    const sliced = history.slice(-(CONTEXT_WINDOW - (systemPrompt ? 1 : 0)));
    contextMessages.push(...sliced);
    contextMessages.push({ role: 'user', content: userText });

    const data = await api.request<{ reply: string } | { reply: string }[]>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        characterId,
        messages: contextMessages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (Array.isArray(data) && data.length > 0 && data[0]?.reply) {
      return data[0].reply;
    }
    if (data?.reply) {
      return data.reply;
    }
    throw new Error(`[AI_CHAT_ERROR] Invalid response: ${JSON.stringify(data)}`);
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('[AI_CHAT_TIMEOUT] Request timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.error('[AI_CHAT_ERROR]', e instanceof Error ? e.message : String(e), e);
    }
    return FALLBACK_REPLY;
  }
}
