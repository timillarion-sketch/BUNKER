import { storage, API_URL } from '@/core';
import { getUserId } from '@/core/constants';
import { fetchWithRetry } from '@/core/network';

const TIMEOUT_MS = 60000;
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

    const [userId, token] = await Promise.all([
      getUserId(storage),
      storage.get('bunker_access_token'),
    ]);

    console.log('[DEBUG_AI] token present:', !!token);
    console.log('[DEBUG_AI] characterId:', characterId);
    console.log('[DEBUG_AI] userId:', userId);
    console.log('[DEBUG_AI] message count:', contextMessages.length);
    if (contextMessages.length > 0) {
      console.log('[DEBUG_AI] last message role:', contextMessages[contextMessages.length - 1].role);
    }

    console.log('[DEBUG_AI] URL:', `${API_URL}/api/ai/chat`);
    console.log('[DEBUG_AI] systemPrompt:', systemPrompt);
    console.log('[DEBUG_AI] userMessage:', userText);

    const response = await fetchWithRetry(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        characterId,
        userId,
        messages: contextMessages,
      }),
      signal: controller.signal,
    }, 0);

    clearTimeout(timeoutId);

    console.log('[DEBUG_AI] response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[DEBUG_AI] HTTP error:', response.status, errorBody);
      return FALLBACK_REPLY;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0 && data[0]?.reply) {
      const reply = data[0].reply;
      console.log('[DEBUG_AI] response ok, reply length:', reply.length);
      return reply;
    }
    if (data?.reply) {
      const reply = data.reply;
      console.log('[DEBUG_AI] response ok, reply length:', reply.length);
      return reply;
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
