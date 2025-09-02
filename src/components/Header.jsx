import React from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Header(){
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold">MP</div>
            <div>
              <div className="text-lg font-semibold text-slate-900">Manual Portal</div>
              <div className="text-xs text-slate-500">VFD manuals & documentation</div>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <NavLink end to="/" className={({isActive}) => isActive ? 'text-indigo-600 font-semibold nav-active px-2 py-1 rounded' : 'text-slate-600 hover:text-slate-900 px-2 py-1 rounded'}>Home</NavLink>
          <NavLink to="/vfd" className={({isActive}) => isActive ? 'text-indigo-600 font-semibold nav-active px-2 py-1 rounded' : 'text-slate-600 hover:text-slate-900 px-2 py-1 rounded'}>VFD Manuals</NavLink>
        </nav>
      </div>
    </header>
  )
}
