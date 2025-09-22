'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './theme-toggle';

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => pathname === href;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto w-full max-w-[1920px] px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold whitespace-nowrap">VFD Manuals</Link>
        <div className="flex-1 flex justify-center">
          <nav className="hidden sm:flex items-center text-sm bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner">
            <Tab href="/" active={isActive('/')}>Home</Tab>
            <Tab href="/manuals" active={isActive('/manuals')}>Manuals</Tab>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="sm:hidden">
            <button className="btn" onClick={() => setOpen(o=>!o)} aria-label="Menu">☰</button>
          </div>
          <div className="hidden sm:block">
            <ThemeToggle compact />
          </div>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-2 flex flex-col gap-2">
            <Link className={`px-2 py-1 rounded ${isActive('/')?'bg-gray-100 dark:bg-gray-800':''}`} href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link className={`px-2 py-1 rounded ${isActive('/manuals')?'bg-gray-100 dark:bg-gray-800':''}`} href="/manuals" onClick={() => setOpen(false)}>Manuals</Link>
            <ThemeToggle compact={false} />
          </div>
        </div>
      )}
    </header>
  );
}

function Tab({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full transition-colors ${active ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}
    >
      {children}
    </Link>
  );
}
