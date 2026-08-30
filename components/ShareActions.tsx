"use client";

import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IconSend, IconCopy } from "@/components/icons";

/** Boutons de partage viral : partage natif (mobile) + copie du texte prêt-à-poster. */
export default function ShareActions({ text, className }: { text: string; className?: string }) {
  const toast = useToast();

  async function share() {
    const shareData = { title: "Freelance Copilote", text };
    // partage natif (mobile) si dispo
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share(shareData);
        return;
      } catch {
        /* annulé → on retombe sur la copie */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Texte copié — colle-le dans WhatsApp, une story ou un post", "success");
    } catch {
      toast("Copie impossible sur ce navigateur", "warning");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copié dans le presse-papiers", "success");
    } catch {
      toast("Copie impossible sur ce navigateur", "warning");
    }
  }

  return (
    <div className={className}>
      <Button variant="violet" size="md" icon={<IconSend size={15} />} onClick={share}>
        Partager
      </Button>
      <Button variant="secondary" size="md" icon={<IconCopy size={15} />} onClick={copy}>
        Copier le texte
      </Button>
    </div>
  );
}
