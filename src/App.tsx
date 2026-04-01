import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
// Import your dashboard component (make sure the filename matches)
import WorldCupDashboard from './components/WorldCupDashboard'; 

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if a user is already logged in when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes (like clicking the "Accept Invite" link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple loading state while we check the "ID" of the visitor
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-500 font-black italic animate-pulse">VERIFYING SESSION...</div>
      </div>
    );
  }

  // IF NOT LOGGED IN: Show the Login Screen
  if (!session) {
    return <LoginScreen />;
  }

  // IF LOGGED IN: Show the actual App
  return <WorldCupDashboard session={session} />;
}

// --- LOGIN COMPONENT ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // This ensures they come back to your Vercel site, not localhost
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-sm shadow-2xl">
        <h1 className="text-white text-3xl font-black mb-2 uppercase tracking-tighter italic">
          WC2026<span className="text-blue-500 text-xl ml-2">TRACKER</span>
        </h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">SINGAPORE BETTING SYNDICATE</p>

        {sent ? (
          <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-lg text-blue-200 text-sm text-center">
            Check your email! We
