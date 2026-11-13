import { Abhaya_Libre, Jost } from 'next/font/google';
import './globals.css';
import { SCRIPT_VALORES } from '@/lib/ocultar-valores';

const abhaya = Abhaya_Libre({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-abhaya', display: 'swap' });
const jost = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' });

export const dynamic = 'force-dynamic';

export const metadata = {
  title: { default: 'Mariana Canedo · Escritório', template: '%s · Mariana Canedo' },
  description: 'Sistema de gestão do escritório Mariana Canedo Arquitetura e Interiores',
  applicationName: 'Escritório Mariana Canedo',
};

export const viewport = { themeColor: '#5E564F' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${abhaya.variable} ${jost.variable}`}>
      <body>
        {children}
        {/* Aplica "ocultar valores" antes da tela aparecer */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_VALORES }} />
      </body>
    </html>
  );
}
