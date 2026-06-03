import Link from 'next/link';
import { readFileSync } from 'fs';
import { join } from 'path';
import UniversalReference from '../components/vfd/universal-reference';
import VfdSearchBox from '../components/vfd/vfd-search-box';

function getVfdData() {
  const raw = readFileSync(join(process.cwd(), 'data', 'vfd.json'), 'utf-8');
  return JSON.parse(raw);
}

export default function HomePage() {
  const data = getVfdData();
  const models = Object.values(data.models);
  const sorted = [...models].sort((a, b) => b.unitsDeployed - a.unitsDeployed);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          VFD Modbus Communication Hub
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          Quick-reference Modbus RTU settings, RS-485 wiring diagrams, register maps,
          and fault codes for every VFD in your facility. Built for operators.
        </p>
        <VfdSearchBox />
      </section>

      {/* Stats bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'VFD Families', value: models.length },
          { label: 'Total Units', value: models.reduce((s, m) => s + m.unitsDeployed, 0) },
          { label: 'Manufacturers', value: new Set(models.map(m => m.manufacturer)).size },
          { label: 'Production Areas', value: 7 },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Universal Reference (collapsible) */}
      <UniversalReference universal={data.universal} />

      {/* Model grid */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">VFD Models</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(model => (
            <Link
              key={model.id}
              href={`/vfd/${model.id}`}
              data-vfd-card
              data-search-text={`${model.title.toLowerCase()} ${model.manufacturer.toLowerCase()} ${model.id.toLowerCase()} ${(model.locations || []).join(' ').toLowerCase()}`}
              className="card p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {model.title}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                  {model.unitsDeployed} unit{model.unitsDeployed !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{model.manufacturer}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(model.locations || []).slice(0, 3).map(loc => (
                  <span key={loc} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {loc}
                  </span>
                ))}
                {(model.locations || []).length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    +{model.locations.length - 3} more
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {model.pdfs?.length || 0} PDFs
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  {(model.registerMap?.monitor?.length || 0) + (model.registerMap?.control?.length || 0)} registers
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                  View details →
                </span>
                <span className="text-[10px] text-gray-400">{model.voltage}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
