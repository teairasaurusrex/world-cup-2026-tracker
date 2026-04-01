import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Plus, X, Save, UserPlus, Users } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- Types ---
interface Player {
  id: number;
  name: string;
  balance: number;
}

const MATCHES = ["USA vs England", "Mexico vs Argentina", "Japan vs Spain", "Brazil vs France"];

export default function WorldCupDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  // Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(MATCHES[0]);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isWin, setIsWin] = useState(true);

  // 1. Load Players from Supabase
  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('balance', { ascending: false });
    
    if (data) {
      setPlayers(data);
      if (!currentPlayerId && data.length > 0) setCurrentPlayerId(data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlayers(); }, []);

  // 2. Add New Player (Join Game)
  const handleJoinGame = async () => {
    if (!newPlayerName.trim()) return;
    const { data, error } = await supabase
      .from('players')
      .insert([{ name: newPlayerName, balance: 100 }])
      .select();

    if (data) {
      setPlayers(prev => [...prev, data[0]].sort((a, b) => b.balance - a.balance));
      setCurrentPlayerId(data[0].id);
      setIsJoinModalOpen(false);
      setNewPlayerName('');
    }
  };

  // 3. Save Bet Result
  const handleAddBet = async () => {
    const numAmount = parseFloat(betAmount) || 0;
    const activePlayer = players.find(p => p.id === currentPlayerId);
    if (!numAmount || !activePlayer) return;

    const impact = isWin ? numAmount : -numAmount;
    const newBalance = activePlayer.balance + impact;

    // Update Database
    const { error: upError } = await supabase
      .from('players')
      .update({ balance: newBalance })
      .eq('id', activePlayer.id);

    if (!upError) {
      await supabase.from('bets').insert([{
        player_id: activePlayer.id,
        match: selectedMatch,
        amount: numAmount,
        is_win: isWin
      }]);

      // Refresh local UI
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, balance: newBalance } : p)
        .sort((a, b) => b.balance - a.balance)
      );
      setIsModalOpen(false);
      setBetAmount('');
    }
  };

  const activeUser = players.find(p => p.id === currentPlayerId);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-blue-500 font-black italic text-2xl">LOADING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 pb-24">
      {/* Header */}
      <header className="py-6 flex justify-between items-center border-b border-slate-900 mb-6">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">WC2026.SGD</h1>
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="text-[10px] text-slate-500 uppercase flex items-center gap-1 hover:text-blue-400 transition-colors"
          >
            <UserPlus size={10} /> Join Challenge
          </button>
        </div>
        <div className="text-right">
          <select 
            className="bg-transparent text-right outline-none text-xs font-bold text-slate-400 uppercase"
            value={currentPlayerId || ''}
            onChange={(e) => setCurrentPlayerId(Number(e.target.value))}
          >
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="text-xl font-mono font-bold text-white">
            ${activeUser?.balance.toFixed(2) || '0.00'}
          </p>
        </div>
      </header>

      {/* Leaderboard Section */}
      {players.length > 2 ? (
        <section className="flex items-end justify-center gap-2 mb-8 h-40">
          {[players[1], players[0], players[2]].map((p, i) => (
            <div key={p.id} className={`flex-1 rounded-t-2xl flex flex-col items-center justify-end pb-4 transition-all duration-500 ${
              i === 1 ? 'h-full bg-blue-600/20 border-t-4 border-blue-500' : 'h-[75%] bg-slate-900 border-t-4 border-slate-700'
            }`}>
              {i === 1 && <Trophy size={20} className="text-yellow-500 mb-2" />}
              <p className="text-xs font-bold truncate w-20 text-center">{p.name}</p>
              <p className="font-mono text-sm font-black">${p.balance.toFixed(0)}</p>
            </div>
          ))}
        </section>
      ) : (
        <div className="bg-slate-900/40 p-8 rounded-3xl border border-dashed border-slate-800 text-center mb-8">
          <Users className="mx-auto text-slate-700 mb-2" />
          <p className="text-slate-500 text-sm italic">Waiting for more players to join...</p>
        </div>
      )}

      {/* Chasers List */}
      <section className="space-y-2">
        <h3 className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-widest">Full Leaderboard</h3>
        {players.map((p, idx) => (
          <div key={p.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${
            p.id === currentPlayerId ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/50 border-slate-800'
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-black italic">#{idx + 1}</span>
              <span className="font-semibold">{p.name}</span>
            </div>
            <p className="font-mono font-bold">${p.balance.toFixed(2)}</p>
          </div>
        ))}
      </section>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl z-20 active:scale-90 transition-transform"
      >
        <Plus size={32} />
      </button>

      {/* MODAL: Join Game */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-6">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-slate-700">
            <h2 className="text-xl font-black italic uppercase mb-4">Join Challenge</h2>
            <input 
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none mb-4"
              placeholder="Enter your name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setIsJoinModalOpen(false)} className="flex-1 p-4 text-slate-500 font-bold">CANCEL</button>
              <button onClick={handleJoinGame} className="flex-1 bg-blue-600 p-4 rounded-xl font-black">START</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Bet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl border-t border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase">Log Result for {activeUser?.name}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500"><X /></button>
            </div>

            <div className="space-y-6">
              <select 
                className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white"
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
              >
                {MATCHES.map(m => <option key={m}>{m}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsWin(true)}
                  className={`p-4 rounded-xl font-black transition-colors ${isWin ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-500'}`}
                >WIN</button>
                <button 
                  onClick={() => setIsWin(false)}
                  className={`p-4 rounded-xl font-black transition-colors ${!isWin ? 'bg-rose-500 text-white' : 'bg-slate-950 text-slate-500'}`}
                >LOSS</button>
              </div>

              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Stake Amount</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-transparent text-center text-5xl font-mono font-bold outline-none text-white border-b border-slate-800 pb-4"
                />
              </div>

              <button 
                onClick={handleAddBet}
                className="w-full bg-blue-600 p-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-900/40"
              >
                SAVE RESULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
