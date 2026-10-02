import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, Sparkles, Leaf, AlertCircle, CheckCircle2,
  ArrowRight, Loader2, X,
} from 'lucide-react';
import { classifyWaste } from '@/lib/wasteClassifier';
import { categoryMeta } from '@/lib/categoryMeta';
import { getIndiaRule } from '@/lib/indiaRules';
import PhotoScanPanel from '@/components/PhotoScanPanel';
import NearbyCenters from '@/components/NearbyCenters';
import type { ClassificationResult, WasteCategory } from '@/lib/supabase';

interface SearchViewProps {
  onPointsUpdate: () => void;
}

export default function SearchView({ onPointsUpdate }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchedTerm, setSearchedTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClassify = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearchedTerm(trimmed);

    try {
      const res = await classifyWaste(trimmed);
      setResult(res);
      onPointsUpdate();
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...filtered].slice(0, 5);
      });
    } catch {
      setError('Something went wrong while classifying. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onPointsUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClassify(query);
  };

  const clearResult = () => {
    setResult(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const category = result?.item?.category ?? result?.guessedCategory;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Smart Waste Identification
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          What are you throwing away?
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Type any waste item below and EcoBin will instantly classify it and show you the right way to dispose of it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. banana peel, plastic bottle, old phone..."
            className="w-full pl-14 pr-32 py-4 text-base bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Classify
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {recentSearches.length > 0 && !result && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-gray-400">Recent:</span>
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); handleClassify(s); }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {result && category && (
        <ResultCard result={result} category={category} searchTerm={searchedTerm} onClose={clearResult} />
      )}

      {!result && !loading && !error && (
        <SuggestionGrid onPick={(item) => { setQuery(item); handleClassify(item); }} />
      )}

      <PhotoScanPanel
        onResult={(nextResult, searchTerm) => {
          setSearchedTerm(searchTerm);
          setResult(nextResult);
          onPointsUpdate();
        }}
      />
      <NearbyCenters />
    </div>
  );
}

function SuggestionGrid({ onPick }: { onPick: (item: string) => void }) {
  const suggestions = [
    'Banana peel', 'Plastic bottle', 'Old mobile phone', 'Cardboard box',
    'Coffee grounds', 'Dead batteries', 'Newspaper', 'Egg shells',
  ];
  return (
    <div className="mt-8">
      <p className="text-sm text-gray-400 mb-3 text-center">Try one of these:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  result, category, searchTerm, onClose,
}: {
  result: ClassificationResult;
  category: WasteCategory;
  searchTerm: string;
  onClose: () => void;
}) {
  const meta = categoryMeta[category];
  const indiaRule = getIndiaRule(category);
  const Icon = meta.icon;

  return (
    <div className="animate-fadeIn">
      <div className={`relative overflow-hidden bg-white rounded-3xl border-2 ${meta.borderColor} shadow-lg`}>
        <div className={`h-2 bg-gradient-to-r ${meta.gradient}`} />
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${meta.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${meta.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-0.5">Classification result for</p>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">{result.item?.name ?? searchTerm}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`p-5 rounded-2xl ${meta.bgColor} border ${meta.borderColor} mb-6`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${meta.color}`}>{meta.label}</span>
                <span className="text-sm text-gray-400">Waste</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <Leaf className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-700">+{result.pointsEarned} eco points</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{meta.description}</p>
          </div>

          {result.found && result.item ? (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Disposal Instructions</h3>
              <p className="text-gray-800 leading-relaxed">{result.item.disposal_instructions}</p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Not in our database — best guess</h3>
              </div>
              <p className="text-sm text-amber-700">
                We don't have this item in our catalog yet, but based on its characteristics, it's likely <strong>{meta.label}</strong> waste. When in doubt, check with your local waste management authority.
              </p>
            </div>
          )}

          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">India disposal guide</h3>
              <span className={`text-sm font-semibold ${indiaRule.binColor}`}>{indiaRule.binLabel}</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {indiaRule.steps.map((step) => <li key={step} className="flex gap-2"><span className="text-emerald-500">•</span><span>{step}</span></li>)}
            </ul>
            <p className="text-xs text-gray-400 mt-3">{indiaRule.note}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {result.found ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-500">Identified from EcoBin's waste catalog</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-gray-500">Estimated using smart keyword matching</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
