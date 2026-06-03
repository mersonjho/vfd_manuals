'use client';
import { useState } from 'react';

export default function ModbusSettings({ model }) {
  const s = model.modbusSettings;
  if (!s) return <p className="text-sm text-gray-500">No Modbus settings available for this model.</p>;

  const steps = s.quickSetupSteps || [];

  return (
    <div className="space-y-6">
      {/* Quick Setup Checklist */}
      {steps.length > 0 && (
        <div className="card p-5 border-l-4 border-l-green-500">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <span className="text-green-500">✅</span> Quick Setup Checklist
          </h3>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500 min-w-[24px]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Parameter Table */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          Communication Parameters
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Parameter</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Code</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Default</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Required / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { name: 'Baud Rate', param: s.baudRate?.parameter, def: s.baudRate?.default, note: s.baudRate?.options ? Object.entries(s.baudRate.options).map(([k,v]) => `${k}=${v}bps`).join(', ') : '' },
                { name: 'Parity / Format', param: s.parity?.parameter, def: s.parity?.default, note: s.parity?.options ? Object.entries(s.parity.options).map(([k,v]) => `${k}=${v}`).join(' | ') : '' },
                { name: 'Slave Address (Node ID)', param: s.slaveAddress?.parameter, def: s.slaveAddress?.default, note: `Range: ${s.slaveAddress?.range || '1-247'}` },
                { name: 'Run Command Source', param: s.runCommandSource?.parameter, def: s.runCommandSource?.description?.split('.')[0] || '', note: `Required: ${s.runCommandSource?.requiredValue || 'Modbus/RS-485'}. ${s.runCommandSource?.description || ''}` },
                { name: 'Frequency Command Source', param: s.frequencyCommandSource?.parameter, def: s.frequencyCommandSource?.description?.split('.')[0] || '', note: `Required: ${s.frequencyCommandSource?.requiredValue || 'Modbus/RS-485'}. ${s.frequencyCommandSource?.description || ''}` },
                { name: 'Comm Fault Timeout', param: s.commFaultTimeout?.parameter, def: s.commFaultTimeout?.default, note: s.commFaultTimeout?.note || `Range: ${s.commFaultTimeout?.range || '0.0-60.0s'}` },
                { name: 'Comm Fault Stop Method', param: s.commFaultStopMethod?.parameter, def: s.commFaultStopMethod?.default, note: s.commFaultStopMethod?.options ? Object.entries(s.commFaultStopMethod.options).map(([k,v]) => `${k}=${v}`).join(' | ') : '' },
              ].filter(row => row.param).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{row.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600 dark:text-blue-400">{row.param}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.def}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Power Cycle Warning */}
      {s.powerCycleRequired && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">⚠️ Power Cycle Required</p>
          <p className="text-sm text-red-700 dark:text-red-400">{s.powerCycleNote}</p>
        </div>
      )}

      {/* Standby Indicator */}
      {s.standbyIndicator && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">{s.standbyIndicator}</p>
        </div>
      )}

      {/* Enable Link note (FRENIC-specific) */}
      {s.enableLinkNote && (
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">🔗 Link Enable Required</p>
          <p className="text-sm text-purple-700 dark:text-purple-400">{s.enableLinkNote}</p>
        </div>
      )}

      {/* Fieldbus control note */}
      {s.fieldbusControl && (
        <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">This VFD uses a Fieldbus control architecture (CiA402 state machine). Refer to the Control Word (8501h) register for run/stop sequencing.</p>
        </div>
      )}

      {/* Quick Test */}
      {model.quickTest && (
        <div className="card p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">🧪 Quick Communication Test</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{model.quickTest.description}</p>
          {model.quickTest.readCommand && (
            <code className="block p-2 rounded bg-gray-900 dark:bg-gray-950 text-green-400 text-xs font-mono break-all">
              {model.quickTest.readCommand}
            </code>
          )}
          {model.quickTest.note && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{model.quickTest.note}</p>
          )}
        </div>
      )}

      {/* Default note */}
      {s.note && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400">{s.note}</p>
        </div>
      )}
    </div>
  );
}
