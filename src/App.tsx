import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// --- MAIN APP CONTROLLER ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout (and Magic Link clicks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-bold tracking-tighter italic animate-pulse text-2xl">LOADING...</div>;

  // BOUNCER: Show Login if no session, otherwise show Dashboard
  return !session ? <LoginScreen /> : <Dashboard session={session} />;
}

// --- LOGIN COMPONENT ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) alert(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <h1 className="text-3xl font-black italic tracking-tighter mb-2">WC2026<span className="text-blue-500 text-xl ml-2 uppercase">Tracker</span></h1>
        <p className="text-slate-500 text-xs font-bold mb-8 uppercase tracking-widest">Singapore Syndicate</p>
        
        {sent ? (
          <div className="bg-blue-500/10 border border-blue-500/50 p-6 rounded-xl text-blue-300 text-sm text-center">
            <p className="font-bold mb-1">Check your email!</p>
            Magic link sent to <span className="text-white">{email}</span>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Email Address" required
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-blue-500 outline-none transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95">SEND MAGIC LINK</button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
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
    if (error) alert("Error joining. You might already have a profile!");
    else { setPlayerName(''); fetchData(); }
  };

  const handleBet = async (isWin: boolean) => {
    const amount = parseFloat(betAmount);
    const currentPlayer = players.find(p => p.user_id === session.user.id);
    
    if (!currentPlayer || !amount) return alert("Enter an amount!");

    const newBalance = isWin ? currentPlayer.balance + amount : currentPlayer.balance - amount;

    // 1. Update Balance
    const { error: pError } = await supabase.from('players').update({ balance: newBalance }).eq('user_id', session.user.id);
    
    // 2. Record Bet
    const { error: bError } = await supabase.from('bets').insert([
      { player_id: currentPlayer.id, match: betMatch, amount: amount, is_win: isWin }
    ]);

    if (!pError && !bError) {
        setBetAmount(''); setBetMatch(''); fetchData();
    } else {
        alert("Transaction failed. Check your database tables!");
    }
  };

  const myProfile = players.find(p => p.user_id === session.user.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10 mt-4">
          <h1 className="text-2xl font-black italic tracking-tighter">LEADERBOARD</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-slate-500 hover:text-white uppercase font-black tracking-widest border border-slate-800 px-3 py-1 rounded-full">Sign Out</button>
        </div>

        {/* --- JOIN FORM --- */}
        {!myProfile && (
          <div className="bg-blue-600 p-6 rounded-3xl mb-10 shadow-xl shadow-blue-600/10">
            <h2 className="font-black italic mb-3">FIRST TIME? JOIN THE CHALLENGE</h2>
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-blue-700 p-4 rounded-2xl outline-none placeholder:text-blue-300 font-bold" 
                placeholder="Enter Nickname" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
              />
              <button onClick={handleJoin} className="bg-white text-blue-600 px-8 rounded-2xl font-black hover:bg-slate-100 transition-all">JOIN</button>
            </div>
          </div>
        )}

        {/* --- THE LIST --- */}
        <div className="space-y-3 mb-24">
          {players.length === 0 && <p className="text-center text-slate-600 py-10 font-bold uppercase text-xs tracking-widest">No players yet...</p>}
          {players.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-5 rounded-2xl border ${p.user_id === session.user.id ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center">
                <span className={`w-6 text-sm font-black ${i === 0 ? 'text-yellow-500' : 'text-slate-600'}`}>{i+1}</span>
                <span className="font-black uppercase tracking-tight">{p.name} {p.user_id === session.user.id && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">YOU</span>}</span>
              </div>
              <span className={`font-mono font-black text-lg ${p.balance >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                ${p.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* --- BETTING DOCK --- */}
        {myProfile && (
          <div className="fixed bottom-6 left-6 right-6 max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl">
            <div className="flex gap-2 mb-3">
               <input 
                  className="flex-1 bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none focus:border-slate-500 transition-all" 
                  placeholder="Match (e.g. BRA vs GER)" value={betMatch} onChange={(e) => setBetMatch(e.target.value)}
                />
                <input 
                  className="w-24 bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none text-center font-bold" 
                  placeholder="$" type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleBet(true)} className="flex-1 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black shadow-lg shadow-green-600/20 active:scale-95 transition-all">WIN</button>
              <button onClick={() => handleBet(false)} className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all">LOSS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
