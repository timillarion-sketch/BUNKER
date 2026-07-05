export interface BunkerDataItem {
  row_number: number;
  category: string;
  title: string;
  text: string;
  active: boolean;
}

export const CONTENT_CATEGORIES = ['ideas', 'posts'] as const;
export const AI_CATEGORIES = ['ai_character', 'prompts'] as const;

export interface FilteredBunkerData {
  contentItems: BunkerDataItem[];
  aiCharacterItems: BunkerDataItem[];
}
