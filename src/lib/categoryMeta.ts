import type { WasteCategory } from './supabase';
import { Droplets, Recycle, Cpu, type LucideIcon } from 'lucide-react';

export interface CategoryMeta {
  label: WasteCategory;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  description: string;
  gradient: string;
}

export const categoryMeta: Record<WasteCategory, CategoryMeta> = {
  'Wet': {
    label: 'Wet',
    icon: Droplets,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    accentColor: 'emerald',
    description: 'Biodegradable organic waste that can be composted',
    gradient: 'from-emerald-500 to-teal-600',
  },
  'Dry': {
    label: 'Dry',
    icon: Recycle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    accentColor: 'blue',
    description: 'Recyclable materials that can be reprocessed',
    gradient: 'from-blue-500 to-cyan-600',
  },
  'E-Waste': {
    label: 'E-Waste',
    icon: Cpu,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    accentColor: 'amber',
    description: 'Electronic waste requiring specialized recycling',
    gradient: 'from-amber-500 to-orange-600',
  },
};
