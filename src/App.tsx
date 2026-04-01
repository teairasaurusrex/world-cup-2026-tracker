import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// --- MAIN APP ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-black italic animate-pulse">VERIFYING...</div>;

  return !session ? <LoginScreen /> : <Dashboard session={session} />;
}

// --- LOGIN SCREEN (Password Version) ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (isSignUp: boolean) => {
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black italic tracking-tighter mb-2 italic uppercase">WC2026<span className="text-blue-500 text-xl ml-2 tracking-normal italic uppercase">Tracker</span></h1>
        <p className="text-slate-500 text-[10px] font-black mb-8 uppercase tracking-[0.2em] text-center opacity-50">Singapore Syndicate</p>
        
        <div className="space-y-3">
          <input 
            type="email" placeholder="Email"
            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password (Min 6 chars)"
            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="flex gap-2 pt-4">
            <button onClick={() => handleAuth(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest border border-slate-700">Login</button>
            <button onClick={() => handleAuth(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest shadow-lg shadow-blue-600/20">Sign Up</button>
          </div>
        </div>
        <p className="text-[9px] text-slate-600 mt-8 text-center font-bold uppercase tracking-widest">No email confirmation required</p>
      </div>
    </div>
  );
}

// --- DASHBOARD (Leaderboard & Bets) ---
function Dashboard({ session }: { session: any }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [betMatch, setBetMatch] = useState('');

  const fetchData = async () => {
    const { data } = await supabase.from('players').select('*').order('balance', { ascending: false });
    if (data) setPlayers(data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleJoin = async () => {
    if (!playerName) return;
    const { error } = await supabase.from('players').insert([
      { name: playerName, balance: 100, user_id: session.user.id }
    ]);
    if (error) alert("Error joining challenge.");
    else { setPlayerName(''); fetchData(); }
  };

  const handleBet = async (isWin: boolean) => {
    const amount = parseFloat(betAmount);
    const currentPlayer = players.find(p => p.user_id === session.user.id);
    if (!currentPlayer || !amount) return alert("Enter amount!");

    const newBalance = isWin ? currentPlayer.balance + amount : currentPlayer.balance - amount;

    await supabase.from('players').update({ balance: newBalance }).eq('user_id', session.user.id);
    await supabase.from('bets').insert([{ player_id: currentPlayer.id, match: betMatch, amount: amount, is_win: isWin }]);

    setBetAmount(''); setBetMatch(''); fetchData();
  };

  const myProfile = players.find(p => p.user_id === session.user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10 mt-4">
          <h1 className="text-2xl font-black italic tracking-tighter">LEADERBOARD</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-slate-500 hover:text-white uppercase font-black tracking-widest border border-slate-800 px-3 py-1 rounded-full">Sign Out</button>
        </div>

        {!myProfile && (
          <div className="bg-blue-600 p-6 rounded-3xl mb-10">
            <h2 className="font-black italic mb-3 uppercase">Enter Your Nickname</h2>
            <div className="flex gap-2">
              <input className="flex-1 bg-blue-700 p-4 rounded-2xl outline-none font-bold" placeholder="e.g. BettingKing" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              <button onClick={handleJoin} className="bg-white text-blue-600 px-8 rounded-2xl font-black">JOIN</button>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-24">
          {players.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-5 rounded-2xl border ${p.user_id === session.user.id ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-900 border-slate-800'}`}>
              <span className="font-black uppercase tracking-tight"><span className="text-slate-600 mr-3">{i+1}</span>{p.name}</span>
              <span className={`font-mono font-black text-lg ${p.balance >= 100 ? 'text-green-400' : 'text-red-400'}`}>${p.balance.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {myProfile && (
          <div className="fixed bottom-6 left-6 right-6 max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl">
            <div className="flex gap-2 mb-3">
               <input className="flex-1 bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none" placeholder="Match (e.g. JPN vs ESP)" value={betMatch} onChange={(e) => setBetMatch(e.target.value)} />
               <input className="w-24 bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none text-center font-bold" placeholder="$" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleBet(true)} className="flex-1 bg-green-600 py-4 rounded-2xl font-black transition-all">WIN</button>
              <button onClick={() => handleBet(false)} className="flex-1 bg-red-600 py-4 rounded-2xl font-black transition-all">LOSS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
