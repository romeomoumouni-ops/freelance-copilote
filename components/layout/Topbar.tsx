"use client";

import { IconMenu, IconSearch, IconBell, IconChevronDown } from "@/components/icons";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
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
              FC
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-bold leading-tight text-ink">Mon espace</span>
              <span className="block text-[11px] leading-tight text-ink-mute">Prospection active</span>
            </span>
            <IconChevronDown size={14} className="hidden text-ink-mute sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
