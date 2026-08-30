"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { IconSparkles, IconArrowRight } from "@/components/icons";

/** Affiché sur les pages de l'app quand aucun profil n'a encore été analysé. */
export default function EmptyProfile({
  title = "Analysez d'abord votre profil",
  message = "Collez le lien public de votre profil ou d'un service ComeUp : votre copilote le lit réellement, le compare à votre marché et débloque toutes les pages avec vos vrais chiffres.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <div className="flex flex-col items-center py-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <IconSparkles size={26} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-ink-mute">{message}</p>
        <Link href="/" className="mt-5">
          <Button variant="primary" iconRight={<IconArrowRight size={15} />}>
            Analyser mon profil
          </Button>
        </Link>
      </div>
    </Card>
  );
}
