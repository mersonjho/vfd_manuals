'use client';
import { useState } from 'react';

export default function FaultCodes({ model }) {
  const faults = model.faultCodes;
  const [search, setSearch] = useState('');

  if (!faults || Object.keys(faults).length === 0) {
    return <p className="text-sm text-gray-500">No fault codes documented for this model.</p>;
  }

  const entries = Object.entries(faults);
  const filtered = search
    ? entries.filter(([code, desc]) =>
        code.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Filter fault codes... (e.g. OC, Over Current, Communication)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕ clear
          </button>
        )}
      </div>

      {/* Fault Code Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(([code, desc]) => (
          <div
            key={code}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 transition-colors bg-white dark:bg-gray-800/50"
          >
            <code className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded whitespace-nowrap min-w-[60px] text-center">
              {code}
            </code>
            <span className="text-sm text-gray-700 dark:text-gray-300">{desc}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">No fault codes match "{search}".</p>
      )}

      {/* Fault Reset Info */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">🔄 How to Reset a Fault</h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Method 1 (Modbus):</strong> Write 1 to the Fault Reset register/coil (check Register Map tab for exact address).</p>
          <p><strong>Method 2 (Keypad):</strong> Press STOP/RESET button on the VFD keypad.</p>
          <p><strong>Method 3 (Power Cycle):</strong> Power OFF the VFD, wait for display to go dark, then power ON.</p>
          <p className="text-amber-600 dark:text-amber-400 mt-2">⚠️ Always investigate and resolve the root cause before resetting a fault.</p>
        </div>
      </div>
    </div>
  );
}
