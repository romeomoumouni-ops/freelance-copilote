"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { analyzeProfile, type AnalyzeResult, type ProfileAnalysis } from "@/lib/client";

const KEY = "fc.analysis.v2";
export const HIST_KEY = "fc.history.v1";

export interface HistoryPoint {
  at: string;
  url: string;
  globalScore: number;
  marketMedian: number;
  opportunity: number;
  demand: number;
  saturation: number;
  totalReviews: number;
  services: number;
}

type ProfileState = {
  analysis: ProfileAnalysis | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  /** Lance une vraie analyse et mémorise le résultat. Renvoie le résultat brut. */
  analyze: (url: string) => Promise<AnalyzeResult>;
  clear: () => void;
};

const Ctx = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile doit être utilisé dans <ProfileProvider>");
  return ctx;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // hydratation depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAnalysis(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const analyze = useCallback(async (url: string): Promise<AnalyzeResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeProfile(url);
      if (result.status === "ok") {
        setAnalysis(result.analysis);
        try {
          localStorage.setItem(KEY, JSON.stringify(result.analysis));
          // historique local des analyses → tendances réelles sur la page Historique
          const a = result.analysis;
          const hist = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
          hist.push({
            at: new Date().toISOString(),
            url: a.profile.url,
            globalScore: a.globalScore,
            marketMedian: a.market.price.median,
            opportunity: a.market.opportunity,
            demand: a.market.demand,
            saturation: a.market.saturation,
            totalReviews: a.profile.gigs.reduce((s, g) => s + g.reviews, 0),
            services: a.profile.gigs.length,
          });
          localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-60)));
        } catch {
          /* quota / private mode */
        }
      }
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analyse impossible";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAnalysis(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Ctx.Provider value={{ analysis, hydrated, loading, error, analyze, clear }}>
      {children}
    </Ctx.Provider>
  );
}
