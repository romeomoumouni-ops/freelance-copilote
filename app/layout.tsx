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
  title: "Freelance Copilot — Votre copilote IA pour vendre plus",
  description:
    "Collez le lien de votre profil freelance. Votre copilote analyse vos performances et vous indique exactement quoi améliorer pour vendre davantage sur ComeUp, Fiverr et Upwork.",
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
