'use client';

export default function Rs485Wiring({ model, universal }) {
  const wiring = model.rs485Wiring;

  return (
    <div className="space-y-6">
      {/* Wiring Terminals */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">🔌 RS-485 Terminal Connections</h3>

        {/* Connector types */}
        {(wiring?.connectorTypes || (wiring?.terminals ? [{terminals: wiring.terminals}] : [])).length > 0 && (
          <div className="space-y-3 mb-4">
            {(wiring?.connectorTypes || [{type: 'Terminal Block', pins: `A+: ${wiring?.terminals?.A_plus || 'N/A'}, B-: ${wiring?.terminals?.B_minus || 'N/A'}`, note: wiring?.cableType || ''}]).map((conn, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{conn.type}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">{conn.pins}</p>
                {conn.note && <p className="text-xs text-gray-400 mt-1">{conn.note}</p>}
              </div>
            ))}
          </div>
        )}

        {!wiring?.connectorTypes && wiring?.terminals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {Object.entries(wiring.terminals).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">{k}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Termination */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">⏚ Termination</h3>
        <div className={`p-4 rounded-lg border ${
          wiring?.builtInTermination
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <p className="text-sm font-semibold mb-1">
            {wiring?.builtInTermination
              ? '✅ Built-in termination available'
              : '⚠️ NO built-in termination — MUST use external 120Ω resistors'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {wiring?.terminationNote || `${wiring?.requiresExternalTermination ? wiring?.terminationValue + '. ' + wiring?.terminationPlacement : ''}`}
          </p>
          {wiring?.terminationMethod && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{wiring.terminationMethod}</p>
          )}
        </div>
      </div>

      {/* Universal Reference */}
      <div className="card p-5 bg-gray-50 dark:bg-gray-800/30 border-dashed">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">📋 Universal RS-485 Reference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <p className="text-gray-500">Cable: {universal?.cable || 'Shielded twisted pair'}</p>
          <p className="text-gray-500">Termination: {universal?.termination || '120Ω at both ends'}</p>
          <p className="text-gray-500">Topology: {universal?.topology || 'Multi-drop daisy chain'}</p>
          <p className="text-gray-500">Max Distance: {universal?.maxDistance || '~1000m @ 9600 bps'}</p>
        </div>
      </div>

      {/* Images */}
      {wiring?.terminationImages && wiring.terminationImages.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">🖼️ Termination & Wiring Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wiring.terminationImages.map((img, i) => (
              <img key={i} src={img} alt={`Termination diagram ${i + 1}`} className="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
            ))}
            {wiring.pinoutImage && (
              <img src={wiring.pinoutImage} alt="RS-485 Pinout" className="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
            )}
            {wiring.notesImage && (
              <img src={wiring.notesImage} alt="RS-485 Notes" className="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
            )}
          </div>
        </div>
      )}

      {/* Model images from model.images */}
      {model.images && model.images.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">🖼️ Wiring Reference Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {model.images.map((img, i) => (
              <img key={i} src={img} alt={`Wiring diagram ${i + 1}`} className="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        </div>
      )}

      {model.note && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">{model.note}</p>
        </div>
      )}
    </div>
  );
}
