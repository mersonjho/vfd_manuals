'use client';
import { useState } from 'react';

export default function UniversalReference({ universal }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Universal Modbus RTU & RS-485 Reference</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Standard settings apply to ALL VFDs in the facility. Click to {open ? 'collapse' : 'expand'}.
          </p>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          {/* Modbus Protocol */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔌 Modbus RTU Protocol</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {[
                ['Protocol', universal.protocol],
                ['Hardware', universal.hardware],
                ['Default Baud', universal.defaultBaud + ' bps'],
                ['Default Parity', universal.defaultParity],
                ['Slave ID Range', universal.slaveIdRange],
                ['Topology', universal.topology],
                ['Max Distance', universal.maxDistance],
                ['Cable', universal.cable],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 px-3 py-2 rounded bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{k}:</span>
                  <span className="text-gray-900 dark:text-gray-100">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RS-485 Wiring */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🔧 RS-485 Wiring Standard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
              {Object.entries(universal.wiringPins).map(([k, v]) => (
                <div key={k} className="flex gap-2 px-3 py-2 rounded bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{k}:</span>
                  <span className="text-gray-900 dark:text-gray-100">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">⚠️ Termination Rule</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{universal.termination}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 font-mono text-[10px] text-gray-600 dark:text-gray-400">
              {universal.terminationDiagram}
            </div>
          </div>

          {/* Best Practices */}
          <div>
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">✅ Best Practices</h3>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-400">
              {(universal.bestPractices || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">❌ Common Mistakes</h3>
            <ul className="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-400">
              {(universal.commonMistakes || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
