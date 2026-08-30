"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/ProfileProvider";
import { IconX } from "@/components/icons";

const nav: { href: string; label: string; desc: string }[] = [
  { href: "/profile", label: "Analyse", desc: "Ton pourcentage de réussite" },
  { href: "/create", label: "Créer mon profil", desc: "Photo, services, pages de vente" },
  { href: "/conseils", label: "Conseils", desc: "Ton expert ComeUp répond" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { analysis } = useProfile();
  const name = analysis?.profile.displayName || "Ton profil";
  const initials = (analysis?.profile.displayName || "?").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Voile mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-ink/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-line bg-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Wordmark — style ComeUp : Montserrat bold + surligné jaune */}
        <div className="flex items-center justify-between px-5 pb-2 pt-6">
          <Link href="/profile" className="block">
            <span className="text-[19px] font-extrabold leading-tight tracking-tight text-ink">
              Freelance
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-x-0 bottom-0.5 h-[9px] rounded-sm bg-brand" />
                <span className="relative">Copilot</span>
              </span>
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              pour ComeUp
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-mute hover:bg-ink/5 lg:hidden"
            aria-label="Fermer le menu"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Navigation — 3 onglets, sans icônes */}
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block rounded-xl px-3.5 py-3 transition-all duration-150",
                  active ? "bg-brand text-ink shadow-[0_6px_16px_-8px_rgba(202,138,4,0.5)]" : "hover:bg-canvas"
                )}
              >
                <span className={cn("block text-[14px] font-bold", active ? "text-ink" : "text-ink-soft")}>
                  {item.label}
                </span>
                <span className={cn("block text-[11px]", active ? "text-ink/70" : "text-ink-mute")}>
                  {item.desc}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Profil + paramètres */}
        <div className="space-y-1 border-t border-line p-4">
          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-extrabold text-ink">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">{name}</p>
              <p className="truncate text-[11px] text-ink-mute">
                {analysis ? "Vendeur ComeUp" : "Profil non analysé"}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "block rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors",
              pathname.startsWith("/settings") ? "text-ink" : "text-ink-mute hover:text-ink"
            )}
          >
            Paramètres
          </Link>
          <p className="px-2 pt-1 text-[10px] leading-relaxed text-ink-mute/80">
            Outil indépendant — non affilié à ComeUp.
          </p>
        </div>
      </aside>
    </>
  );
}
