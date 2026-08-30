"use client";

import { useProfile } from "@/components/ProfileProvider";
import { IconMenu, IconSearch, IconBell, IconChevronDown } from "@/components/icons";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { analysis } = useProfile();
  const name = analysis?.profile.displayName || "Votre profil";
  const initials = (analysis?.profile.displayName || "?").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-xl border border-line bg-white p-2 text-ink-soft lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <IconMenu size={18} />
        </button>

        <div className="relative hidden md:block">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            placeholder="Rechercher…"
            className="h-10 w-64 rounded-xl border border-line bg-white pl-10 pr-4 text-sm outline-none transition-all placeholder:text-ink-mute focus:w-80 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Copilote actif
          </span>
          <button
            className="relative rounded-xl border border-line bg-white p-2 text-ink-soft transition-colors hover:text-ink"
            aria-label="Notifications"
          >
            <IconBell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>
          <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
          <button className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[12px] font-extrabold text-ink">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-bold leading-tight text-ink">{name}</span>
              <span className="block text-[11px] leading-tight text-ink-mute">{analysis ? "Vendeur ComeUp" : "Non analysé"}</span>
            </span>
            <IconChevronDown size={14} className="hidden text-ink-mute sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
