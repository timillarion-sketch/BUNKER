import { api } from '@/core';
import type { AttachmentMeta } from './uploadAttachment';

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
  attachments?: AttachmentMeta[],
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const contextMessages: AiMessage[] = [];

    const sliced = history.slice(-CONTEXT_WINDOW);
    contextMessages.push(...sliced);

    const attachmentLines = (attachments ?? [])
      .map(a => `[Вложение: ${a.name} (${a.url})]`);
    const fullText = userText || attachmentLines.join('\n');
    const llmText = attachmentLines.length > 0
      ? `${fullText}${fullText ? '\n' : ''}${attachmentLines.join('\n')}`
      : fullText;

    contextMessages.push({ role: 'user', content: llmText });

    const data = await api.request<{ reply: string } | { reply: string }[]>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        characterId,
        messages: contextMessages,
        ...(attachments && attachments.length > 0
          ? { attachments: attachments.map(({ url, name }) => ({ url, name })) }
          : {}),
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
