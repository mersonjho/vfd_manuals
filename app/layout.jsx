import './globals.css';
import 'yet-another-react-lightbox/styles.css';
import Providers from '../components/providers';
import AppShell from '../components/app-shell';

export const metadata = {
  title: 'VFD Manual Hub',
  description: 'VFD Modbus Communication & Manual Reference',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

