import type { SVGProps, ReactNode } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
};

/* ------------------------------------------------------------------
   Jeu d'icônes "duotone" maison : une forme pleine douce (fillOpacity)
   + un trait net par-dessus. Ça donne du caractère, un rendu "vraie app",
   sans être plat/générique ni 3D. Les micro-contrôles (flèches, croix,
   coche…) restent en trait fin. Prend la couleur du texte (currentColor).
   ------------------------------------------------------------------ */

function S({
  size = 20,
  className,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

const soft = { fill: "currentColor", fillOpacity: 0.16, stroke: "none" } as const;
const dot = { fill: "currentColor", stroke: "none" } as const;

/* ================= ICÔNES DE CONTENU — DUOTONE ================= */

export const IconSparkles = (p: IconProps) => (
  <S {...p}>
    <path
      {...soft}
      d="M12 3l1.8 5.2a2 2 0 0 0 1.24 1.24L20.5 11l-5.46 1.56a2 2 0 0 0-1.24 1.24L12 19l-1.56-5.2a2 2 0 0 0-1.24-1.24L3.5 11l5.46-1.56a2 2 0 0 0 1.24-1.24z"
    />
    <path d="M12 3l1.8 5.2a2 2 0 0 0 1.24 1.24L20.5 11l-5.46 1.56a2 2 0 0 0-1.24 1.24L12 19l-1.56-5.2a2 2 0 0 0-1.24-1.24L3.5 11l5.46-1.56a2 2 0 0 0 1.24-1.24z" />
  </S>
);

export const IconWallet = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1-2.5-2.5z" />
    <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2.5 2.5 0 0 1-2.5-2.5z" />
    <circle cx="16" cy="13" r="1.5" {...dot} />
  </S>
);

export const IconEuro = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" {...soft} />
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 9.3a3.8 3.8 0 1 0 0 5.4" />
    <path d="M8.4 11h5.2" />
    <path d="M8.4 13.2h4.2" />
  </S>
);

export const IconStar = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M12 3.2l2.35 4.76 5.25.77-3.8 3.7.9 5.23L12 15.9l-4.7 2.46.9-5.23-3.8-3.7 5.25-.77z" />
    <path d="M12 3.2l2.35 4.76 5.25.77-3.8 3.7.9 5.23L12 15.9l-4.7 2.46.9-5.23-3.8-3.7 5.25-.77z" />
  </S>
);

export const IconImage = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" {...soft} />
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.6" {...dot} />
    <path d="M21 16.5 16 12a2 2 0 0 0-2.8 0L6 19" />
  </S>
);

export const IconZap = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M13 2.5 4.6 13.1a.6.6 0 0 0 .47.98H10l-1 8.4 8.4-10.6a.6.6 0 0 0-.47-.98H12z" />
    <path d="M13 2.5 4.6 13.1a.6.6 0 0 0 .47.98H10l-1 8.4 8.4-10.6a.6.6 0 0 0-.47-.98H12z" />
  </S>
);

export const IconTarget = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" {...soft} />
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.7" {...dot} />
  </S>
);

export const IconTrophy = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5H4.5a2.5 2.5 0 0 0 0 5H7" />
    <path d="M17 5h2.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M12 14v3.5" />
    <path d="M8.5 21h7" />
    <path d="M10 21v-1.5a2 2 0 0 1 4 0V21" />
  </S>
);

export const IconLightbulb = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
    <path d="M9.5 18.5h5" />
    <path d="M10.5 21h3" />
  </S>
);

export const IconShield = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M12 3l7 2.5v5.6c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9V5.5z" />
    <path d="M12 3l7 2.5v5.6c0 4.4-3 7.4-7 8.9-4-1.5-7-4.5-7-8.9V5.5z" />
    <path d="m9 12 2 2 4-4" />
  </S>
);

export const IconEye = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
    <circle cx="12" cy="12" r="2.6" />
    <circle cx="12" cy="12" r="1" {...dot} />
  </S>
);

export const IconBag = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M6 8h12l-.8 11a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8z" />
    <path d="M6 8h12l-.8 11a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </S>
);

export const IconGlobe = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" {...soft} />
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </S>
);

export const IconFlask = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" {...soft} />
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10.5 9.3 15 12l-4.5 2.7z" {...dot} />
  </S>
);

export const IconPen = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M4 20l1-4L15.4 5.6a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8 19z" />
    <path d="M4 20l1-4L15.4 5.6a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8 19z" />
    <path d="m13.5 7.5 3 3" />
  </S>
);

export const IconMessageSquare = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16H9l-4 4v-4H4a1.5 1.5 0 0 1-1.5-1.5V6.5A1.5 1.5 0 0 1 4 5z" />
    <path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16H9l-4 4v-4H4a1.5 1.5 0 0 1-1.5-1.5V6.5A1.5 1.5 0 0 1 4 5z" />
  </S>
);
export const IconChat = IconMessageSquare;

export const IconLayers = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M12 3 3 7.5 12 12l9-4.5z" />
    <path d="M12 3 3 7.5 12 12l9-4.5z" />
    <path d="m3 12 9 4.5 9-4.5" />
    <path d="m3 16.5 9 4.5 9-4.5" />
  </S>
);

export const IconTrendingUp = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M3 20V16l6.5-5.5 4 3L21 6.5V20z" />
    <path d="M3 16l6.5-5.5 4 3L21 8" />
    <path d="M16 8h5v5" />
  </S>
);

export const IconTrendingDown = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M3 4v4l6.5 5.5 4-3L21 17.5V4z" />
    <path d="M3 8l6.5 5.5 4-3L21 16" />
    <path d="M16 16h5v-5" />
  </S>
);

export const IconGauge = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M3.5 15a8.5 8.5 0 1 1 17 0z" />
    <path d="M3.5 15a8.5 8.5 0 1 1 17 0" />
    <path d="M12 15l3.5-3.5" />
    <circle cx="12" cy="15" r="1.3" {...dot} />
  </S>
);

export const IconDashboard = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" {...soft} />
    <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" {...soft} />
    <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
    <rect x="3" y="14" width="7.5" height="7" rx="1.5" />
  </S>
);

export const IconBot = (p: IconProps) => (
  <S {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3.5" {...soft} />
    <rect x="4" y="8" width="16" height="12" rx="3.5" />
    <circle cx="9" cy="13.5" r="1.1" {...dot} />
    <circle cx="15" cy="13.5" r="1.1" {...dot} />
    <path d="M12 8V5" />
    <circle cx="12" cy="4" r="1.1" />
    <path d="M4 14H2.6M20 14h1.4" />
  </S>
);

export const IconInbox = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M3 13l2.4-6.6A2 2 0 0 1 7.3 5h9.4a2 2 0 0 1 1.9 1.4L21 13v4.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M3 13l2.4-6.6A2 2 0 0 1 7.3 5h9.4a2 2 0 0 1 1.9 1.4L21 13v4.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M3 13h5l1.2 2h5.6l1.2-2h5" />
  </S>
);

export const IconClipboard = (p: IconProps) => (
  <S {...p}>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" {...soft} />
    <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
    <rect x="9" y="2.8" width="6" height="3.6" rx="1.3" />
    <path d="M9 11h6M9 15h4" />
  </S>
);

export const IconLock = (p: IconProps) => (
  <S {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" {...soft} />
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15" r="1.2" {...dot} />
    <path d="M12 16.2v2" />
  </S>
);

export const IconCalendar = (p: IconProps) => (
  <S {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...soft} />
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3.5v3M16 3.5v3" />
    <circle cx="12" cy="14" r="1" {...dot} />
  </S>
);

export const IconAlert = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M12 3.4 2.7 19a1 1 0 0 0 .86 1.5h16.88A1 1 0 0 0 21.3 19z" />
    <path d="M12 3.4 2.7 19a1 1 0 0 0 .86 1.5h16.88A1 1 0 0 0 21.3 19z" />
    <path d="M12 9.5v4.5" />
    <circle cx="12" cy="17" r="1" {...dot} />
  </S>
);

export const IconClock = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" {...soft} />
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </S>
);

export const IconSettings = (p: IconProps) => (
  <S {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" {...soft} />
    <circle cx="12" cy="12" r="3" />
  </S>
);

export const IconUser = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="8" r="4" {...soft} />
    <circle cx="12" cy="8" r="4" />
    <path {...soft} d="M4.5 20a7.5 7.5 0 0 1 15 0z" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </S>
);

export const IconCard = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" {...soft} />
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 9.5h18" />
    <path d="M6.5 15h4" />
  </S>
);

export const IconThumbsUp = (p: IconProps) => (
  <S {...p}>
    <path {...soft} d="M7 10l3.4-6.4a2 2 0 0 1 3.7 1.3L13.5 9H19a2 2 0 0 1 2 2.3l-1.1 7a2 2 0 0 1-2 1.7H7z" />
    <path d="M7 10l3.4-6.4a2 2 0 0 1 3.7 1.3L13.5 9H19a2 2 0 0 1 2 2.3l-1.1 7a2 2 0 0 1-2 1.7H7z" />
    <path d="M7 10v11H4.5A1.5 1.5 0 0 1 3 19.5v-8A1.5 1.5 0 0 1 4.5 10z" />
  </S>
);

export const IconSearch = (p: IconProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" {...soft} />
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </S>
);

/* ================= MICRO-CONTRÔLES — TRAIT FIN ================= */

export const IconMenu = (p: IconProps) => (
  <S {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </S>
);

export const IconX = (p: IconProps) => (
  <S {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </S>
);

export const IconCheck = (p: IconProps) => (
  <S {...p}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);

export const IconPlus = (p: IconProps) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const IconCopy = (p: IconProps) => (
  <S {...p}>
    <rect x="8" y="8" width="14" height="14" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </S>
);

export const IconSend = (p: IconProps) => (
  <S {...p}>
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
    <path d="M22 2 11 13" />
  </S>
);

export const IconChevronDown = (p: IconProps) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const IconChevronRight = (p: IconProps) => (
  <S {...p}>
    <path d="m9 18 6-6-6-6" />
  </S>
);

export const IconChevronLeft = (p: IconProps) => (
  <S {...p}>
    <path d="m15 18-6-6 6-6" />
  </S>
);

export const IconArrowRight = (p: IconProps) => (
  <S {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </S>
);

export const IconArrowUpRight = (p: IconProps) => (
  <S {...p}>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </S>
);

export const IconArrowDownRight = (p: IconProps) => (
  <S {...p}>
    <path d="m7 7 10 10" />
    <path d="M17 7v10H7" />
  </S>
);

export const IconRefresh = (p: IconProps) => (
  <S {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </S>
);

export const IconExternal = (p: IconProps) => (
  <S {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </S>
);

export const IconFilter = (p: IconProps) => (
  <S {...p}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </S>
);

export const IconDownload = (p: IconProps) => (
  <S {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </S>
);

export const IconBell = (p: IconProps) => (
  <S {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </S>
);

export const IconMore = (p: IconProps) => (
  <S {...p}>
    <circle cx="5" cy="12" r="1" {...dot} />
    <circle cx="12" cy="12" r="1" {...dot} />
    <circle cx="19" cy="12" r="1" {...dot} />
  </S>
);

export const IconHelp = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </S>
);

export const IconTrash = (p: IconProps) => (
  <S {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </S>
);

export const IconBookmark = (p: IconProps) => (
  <S {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </S>
);

export const IconLogout = (p: IconProps) => (
  <S {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </S>
);

/* ---------- icônes pilotées par les données (lib) ---------- */
export const iconMap = {
  pen: IconPen,
  zap: IconZap,
  euro: IconEuro,
  image: IconImage,
  star: IconStar,
  clock: IconClock,
  search: IconSearch,
  message: IconMessageSquare,
  layers: IconLayers,
  trending: IconTrendingUp,
  check: IconCheck,
  eye: IconEye,
  bag: IconBag,
  wallet: IconWallet,
  target: IconTarget,
  shield: IconShield,
  lightbulb: IconLightbulb,
  sparkles: IconSparkles,
  globe: IconGlobe,
  flask: IconFlask,
} as const;

export type IconKey = keyof typeof iconMap;
