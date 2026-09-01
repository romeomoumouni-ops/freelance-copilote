"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthModal, { type AuthView } from "@/components/auth/AuthModal";
import { IconRefresh } from "@/components/icons";
import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <IconRefresh size={22} className="animate-spin text-ink-mute" />
      </div>
    );
  }

  /* Pas connecté : portail d'accès, pas d'espace membre. */
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-white p-8 text-center shadow-[8px_8px_0_0_#FFEE66]">
          <Link href="/" className="text-[19px] font-extrabold tracking-tight text-ink">
            Freelance{" "}
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-0.5 h-[9px] rounded-sm bg-brand" />
              <span className="relative">Copilote</span>
            </span>
          </Link>
          <h1 className="mt-5 text-[20px] font-extrabold text-ink">Ton espace t&apos;attend</h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-soft">
            Connecte-toi pour retrouver tes prospects, tes campagnes et tes réponses.
          </p>
          <button
            onClick={() => setAuthView("login")}
            className="mt-6 w-full rounded-2xl bg-royal px-6 py-3.5 text-[14.5px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,0.7)] transition-all hover:bg-royal-dark active:scale-[0.99]"
          >
            Me connecter
          </button>
          <button
            onClick={() => setAuthView("signup")}
            className="mt-3 w-full rounded-2xl bg-brand px-6 py-3.5 text-[14px] font-bold text-ink transition-all hover:bg-primary-400 active:scale-[0.99]"
          >
            Je suis nouveau, je veux m&apos;inscrire
          </button>
          <Link href="/" className="mt-4 inline-block text-[12.5px] font-semibold text-ink-mute hover:text-ink">
            Retour à l&apos;accueil
          </Link>
        </div>
        <AuthModal open={authView !== null} view={authView ?? "login"} onClose={() => setAuthView(null)} />
      </main>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="lg:pl-[268px]">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
