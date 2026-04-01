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
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500 font-bold">LOADING...</div>;

  // Show Login if no session, otherwise show Dashboard
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
          <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-xl text-blue-300 text-sm">
            Magic link sent! Check your email to sign in.
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" placeholder="Email Address" required
              className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:border-blue-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black transition-all">SEND MAGIC LINK</button>
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

  // 1. Fetch data from Supabase
  const fetchData = async () => {
    const { data } = await supabase.from('players').select('*').order('balance', { ascending: false });
    if (data) setPlayers(data);
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Logic to Join the Leaderboard
  const handleJoin = async () => {
    const { error } = await supabase.from('players').insert([
      { name: playerName, balance: 100, user_id: session.user.id }
    ]);
    if (error) alert("Error joining. You
