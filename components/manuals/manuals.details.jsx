"use client";
import { useEffect, useMemo, useState } from 'react';
import ImageCarousel from './image-carousel';
import PDFViewer from './pdf-viewer';

const TABS = [
  { id: 'overview', label: '📋 Overview', audiences: ['all', 'client'] },
  { id: 'electrician', label: '⚡ Wiring', audiences: ['electrician', 'all'] },
  { id: 'firmware', label: '💻 Modbus/Registers', audiences: ['firmware', 'all'] },
  { id: 'engineer', label: '🔧 Specs & Faults', audiences: ['engineer', 'all'] },
  { id: 'pdfs', label: '📄 PDFs', audiences: ['all'] },
];

export default function ManualDetails({ manual, defaultAudience }) {
  const pdfItems = useMemo(() => {
    const arr = Array.isArray(manual.pdfs) ? manual.pdfs : [];
    return arr.map((p, i) => ({
      key: i,
      label: typeof p === 'string' ? `PDF ${i + 1}` : (p?.label || p?.name || p?.title || `PDF ${i + 1}`),
      url: typeof p === 'string' ? p : (p?.url || p?.href || p?.path || p?.link || ''),
    })).filter(it => it.url);
  }, [manual.pdfs]);

  // Determine initial tab
  const initialTab = useMemo(() => {
    if (defaultAudience && defaultAudience !== 'all') {
      const match = TABS.find(t => t.audiences.includes(defaultAudience));
      if (match) return match.id;
    }
    return 'overview';
  }, [defaultAudience]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [pdfIdx, setPdfIdx] = useState(0);

  useEffect(() => { setPdfIdx(0); }, [manual.id]);

  const currentPdf = pdfItems[pdfIdx] || null;

  // Filter tabs based on available data
  const visibleTabs = useMemo(() => {
    return TABS.filter(tab => {
      if (tab.id === 'overview') return true;
      if (tab.id === 'electrician') return !!(manual.wiringSummary?.terminals || manual.images?.length > 0);
      if (tab.id === 'firmware') return !!(manual.modbusSummary || manual.registerSummary || manual.quickTest);
      if (tab.id === 'engineer') return !!(manual.installation?.length > 3 || manual.faultSummary);
      if (tab.id === 'pdfs') return pdfItems.length > 0;
      return true;
    });
  }, [manual, pdfItems]);

  return (
    <div className="space-y-5">
      {/* Title & description */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{manual.title}</h2>
        {manual.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{manual.description}</p>
        )}
      </div>

      {/* Details grid */}
      {manual.details && manual.details.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {manual.details.map((d, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <dt className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{d.label}</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{d.value}</dd>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <nav className="flex gap-0 -mb-px min-w-max">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Modbus Quick Summary */}
            {manual.modbusSummary && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">🔌 Modbus RTU Quick Settings</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-gray-800/50">
                    <span className="text-gray-400">Baud Rate:</span>
                    <span className="ml-1 font-mono font-medium text-gray-900 dark:text-gray-100">{manual.modbusSummary.baudRate} bps</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-800/50">
                    <span className="text-gray-400">Parity:</span>
                    <span className="ml-1 font-mono font-medium text-gray-900 dark:text-gray-100">{manual.modbusSummary.parity}</span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-gray-800/50">
                    <span className="text-gray-400">Slave ID Param:</span>
                    <span className="ml-1 font-mono font-medium text-gray-900 dark:text-gray-100">{manual.modbusSummary.slaveIdParam}</span>
                  </div>
                </div>
                {manual.modbusSummary.powerCycleRequired && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">⚠️ Power cycle required after changing communication parameters.</p>
                )}
                {manual.modbusSummary.quickSteps?.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Show setup steps ({manual.modbusSummary.quickSteps.length})</summary>
                    <ol className="mt-1 ml-4 list-decimal text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      {manual.modbusSummary.quickSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </details>
                )}
              </div>
            )}

            {/* Installation */}
            {manual.installation?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">🔧 Quick Installation Checklist</h3>
                <ol className="space-y-1.5">
                  {manual.installation.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Remarks */}
            {manual.remarks && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">💡 Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{manual.remarks}</p>
              </div>
            )}

            {/* Images */}
            {manual.images?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">🖼️ Reference Images</h3>
                <ImageCarousel images={manual.images} />
              </div>
            )}

            {/* Quick test */}
            {manual.quickTest?.readCommand && (
              <div className="p-3 rounded-lg bg-gray-900 dark:bg-gray-950">
                <p className="text-xs text-gray-400 mb-1">🧪 Quick Test Command:</p>
                <code className="text-xs text-green-400 font-mono break-all">{manual.quickTest.readCommand}</code>
              </div>
            )}
          </div>
        )}

        {/* Electrician Tab - Wiring */}
        {activeTab === 'electrician' && (
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">⚡ RS-485 Wiring & Termination</h3>

            {manual.wiringSummary && (
              <>
                {/* Terminals */}
                {manual.wiringSummary.terminals && Object.keys(manual.wiringSummary.terminals).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(manual.wiringSummary.terminals).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{k}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connector types */}
                {manual.wiringSummary.connectorTypes?.length > 0 && (
                  <div className="space-y-2">
                    {manual.wiringSummary.connectorTypes.map((ct, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ct.type}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">{ct.pins}</p>
                        {ct.note && <p className="text-xs text-gray-400 mt-1">{ct.note}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Termination */}
                <div className={`p-4 rounded-xl border ${
                  manual.wiringSummary.builtInTermination
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                  <p className="font-semibold text-sm mb-1">
                    {manual.wiringSummary.builtInTermination
                      ? '✅ Built-in termination available'
                      : '⚠️ NO built-in termination — External 120Ω resistors REQUIRED'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {manual.wiringSummary.terminationValue} · {manual.wiringSummary.terminationPlacement}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cable: {manual.wiringSummary.cableType}
                  </p>
                  {manual.wiringSummary.note && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{manual.wiringSummary.note}</p>
                  )}
                </div>
              </>
            )}

            {/* Images */}
            {manual.images?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">🖼️ Wiring Diagrams & Pinouts</h3>
                <ImageCarousel images={manual.images} />
              </div>
            )}

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-xs text-gray-500 dark:text-gray-400">
              💡 <strong>Universal rule:</strong> 120Ω termination at BOTH ends of RS-485 bus. Shield grounded at ONE end (master side). Use shielded twisted pair, keep away from power cables.
            </div>
          </div>
        )}

        {/* Firmware Engineer Tab */}
        {activeTab === 'firmware' && (
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">💻 Modbus Register Map & Control</h3>

            {/* Quick Setup */}
            {manual.modbusSummary?.quickSteps?.length > 0 && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 text-sm">✅ Setup Steps</h4>
                <ol className="space-y-1">
                  {manual.modbusSummary.quickSteps.map((s, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-400 flex gap-2">
                      <span className="text-xs min-w-[18px]">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Control Registers */}
            {manual.registerSummary?.control?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">🎮 Control Registers (Read/Write)</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {manual.registerSummary.control.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">{r.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monitor Registers */}
            {manual.registerSummary?.monitor?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">📊 Monitor Registers (Read-Only)</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Address</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {manual.registerSummary.monitor.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-blue-600 dark:text-blue-400">{r.address}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{r.unit || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Test */}
            {manual.quickTest && (
              <div className="p-4 rounded-xl bg-gray-900 dark:bg-gray-950">
                <h4 className="text-sm text-gray-300 mb-2">🧪 Communication Verification</h4>
                <p className="text-xs text-gray-400 mb-1">{manual.quickTest.description}</p>
                {manual.quickTest.readCommand && (
                  <code className="block p-2 rounded bg-gray-800 text-green-400 text-xs font-mono break-all">
                    {manual.quickTest.readCommand}
                  </code>
                )}
                {manual.quickTest.note && (
                  <p className="text-xs text-amber-400 mt-1">{manual.quickTest.note}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Engineer Tab */}
        {activeTab === 'engineer' && (
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">🔧 Specifications & Fault Codes</h3>

            {/* Installation */}
            {manual.installation?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">📝 Full Installation Guide</h4>
                <ol className="space-y-1.5">
                  {manual.installation.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Fault Codes */}
            {manual.faultSummary && Object.keys(manual.faultSummary).length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 text-sm">⚠️ Fault Codes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(manual.faultSummary).map(([code, desc]) => (
                    <div key={code} className="flex items-start gap-2 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                      <code className="text-xs font-mono font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">{code}</code>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {manual.remarks && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">💡 Engineering Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{manual.remarks}</p>
              </div>
            )}
          </div>
        )}

        {/* PDFs Tab */}
        {activeTab === 'pdfs' && pdfItems.length > 0 && (
          <div>
            {pdfItems.length > 1 && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Document:</label>
                <select
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                  value={pdfIdx}
                  onChange={(e) => setPdfIdx(Number(e.target.value))}
                >
                  {pdfItems.map((p, i) => (
                    <option key={p.key} value={i}>{p.label}</option>
                  ))}
                </select>
                <a
                  href={currentPdf?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium"
                >
                  Open in New Tab ↗
                </a>
              </div>
            )}
            {currentPdf && (
              <PDFViewer key={currentPdf.url} url={currentPdf.url} title={manual.title} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

