'use client';
import { usePathname } from 'next/navigation';
import SiteHeader from './site-header';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <>
      {!isLogin && <SiteHeader />}
      <main className="mx-auto w-full max-w-screen-xl px-4 py-6">{children}</main>
    </>
  );
}
