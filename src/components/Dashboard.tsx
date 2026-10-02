import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3, Crown, History, Leaf, Loader2, Medal, Recycle, Save, ShieldCheck, Trophy,
} from 'lucide-react';
import { categoryMeta } from '@/lib/categoryMeta';
import {
  getActivityHistory, getActivityStats, getLeaderboard, getTotalPoints,
} from '@/lib/wasteClassifier';
import type { LeaderboardEntry } from '@/lib/wasteClassifier';
import type { UserActivity, WasteCategory } from '@/lib/supabase';

export default function Dashboard() {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<UserActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0, byCategory: { Wet: 0, Dry: 0, 'E-Waste': 0 } as Record<WasteCategory, number> });
  const [nickname, setNickname] = useState(() => localStorage.getItem('ecobin-player-name') ?? 'Eco Explorer');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [pts, hist, sts, board] = await Promise.all([
      getTotalPoints(), getActivityHistory(20), getActivityStats(), getLeaderboard(),
    ]);
    setPoints(pts);
    setHistory(hist);
    setStats(sts);
    setLeaderboard(board);
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const saveNickname = () => {
    const safeName = nickname.trim().slice(0, 30) || 'Eco Explorer';
    localStorage.setItem('ecobin-player-name', safeName);
    setNickname(safeName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (loading) return <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" /><p className="text-gray-400">Loading your impact dashboard...</p></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-4"><Trophy className="w-4 h-4" /> EcoBin community challenge</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your impact dashboard</h1>
        <p className="text-gray-500">Turn everyday sorting into visible progress for a cleaner India.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ImpactCard icon={<Trophy />} label="Eco points" value={points.toLocaleString()} accent="from-emerald-500 to-teal-600" />
        <ImpactCard icon={<BarChart3 />} label="Accuracy" value={`${accuracy}%`} accent="from-blue-500 to-cyan-600" />
        <ImpactCard icon={<Recycle />} label="Items sorted" value={stats.total.toString()} accent="from-amber-500 to-orange-600" />
        <ImpactCard icon={<Leaf />} label="E-waste diverted" value={(stats.byCategory['E-Waste'] * 0.25).toFixed(1) + ' kg*'} accent="from-slate-600 to-slate-800" />
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="font-bold text-gray-900">Community leaderboard</h2><p className="text-sm text-gray-400 mt-1">Top public EcoBin contributors</p></div><Crown className="w-5 h-5 text-amber-500" /></div>
          {leaderboard.length ? <div className="space-y-2">{leaderboard.map((entry, index) => <LeaderboardRow key={entry.playerName} entry={entry} index={index} current={entry.playerName === nickname} />)}</div> : <EmptyState text="Start sorting to appear here." />}
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Public demo leaderboard. Nicknames are not verified accounts.</p>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Medal className="w-5 h-5 text-amber-300" /><h2 className="font-bold">Your player card</h2></div>
          <p className="text-sm text-slate-300 mb-5">Choose a nickname for the community leaderboard.</p>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Display name</label>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={30} className="mt-2 w-full px-3 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400" />
          <button type="button" onClick={saveNickname} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"><Save className="w-4 h-4" />{saved ? 'Saved' : 'Save nickname'}</button>
          <div className="mt-6 pt-5 border-t border-slate-700 grid grid-cols-2 gap-3"><div><p className="text-2xl font-bold">{stats.correct}</p><p className="text-xs text-slate-400">Correct calls</p></div><div><p className="text-2xl font-bold">{points}</p><p className="text-xs text-slate-400">Total points</p></div></div>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8"><div className="flex items-center gap-2 mb-5"><BarChart3 className="w-5 h-5 text-emerald-600" /><h2 className="font-bold text-gray-900">Material impact</h2></div><div className="grid md:grid-cols-3 gap-4">{(['Wet', 'Dry', 'E-Waste'] as WasteCategory[]).map((category) => { const meta = categoryMeta[category]; const Icon = meta.icon; const count = stats.byCategory[category] ?? 0; const percent = stats.total ? Math.round((count / stats.total) * 100) : 0; return <div key={category} className={`p-4 rounded-xl ${meta.bgColor} border ${meta.borderColor}`}><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${meta.color}`} /><span className={`font-semibold ${meta.color}`}>{category}</span></div><span className="text-sm font-bold text-gray-600">{count}</span></div><div className="h-2 bg-white/80 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${meta.gradient}`} style={{ width: `${percent}%` }} /></div><p className="text-xs text-gray-400 mt-2">{percent}% of classifications</p></div>; })}</div><p className="text-xs text-gray-400 mt-4">*Impact estimate uses a conservative 250 g average per e-waste item and is for demo storytelling.</p></section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"><div className="flex items-center gap-2 p-5 border-b border-gray-100"><History className="w-5 h-5 text-gray-400" /><h2 className="font-bold text-gray-900">Recent activity</h2></div>{history.length ? <div className="divide-y divide-gray-50">{history.map((entry) => { const meta = categoryMeta[entry.category]; const Icon = meta.icon; return <div key={entry.id} className="flex items-center gap-3 p-4"><div className={`w-9 h-9 rounded-lg ${meta.bgColor} flex items-center justify-center`}><Icon className={`w-4 h-4 ${meta.color}`} /></div><div className="flex-1 min-w-0"><p className="font-medium text-gray-900 capitalize truncate">{entry.item_name}</p><p className="text-xs text-gray-400">{entry.player_name} · {entry.source === 'image' ? 'photo scan' : 'text search'}</p></div><span className="text-sm font-bold text-emerald-700">+{entry.points_earned}</span></div>; })}</div> : <EmptyState text="Your classification history will appear here." />}</section>
    </div>
  );
}

function ImpactCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) { return <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center mb-3`}>{icon}</div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-400">{label}</p></div>; }
function LeaderboardRow({ entry, index, current }: { entry: LeaderboardEntry; index: number; current: boolean }) { return <div className={`flex items-center gap-3 p-3 rounded-xl ${current ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'}`}><div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-500'}`}>{index + 1}</div><div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 truncate">{entry.playerName}{current && <span className="ml-2 text-xs text-emerald-600">You</span>}</p><p className="text-xs text-gray-400">{entry.items} items · {entry.correct} correct</p></div><span className="font-bold text-emerald-700">{entry.points} pts</span></div>; }
function EmptyState({ text }: { text: string }) { return <div className="py-8 text-center text-sm text-gray-400">{text}</div>; }
