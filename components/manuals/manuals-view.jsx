"use client";
import { useMemo, useState } from 'react';
import data from '../../data/manuals.json';
import ManualDetails from './manuals.details';

export default function ManualList() {
  const [query, setQuery] = useState('');
  const manuals = data.manuals || [];
  // Sort manuals alphabetically by title (case-insensitive)
  const sortedManuals = useMemo(() => {
    return [...manuals].sort((a, b) => (a?.title || '').localeCompare(b?.title || '', 'en', { sensitivity: 'base' }));
  }, [manuals]);
  const [activeId, setActiveId] = useState(sortedManuals[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedManuals;
    return sortedManuals.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.details || []).some(d => `${d.label} ${d.value}`.toLowerCase().includes(q))
    );
  }, [query, sortedManuals]);

  const active = filtered.find(m => m.id === activeId) || filtered[0] || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] gap-4 w-full">
      {/* Mobile selector */}
      <div className="card p-3 sm:hidden">
        <div className="flex flex-col gap-2">
          <select
            value={active?.id ?? ''}
            onChange={(e) => setActiveId(e.target.value)}
            className="input"
          >
            {filtered.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manuals..."
            className="input"
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="card p-0 hidden md:flex md:flex-col max-h-[78vh] overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manuals..."
            className="input"
          />
        </div>
        <div className="overflow-auto">
          <ul className="py-2">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 ${active?.id === m.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                  onClick={() => setActiveId(m.id)}
                >
                  <div className="font-medium text-sm">{m.title}</div>
                  {m.description && (
                    <div className="text-xs text-gray-500 line-clamp-1">{m.description}</div>
                  )}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-xs text-gray-500 px-3 py-2">No results.</li>
            )}
          </ul>
        </div>
      </aside>

      <section className="card p-4 lg:p-6 min-w-0 w-full justify-self-stretch">
        {active ? (
          <ManualDetails manual={active} />
        ) : (
          <div className="text-sm text-gray-500 p-4">Select a manual.</div>
        )}
      </section>
    </div>
  );
}
