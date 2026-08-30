import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/components/ProfileProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Freelance Copilote · Ton copilote ComeUp",
  description:
    "Colle le lien de ton profil ComeUp : analyse en direct de tes vraies données, création de ta photo de profil, de tes miniatures et de tes pages de vente.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className="font-sans">
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
