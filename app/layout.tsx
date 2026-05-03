import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pontiletra",
  description: "Gerador de folhas de caligrafia para educadores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Patrick+Hand&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
