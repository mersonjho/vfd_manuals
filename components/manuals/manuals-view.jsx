"use client";
import { useMemo, useState } from 'react';
import ManualDetails from './manuals.details';

export default function ManualList({ data }) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [mobileView, setMobileView] = useState('list');

  const manuals = data?.manuals || [];
  const sorted = useMemo(() => {
    return [...manuals].sort((a, b) =>
      (a?.title || '').localeCompare(b?.title || '', 'en', { sensitivity: 'base' })
    );
  }, [manuals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.description || '').toLowerCase().includes(q) ||
      (m.details || []).some(d => `${d.label} ${d.value}`.toLowerCase().includes(q)) ||
      (m.manufacturer || '').toLowerCase().includes(q)
    );
  }, [query, sorted]);

  const active = filtered.find(m => m.id === activeId) || filtered[0] || null;

  return (
    <div className="space-y-4">
      {/* Header with search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search manuals by name, manufacturer, model..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {filtered.length} of {manuals.length} manuals shown{query ? ` · Matching "${query}"` : ''}
        </p>
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden flex gap-2">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mobileView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          📋 Manual List
        </button>
        <button
          onClick={() => { setMobileView('detail'); if (!activeId && filtered[0]) setActiveId(filtered[0].id); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mobileView === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          📄 Details
        </button>
      </div>

      {/* Main content — sidebar always visible on md+, on mobile only when list selected */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] gap-4">
        {/* Sidebar */}
        <aside className={`card p-0 flex flex-col max-h-[calc(100vh-240px)] overflow-hidden ${mobileView === 'detail' ? 'hidden md:flex' : ''}`}>
          <div className="overflow-auto flex-1">
            {filtered.map((m) => {
              const isActive = active?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setActiveId(m.id); setMobileView('detail'); }}
                  className={`w-full text-left px-4 py-3 transition-colors border-l-4 flex items-start gap-3 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500 dark:border-l-blue-400'
                      : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {m.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                      {m.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {m.details?.find(d => d.label === 'Manufacturer')?.value || ''} · {m.details?.find(d => d.label === 'Model Family')?.value || ''}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8 px-4">
                No manuals match your search.
              </div>
            )}
          </div>
        </aside>

        {/* Detail panel — always visible on md+, on mobile only when detail selected */}
        <section className={`card p-4 lg:p-6 min-w-0 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          {active ? (
            <ManualDetails manual={active} />
          ) : (
            <div className="text-center text-gray-500 py-16">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-sm">Select a manual from the list to view details.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

