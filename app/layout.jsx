import './globals.css';
import 'yet-another-react-lightbox/styles.css';
import Providers from '../components/providers';
import SiteHeader from '../components/site-header';

export const metadata = {
  title: 'VFD Manual Monitoring',
  description: 'Monitor and browse VFD manuals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-[1920px] px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

