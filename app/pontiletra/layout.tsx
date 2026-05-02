import localFont from 'next/font/local';
import type { Metadata } from 'next';

const pontiletra = localFont({
  src: './pontiletra.ttf',
  variable: '--font-pontiletra',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gerador de Caligrafia — Pontiletra',
  description: 'Crie folhas de treino personalizadas para praticar a escrita',
};

export default function PontiletraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Patrick+Hand&family=Nunito:wght@400;600;700&display=swap"
      />
      <div className={pontiletra.variable}>{children}</div>
    </>
  );
}
