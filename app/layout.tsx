import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pontiletra',
  description: 'Gerador de folhas de caligrafia para educadores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
