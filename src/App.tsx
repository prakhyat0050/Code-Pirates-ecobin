import { useState, useEffect, useCallback } from 'react';
import { Search, LayoutDashboard, Rocket, Leaf } from 'lucide-react';
import SearchView from '@/components/SearchView';
import Dashboard from '@/components/Dashboard';
import FutureScope from '@/components/FutureScope';
import { getTotalPoints } from '@/lib/wasteClassifier';

const ecoBinMark = `${import.meta.env.BASE_URL}ecobin-mark.svg`;

type View = 'search' | 'dashboard' | 'future';

const navItems: { id: View; label: string; icon: typeof Search }[] = [
  { id: 'search', label: 'Identify', icon: Search },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'future', label: 'Future', icon: Rocket },
];

export default function App() {
  const [view, setView] = useState<View>('search');
  const [totalPoints, setTotalPoints] = useState(0);

  const refreshPoints = useCallback(async () => {
    const pts = await getTotalPoints();
    setTotalPoints(pts);
  }, []);

  useEffect(() => {
    refreshPoints();
  }, [refreshPoints]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setView('search')}
            className="flex items-center gap-2.5 group"
            aria-label="EcoBin home"
          >
            <img src={ecoBinMark} alt="" className="w-9 h-9 group-hover:scale-105 transition-transform" />
            <div className="text-left">
              <span className="font-bold text-lg text-gray-900 tracking-tight">EcoBin</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-1.5">Smart Waste Assistant</span>
            </div>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}

            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-100">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-gray-700 tabular-nums">{totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        {view === 'search' && <SearchView onPointsUpdate={refreshPoints} />}
        {view === 'dashboard' && <Dashboard />}
        {view === 'future' && <FutureScope />}
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm text-gray-400">
            <img src={ecoBinMark} alt="" className="w-9 h-9" />
            <span className="font-bold text-lg text-gray-900 tracking-tight">EcoBin</span>
            <span>Making waste disposal smarter, one item at a time.</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-400 hidden sm:block">Built for a greener tomorrow</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
