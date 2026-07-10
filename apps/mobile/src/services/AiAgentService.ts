import type { BunkerDataItem } from '@/data/bunkerData';
import { sendMessage } from './AiCharacterService';

export class AiAgent {
  readonly id: string;
  readonly name: string;
  readonly systemPrompt: string;

  constructor(item: BunkerDataItem) {
    this.id = String(item.row_number);
    this.name = item.title;
    this.systemPrompt = item.text;
  }

  async chat(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    return sendMessage(this.id, history, userMessage, this.systemPrompt);
  }
}

export function createAgentsFromData(items: BunkerDataItem[]): AiAgent[] {
  return items.map((item) => new AiAgent(item));
}
