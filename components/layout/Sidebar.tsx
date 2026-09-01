"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { IconLogout, IconX } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";

const nav: { href: string; label: string; desc: string }[] = [
  { href: "/dashboard", label: "Aujourd'hui", desc: "Ta vague du jour et tes chiffres" },
  { href: "/prospects", label: "Prospects", desc: "Listes, signaux réels, accroches" },
  { href: "/campagnes", label: "Campagnes", desc: "Séquences et relances auto" },
  { href: "/inbox", label: "Réponses", desc: "Conclure avec l'assistant" },
  { href: "/mailbox", label: "Boîte mail", desc: "Ta connexion Gmail" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const displayName = (user?.user_metadata?.name as string) || "Mon espace";
  const email = user?.email || "";
  const initials = (displayName || email || "FC").slice(0, 2);

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
        {/* Wordmark : Montserrat bold + surligné jaune */}
        <div className="flex items-center justify-between px-5 pb-2 pt-6">
          <Link href="/dashboard" className="block">
            <span className="text-[19px] font-extrabold leading-tight tracking-tight text-ink">
              Freelance
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-x-0 bottom-0.5 h-[9px] rounded-sm bg-brand" />
                <span className="relative">Copilote</span>
              </span>
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

        {/* Navigation : liste simple, sans icônes */}
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block rounded-xl px-3.5 py-2.5 transition-all duration-150",
                  active ? "bg-brand text-ink shadow-[0_6px_16px_-8px_rgba(202,138,4,0.5)]" : "hover:bg-canvas"
                )}
              >
                <span className={cn("block text-[13.5px] font-bold", active ? "text-ink" : "text-ink-soft")}>
                  {item.label}
                </span>
                <span className={cn("block text-[11px]", active ? "text-ink/70" : "text-ink-mute")}>
                  {item.desc}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Pied de barre : compte + déconnexion */}
        <div className="space-y-1 border-t border-line p-4">
          <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-extrabold uppercase text-ink">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">{displayName}</p>
              <p className="truncate text-[11px] text-ink-mute">{email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-mute transition-colors hover:text-ink"
          >
            <IconLogout size={13} /> Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
