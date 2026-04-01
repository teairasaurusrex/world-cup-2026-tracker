import React, { useState, useMemo } from 'react';
import { Trophy, Plus, ArrowUpRight, ArrowDownRight, X, Save, TrendingUp } from 'lucide-react';

// --- Types ---
interface Player {
  id: number;
  name: string;
  balance: number;
  history: Bet[];
}

interface Bet {
  match: string;
  amount: number;
  isWin: boolean;
  timestamp: Date;
}

// --- Initial Mock Data (7 Friends) ---
const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'User', balance: 100, history: [] },
  { id: 2, name: 'Sarah', balance: 105.50, history: [] },
  { id: 3, name: 'John', balance: 80.00, history: [] },
  { id: 4, name: 'Wei Ming', balance: 120.00, history: [] },
  { id: 5, name: 'Arjun', balance: 95.00, history: [] },
  { id: 6, name: 'Fatimah', balance: 110.00, history: [] },
  { id: 7, name: 'Marcus', balance: 65.00, history: [] },
];

const MATCHES = ["USA vs England", "Mexico vs Argentina", "Japan vs Spain", "Brazil vs France"];

export default function WorldCupDashboard() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [selectedMatch, setSelectedMatch] = useState(MATCHES[0]);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isWin, setIsWin] = useState(true);

  // --- Logic ---
  const sortedPlayers = useMemo(() => 
    [...players].sort((a, b) => b.balance - a.balance), 
  [players]);

  const handleAddBet = () => {
    const numAmount = parseFloat(betAmount) || 0;
    if (numAmount <= 0) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === 1) { // Updating "Your" balance for the demo
        const impact = isWin ? numAmount : -numAmount;
        return {
          ...p,
          balance: p.balance + impact,
          history: [{ match: selectedMatch, amount: numAmount, isWin, timestamp: new Date() }, ...p.history]
        };
      }
      return p;
    }));

    setIsModalOpen(false);
    setBetAmount('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 pb-24">
      {/* Header */}
      <header className="py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">WC2026.SGD</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">The $100 Experiment</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Your Balance</p>
          <p className="text-xl font-mono font-bold text-white">${players[0].balance.toFixed(2)}</p>
        </div>
      </header>

      {/* Podium (Top 3) */}
      <section className="flex items-end justify-center gap-2 mb-8 h-40">
        {[sortedPlayers[1], sortedPlayers[0], sortedPlayers[2]].map((p, i) => (
          <div key={p.id} className={`flex-1 rounded-t-2xl flex flex-col items-center justify-end pb-4 transition-all duration-500 ${
            i === 1 ? 'h-full bg-blue-600/20 border-t-4 border-blue-500' : 'h-[75%] bg-slate-900 border-t-4 border-slate-700'
          }`}>
            {i === 1 && <Trophy size={20} className="text-yellow-500 mb-2" />}
            <p className="text-xs font-bold truncate w-20 text-center">{p.name}</p>
            <p className="font-mono text-sm font-black">${p.balance.toFixed(0)}</p>
          </div>
        ))}
      </section>

      {/* The Rest (Ranks 4-7) */}
      <section className="space-y-2 mb-8">
        <h3 className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">Mid-Pack & Chasers</h3>
        {sortedPlayers.slice(3).map((p, idx) => (
          <div key={p.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic">#{idx + 4}</span>
              <span className="font-semibold">{p.name}</span>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold">${p.balance.toFixed(2)}</p>
              <p className={`text-[10px] ${p.balance < 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {p.balance < 100 ? 'IN RED' : 'PROFIT'}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl shadow-blue-500/40 z-20 active:scale-90 transition-transform"
      >
        <Plus size={32} />
      </button>

      {/* Modal / Input Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl border-t border-slate-700 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Add Result</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500"><X /></button>
            </div>

            <div className="space-y-6">
              {/* Match Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Fixture</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none"
                  value={selectedMatch}
                  onChange={(e) => setSelectedMatch(e.target.value)}
                >
                  {MATCHES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Toggle Win/Loss */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsWin(true)}
                  className={`p-4 rounded-xl font-black ${isWin ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-500'}`}
                >WIN</button>
                <button 
                  onClick={() => setIsWin(false)}
                  className={`p-4 rounded-xl font-black ${!isWin ? 'bg-rose-500 text-white' : 'bg-slate-950 text-slate-500'}`}
                >LOSS</button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 text-center">Amount to Tally</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-transparent text-center text-5xl font-mono font-bold outline-none text-white border-b border-slate-800 pb-4 focus:border-blue-500"
                />
              </div>

              {/* Final Balance Preview */}
              <div className="bg-black/40 p-4 rounded-2xl flex justify-between items-center border border-slate-800">
                <span className="text-sm text-slate-400 font-medium tracking-tight">New Balance</span>
                <span className="text-xl font-mono font-black text-blue-400">
                  ${(players[0].balance + (isWin ? (parseFloat(betAmount) || 0) : -(parseFloat(betAmount) || 0))).toFixed(2)}
                </span>
              </div>

              <button 
                onClick={handleAddBet}
                className="w-full bg-blue-600 p-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/40"
              >
                <Save size={20} /> SAVE RESULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
