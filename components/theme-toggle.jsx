'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = (theme === 'dark') || (theme === 'system' && resolvedTheme === 'dark');
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return compact ? (
    <button className="btn" onClick={toggle} aria-label="Toggle theme">
      {isDark ? '🌞' : '🌙'}
    </button>
  ) : (
    <button className="btn" onClick={toggle} aria-label="Toggle theme">
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
