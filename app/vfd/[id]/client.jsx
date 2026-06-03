'use client';
import { useState } from 'react';
import Link from 'next/link';
import ModbusSettings from '../../../components/vfd/modbus-settings';
import Rs485Wiring from '../../../components/vfd/rs485-wiring';
import RegisterTable from '../../../components/vfd/register-table';
import FaultCodes from '../../../components/vfd/fault-codes';
import PdfList from '../../../components/vfd/pdf-list';

const TABS = [
  { id: 'modbus', label: 'Modbus Setup' },
  { id: 'wiring', label: 'RS-485 Wiring' },
  { id: 'registers', label: 'Register Map' },
  { id: 'faults', label: 'Fault Codes' },
  { id: 'pdfs', label: 'PDFs & Images' },
];

export default function VfdDetailClient({ model, universal }) {
  const [activeTab, setActiveTab] = useState('modbus');

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link href="/" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block">
          ← Back to all VFDs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {model.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {model.manufacturer} · {model.family} · {model.voltage}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
              {model.unitsDeployed} unit{model.unitsDeployed !== 1 ? 's' : ''} deployed
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {model.communicationPorts?.[0] || 'RS-485'}
            </span>
          </div>
        </div>
        {(model.locations || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {model.locations.map(loc => (
              <span key={loc} className="text-[10px] px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                📍 {loc}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <nav className="flex gap-0 -mb-px min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
      <div className="min-h-[400px]">
        {activeTab === 'modbus' && <ModbusSettings model={model} />}
        {activeTab === 'wiring' && <Rs485Wiring model={model} universal={universal} />}
        {activeTab === 'registers' && <RegisterTable model={model} />}
        {activeTab === 'faults' && <FaultCodes model={model} />}
        {activeTab === 'pdfs' && <PdfList model={model} />}
      </div>
    </div>
  );
}
