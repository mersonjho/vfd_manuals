import React from 'react'

export default function Home(){
  return (
    <section className="space-y-8">
      <div className="bg-white rounded-lg shadow p-10 flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <h2 className="text-3xl font-semibold text-slate-900">Reliable VFD documentation — organized and ready</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">Centralize your variable frequency drive manuals, diagrams, and important model specifications. Built for technicians and engineers who need quick, accurate information.</p>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700">Browse Manuals</button>
            <button className="px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50">Request a Manual</button>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-slate-50 rounded-md p-4 border">
          <div className="text-sm text-slate-500">System status</div>
          <div className="mt-3 text-lg font-medium text-slate-800">All services operational</div>
          <div className="mt-4 text-sm text-slate-500">Notifications and scheduled maintenance will appear here.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h4 className="text-lg font-semibold">Search</h4>
          <p className="text-sm text-slate-500 mt-2">Quickly locate manuals by model, type, or power.</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h4 className="text-lg font-semibold">Team Access</h4>
          <p className="text-sm text-slate-500 mt-2">Manage who can view and edit manuals.</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h4 className="text-lg font-semibold">Integrations</h4>
          <p className="text-sm text-slate-500 mt-2">Planned: API and database synchronization.</p>
        </div>
      </div>
    </section>
  )
}
