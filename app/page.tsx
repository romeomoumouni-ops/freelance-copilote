"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconStar, IconWallet, IconImage, IconPen, IconTrendingUp, IconZap, IconMenu, IconX } from "@/components/icons";

const NAV = [
  { href: "#accueil", label: "Accueil" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment", label: "Comment ça marche" },
  { href: "#inclus", label: "L'offre" },
];

const INCLUS = [
  "Des listes de prospects analysés : signaux réels sur chaque entreprise",
  "Des mails personnalisés écrits pour toi, avec relances automatiques",
  "Le mini-audit à envoyer qui prouve ton sérieux",
  "La boîte de réponses avec assistant pour conclure",
  "La connexion de ta boîte Gmail guidée pas à pas",
  "Le suivi de ton pipeline : contacté, a répondu, RDV calé, client signé",
];

const CTA = "Je suis freelance, je souhaite m'abonner à cet outil";

/** Surligné jaune */
function Hl({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="absolute inset-x-[-2px] bottom-[0.08em] h-[0.38em] rounded-sm bg-brand" />
      <span className="relative">{children}</span>
    </span>
  );
}

const AVATAR_LEFT =
  "smiling professional headshot portrait of young african man, glasses, plain light background, high quality photography";
const AVATAR_RIGHT =
  "smiling professional headshot portrait of young african woman, braids, plain light background, high quality photography";

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main id="accueil" className="min-h-screen scroll-smooth bg-white">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-white/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <a href="#accueil" className="shrink-0">
            <span className="text-[17px] font-extrabold tracking-tight text-ink">
              Freelance <Hl>Copilote</Hl>
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[13.5px] font-semibold text-ink-soft transition-colors hover:text-ink">
                {n.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-[13px] font-semibold text-ink-mute transition-colors hover:text-ink sm:block">
              Connexion
            </Link>
            <Link
              href="/abonnement"
              className="whitespace-nowrap rounded-full bg-royal px-4 py-2 text-[13px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.8)] transition-all hover:bg-royal-dark active:scale-[0.98]"
            >
              <span className="hidden sm:inline">Je m&apos;abonne</span>
              <span className="sm:hidden">M&apos;abonner</span>
            </Link>
            <button onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-1.5 text-ink md:hidden" aria-label="Menu">
              {menuOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-line bg-white px-5 py-3 md:hidden">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block py-2 text-[14px] font-semibold text-ink-soft">
                {n.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-36 -top-16 h-64 w-64 rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-36 -top-20 h-64 w-64 rounded-full bg-primary-100 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pt-10 text-center sm:pt-14">
          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-2 pr-4 shadow-card">
            <span className="flex -space-x-2">
              {["AB", "KO", "FS"].map((i, n) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold ${
                    n === 1 ? "bg-ink text-white" : "bg-brand text-ink"
                  }`}
                >
                  {i}
                </span>
              ))}
            </span>
            <span className="text-[12px] font-bold text-ink">
              <span className="text-royal">Des prospects réels,</span> analysés en direct
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mt-6 max-w-4xl text-[33px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[52px]">
            La prospection devient simple.
            <br />
            Trouve tes futurs clients
            <br />
            et convertis <Hl>10×&nbsp;plus.</Hl>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Un abonnement, un espace de travail complet : des prospects trouvés et analysés sur leur vrai
            site, des mails personnalisés qui obtiennent des réponses, des relances automatiques. Toi,
            tu réponds et tu signes.
          </p>
        </div>

        {/* ===== Scène : bloc vendeur + photo ===== */}
        <div className="relative mx-auto mt-10 max-w-5xl px-5 pb-16 sm:mt-12 sm:pb-24">
          {/* tuiles flottantes */}
          <span className="absolute left-0 top-2 z-0 hidden h-12 w-12 -rotate-6 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-card lg:flex">
            <IconStar size={18} />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?prompt=${encodeURIComponent(AVATAR_LEFT)}&w=128&h=128&seed=fc-avatar-l1`}
            alt=""
            className="absolute left-14 top-40 z-0 hidden h-16 w-16 rounded-full border-4 border-white object-cover shadow-pop lg:block"
          />
          <span className="absolute left-2 bottom-36 z-0 hidden h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-navy-50 text-navy shadow-card lg:flex">
            <IconWallet size={18} />
          </span>
          <span className="absolute right-0 top-4 z-0 hidden h-12 w-12 rotate-6 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-card lg:flex">
            <IconImage size={18} />
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?prompt=${encodeURIComponent(AVATAR_RIGHT)}&w=128&h=128&seed=fc-avatar-r1`}
            alt=""
            className="absolute right-10 top-44 z-0 hidden h-16 w-16 rounded-full border-4 border-white object-cover shadow-pop lg:block"
          />
          <span className="absolute right-3 bottom-40 z-0 hidden h-12 w-12 -rotate-3 items-center justify-center rounded-2xl bg-navy text-white shadow-card lg:flex">
            <IconPen size={18} />
          </span>

          <div className="relative flex flex-col items-center lg:flex-row lg:items-end lg:justify-center lg:gap-0">
            {/* PHOTO MOBILE */}
            <div className="relative z-0 -mb-7 flex w-full justify-center lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder.png"
                alt="Le fondateur de Freelance Copilote"
                className="h-44 w-auto object-contain drop-shadow-[12px_2px_10px_rgba(147,177,255,0.45)]"
              />
              <div className="absolute right-[calc(50%-130px)] top-1 rotate-3 rounded-xl bg-brand px-2.5 py-1.5 shadow-pop">
                <p className="text-[12px] font-extrabold leading-none text-ink">+34 %</p>
                <p className="text-[9px] font-semibold text-ink/70">de réponses</p>
              </div>
            </div>

            {/* BLOC VENDEUR */}
            <div className="relative z-10 w-full max-w-[560px] rounded-3xl border-2 border-ink bg-white p-6 text-left shadow-[8px_8px_0_0_#FFEE66] sm:p-8 lg:mb-6 lg:max-w-[520px]">
              <h2 className="text-[20px] font-extrabold leading-snug text-ink sm:text-[23px]">
                Remplis ton carnet de clients grâce à la prospection par e-mail bien faite
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
                De la liste de prospects au client signé : signaux réels sur chaque entreprise, mails
                personnalisés, relances automatiques et mini-audit qui prouve ton sérieux.
              </p>
              <Link
                href="/abonnement"
                className="mt-6 block rounded-2xl bg-royal px-6 py-4 text-center text-[15px] font-bold leading-snug text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,0.85)] transition-all hover:bg-royal-dark active:scale-[0.99]"
              >
                {CTA}
              </Link>
              <p className="mt-3 text-center text-[12px] font-semibold text-ink-mute">
                Tu remplis le formulaire, l&apos;équipe te recontacte pour activer ton abonnement.
              </p>
            </div>

            {/* PHOTO DESKTOP */}
            <div className="relative z-10 hidden w-[330px] shrink-0 lg:-ml-20 lg:block">
              <div className="pointer-events-none absolute -right-6 top-[20%] z-0 h-52 w-24 rounded-full bg-[#B9CDFF]/40 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/founder.png"
                alt="Le fondateur de Freelance Copilote"
                className="relative z-10 w-full object-contain drop-shadow-[20px_2px_14px_rgba(147,177,255,0.45)]"
              />
              <div className="absolute -right-12 top-14 z-20 rotate-3 rounded-2xl bg-brand px-4 py-3 shadow-pop">
                <div className="flex items-center gap-2">
                  <IconTrendingUp size={18} className="text-ink" />
                  <div>
                    <p className="text-[15px] font-extrabold leading-none text-ink">+34 %</p>
                    <p className="text-[10px] font-semibold text-ink/70">de réponses</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-16 bottom-40 z-20 -rotate-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
                  <IconZap size={14} /> Relance partie
                </p>
              </div>
              <div className="absolute -left-24 bottom-8 z-20 -rotate-2 rounded-full border border-line bg-white px-4 py-2 shadow-pop">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                  <IconCheck size={13} /> Yay ! Client signé
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FONCTIONNALITÉS ================= */}
      <section id="fonctionnalites" className="relative scroll-mt-20 overflow-hidden bg-canvas py-16">
        <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-navy/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tout ce que ton abonnement <Hl>débloque</Hl>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-ink-soft">
            Un seul outil, zéro blabla. Et tout tourne sur de la vraie data, pas sur du vent.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: "/icon-analyse.png",
                title: "Des prospects trouvés et analysés",
                desc: "L'outil lit le vrai site de chaque entreprise : site lent, pas de HTTPS, pas adapté mobile, fiche à l'abandon. Tu sais qui contacter, et surtout pourquoi.",
              },
              {
                icon: "/icon-creation.png",
                title: "Des mails qui obtiennent des réponses",
                desc: "Accroche personnalisée sur ses vrais problèmes, relances automatiques, arrêt dès qu'il répond. Et un mini-audit à son nom, à envoyer en un clic.",
              },
              {
                icon: "/icon-expert.png",
                title: "Ton copilote jusqu'à la signature",
                desc: "Assistant de réponse quand un prospect écrit, script d'appel quand il faut décrocher, suivi de ton pipeline jusqu'au client signé.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border-2 border-ink bg-white p-6 text-left shadow-[5px_5px_0_0_#FFEE66] transition-transform hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.icon} alt="" className="h-14 w-14 object-contain" />
                <h3 className="mt-4 text-lg font-extrabold text-ink">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section id="comment" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Comment ça marche ? <Hl>En 3 minutes.</Hl>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-ink-soft">
            Une fois abonné, tout se passe dans ton espace membre.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "1", t: "Ajoute tes prospects", d: "Colle ta liste d'entreprises. L'outil lit leurs vrais sites et repère ce qui cloche chez chacune : c'est ton angle d'attaque." },
              { n: "2", t: "Lance ta campagne", d: "Accroche et relances écrites avec les vrais signaux de chaque prospect. Tu valides, et ça part de ta propre boîte Gmail." },
              { n: "3", t: "Réponds et signe", d: "Les réponses arrivent, les séquences s'arrêtent toutes seules, l'assistant t'aide à conclure. RDV calé, client signé." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-canvas p-7 text-left">
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[15px] font-extrabold text-brand">
                  {s.n}
                </span>
                <h3 className="mt-3 text-[16px] font-extrabold text-ink">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
          <Link
            href="/abonnement"
            className="mt-9 inline-block rounded-full bg-ink px-7 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(23,22,28,0.5)] transition-all hover:bg-black"
          >
            Ouvrir mon espace membre
          </Link>
        </div>
      </section>

      {/* ================= CE QUI EST INCLUS ================= */}
      <section id="inclus" className="scroll-mt-20 bg-canvas py-16">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Voici ce qui est <Hl>inclus</Hl>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14px] text-ink-soft">
            Tout ça devient actif dans ton espace membre dès que l&apos;équipe t&apos;a recontacté et que
            ton abonnement est en place.
          </p>

          <div className="mt-10 rounded-3xl border-2 border-ink bg-white p-8 text-left shadow-[8px_8px_0_0_#FFEE66]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">
              Inclus dans l&apos;abonnement
            </p>
            <ul className="mt-5 space-y-3">
              {INCLUS.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-ink-soft">
                  <IconCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/abonnement"
              className="mt-8 block rounded-2xl bg-royal px-6 py-4 text-center text-[15px] font-bold leading-snug text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,0.85)] transition-all hover:bg-royal-dark active:scale-[0.99]"
            >
              {CTA}
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            Freelance <Hl>Copilote</Hl>
          </span>
          <p className="max-w-md text-[11px] leading-relaxed text-ink-mute">
            Outil de prospection pour freelances. Analyse des pages publiques uniquement, aucune donnée
            inventée, désabonnement présent dans chaque mail envoyé.
          </p>
        </div>
      </footer>
    </main>
  );
}
