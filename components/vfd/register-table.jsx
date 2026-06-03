'use client';
import { useState } from 'react';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function RegisterTable({ model }) {
  const regs = model.registerMap;
  if (!regs) return <p className="text-sm text-gray-500">No register map available for this model.</p>;

  const renderRegisters = (title, items, colorClass) => (
    <div className="card overflow-hidden">
      <h3 className={`font-semibold px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${colorClass || 'text-gray-900 dark:text-gray-100'}`}>
        {title} ({items?.length || 0})
      </h3>
      {(!items || items.length === 0) ? (
        <p className="px-4 py-3 text-sm text-gray-500">No registers documented for this category.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Register</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Address</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Function</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Unit / Scale</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((reg, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{reg.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    <button
                      onClick={() => copyToClipboard(reg.address)}
                      className="hover:underline cursor-pointer"
                      title="Click to copy address"
                    >
                      {reg.address}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{reg.function}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {reg.unit}
                    {reg.scale && <span className="block text-[10px] text-gray-400">Scale: {reg.scale}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    {reg.description}
                    {reg.example && (
                      <code className="block mt-1 p-1.5 rounded bg-gray-900 dark:bg-gray-950 text-green-400 text-[10px] font-mono break-all">
                        {reg.example}
                      </code>
                    )}
                    {reg.note && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{reg.note}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderFaultRegisters = (items) => (
    <div className="card overflow-hidden">
      <h3 className="font-semibold text-red-700 dark:text-red-400 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        Fault / Status Registers ({items?.length || 0})
      </h3>
      {(!items || items.length === 0) ? (
        <p className="px-4 py-3 text-sm text-gray-500">No fault registers documented.</p>
      ) : (
        <div className="space-y-3 p-4">
          {items.map((reg, i) => (
            <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{reg.name}</span>
                <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">{reg.address}</code>
                <span className="text-xs text-gray-400">{reg.function}</span>
              </div>
              {reg.bits && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {reg.bits.map((bit, j) => (
                    <div key={j} className="text-xs text-gray-600 dark:text-gray-400">
                      <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{bit.split(':')[0]}</code>
                      <span className="ml-1">{bit.split(':').slice(1).join(':')}</span>
                    </div>
                  ))}
                </div>
              )}
              {reg.description && <p className="text-xs text-gray-500 mt-1">{reg.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick Test */}
      {model.quickTest && (
        <div className="card p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-2">🧪 Verification Command</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">{model.quickTest.description}</p>
          {model.quickTest.readCommand && (
            <code className="block p-2 rounded bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono break-all">
              {model.quickTest.readCommand}
            </code>
          )}
          {model.quickTest.expectedResponse && (
            <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-1">{model.quickTest.expectedResponse}</p>
          )}
        </div>
      )}

      {/* Control Registers */}
      {renderRegisters('🎮 Control Registers (Read/Write)', regs.control, 'text-green-700 dark:text-green-400')}

      {/* Monitor Registers */}
      {renderRegisters('📊 Monitor Registers (Read-Only)', regs.monitor, 'text-blue-700 dark:text-blue-400')}

      {/* Fault Status Registers */}
      {regs.faultStatus && regs.faultStatus.length > 0 && renderFaultRegisters(regs.faultStatus)}

      {/* Note about address format */}
      <div className="text-xs text-gray-400 dark:text-gray-500 p-2">
        💡 Click any address to copy it. All addresses are shown as documented in the manufacturer manual.
        Hex addresses may need conversion (e.g., 0x9C40 = 40000 decimal for some VFDs).
      </div>
    </div>
  );
}
