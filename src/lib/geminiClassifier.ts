import type { WasteCategory } from './supabase.ts';
import { supabase } from './supabase.ts';

export interface GeminiClassification {
  name: string;
  category: WasteCategory;
  confidence: number;
  disposalInstructions: string;
  indiaTip: string;
  alternatives: string[];
}

export async function classifyWithGemini(input: { itemName?: string; imageBase64?: string; mimeType?: string }): Promise<GeminiClassification | null> {
  const { data, error } = await supabase.functions.invoke('gemini-classify', { body: input });
  if (error || !data || !isClassification(data)) return null;
  return data;
}

function isClassification(value: unknown): value is GeminiClassification {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === 'string'
    && (candidate.category === 'Wet' || candidate.category === 'Dry' || candidate.category === 'E-Waste')
    && typeof candidate.confidence === 'number'
    && typeof candidate.disposalInstructions === 'string'
    && typeof candidate.indiaTip === 'string'
    && Array.isArray(candidate.alternatives);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
      resolve(value);
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}
