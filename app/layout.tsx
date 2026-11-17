import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Zentro | Suas finanças em um só lugar.', description: 'Controle financeiro pessoal simples, intuitivo e seguro.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
