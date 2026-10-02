import type { WasteCategory } from './supabase';

export interface IndiaDisposalRule {
  category: WasteCategory;
  binLabel: string;
  binColor: string;
  steps: string[];
  note: string;
}

export const indiaRules: Record<WasteCategory, IndiaDisposalRule> = {
  Wet: {
    category: 'Wet',
    binLabel: 'Green bin',
    binColor: 'text-emerald-700',
    steps: [
      'Keep food and garden waste separate from all dry waste.',
      'Place it in your green wet-waste bin or home compost.',
      'Use a newspaper liner instead of a plastic bag where possible.',
    ],
    note: 'Based on India’s source-segregation approach under the Solid Waste Management Rules, 2016.',
  },
  Dry: {
    category: 'Dry',
    binLabel: 'Blue bin',
    binColor: 'text-blue-700',
    steps: [
      'Rinse and dry recyclable packaging before sorting it.',
      'Keep paper, plastic, metal, glass, and textiles separate from wet waste.',
      'Hand it to your municipal dry-waste collection or a registered kabadiwala.',
    ],
    note: 'Local municipal collection schedules and accepted materials can vary by city.',
  },
  'E-Waste': {
    category: 'E-Waste',
    binLabel: 'Authorised e-waste centre',
    binColor: 'text-amber-700',
    steps: [
      'Do not put electronics, batteries, bulbs, or chargers in household bins.',
      'Keep batteries and damaged devices safely isolated until drop-off.',
      'Use an authorised recycler or the manufacturer’s take-back programme.',
    ],
    note: 'India’s E-Waste (Management) Rules, 2022 require e-waste to move through authorised channels.',
  },
};

export function getIndiaRule(category: WasteCategory): IndiaDisposalRule {
  return indiaRules[category];
}
