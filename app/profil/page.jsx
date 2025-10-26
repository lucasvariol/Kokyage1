"use client";

import Header from '../_components/Header';
import Footer from '../_components/Footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { user } = session;
        setUser(user);
      }
    };
    fetchProfile();
    // Écoute les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <>
      <Header />
      <main>
        <h1>Mon Profil</h1>
        {!user ? (
          <p>
            Non connecté. <a href="/connexion">Se connecter</a>
          </p>
        ) : (
          <>
            <p>Bienvenue, {user.user_metadata?.name || user.email} !</p>
            <p>Rôle : {user.user_metadata?.role || '—'}</p>
            <button className="btn" onClick={handleLogout}>Se déconnecter</button>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}