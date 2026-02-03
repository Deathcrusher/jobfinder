import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connie Jobfinder · Innsbruck & Remote",
  description:
    "All-in-one Jobfinder für Quereinsteiger:innen mit Fokus auf Innsbruck/Tirol und Remote-Jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
