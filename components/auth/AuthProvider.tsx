"use client";

/* Contexte d'authentification : session Supabase, inscription,
   connexion, déconnexion. Enveloppe toute l'app (landing comprise,
   pour que les CTA sachent si on est déjà connecté). */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { cacheAuthToken, getAuthClient } from "@/lib/auth/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<{ needsConfirm: boolean }>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signUp: async () => ({ needsConfirm: false }),
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function frenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirme d'abord ton adresse : un e-mail t'a été envoyé.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.";
  if (m.includes("at least 6")) return "Ton mot de passe doit faire au moins 6 caractères.";
  if (m.includes("rate limit")) return "Trop de tentatives : attends une minute et réessaie.";
  if (m.includes("invalid email") || m.includes("validate email")) return "Cette adresse e-mail ne semble pas valide.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getAuthClient();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      cacheAuthToken(data.session?.access_token);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      cacheAuthToken(session?.access_token);
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const sb = getAuthClient();
    if (!sb) throw new Error("Connexion au service impossible. Réessaie dans un instant.");
    // Création côté serveur (compte déjà confirmé), puis connexion directe.
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Inscription impossible. Réessaie.");
    if (data.needsConfirm) return { needsConfirm: true };
    // repli sans service d'e-mail : connexion directe
    const { data: login, error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(frenchAuthError(error.message));
    cacheAuthToken(login.session?.access_token);
    setUser(login.user);
    return { needsConfirm: false };
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const sb = getAuthClient();
    if (!sb) throw new Error("Connexion au service impossible. Réessaie dans un instant.");
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(frenchAuthError(error.message));
    cacheAuthToken(data.session?.access_token);
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    const sb = getAuthClient();
    if (sb) await sb.auth.signOut();
    cacheAuthToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
}
