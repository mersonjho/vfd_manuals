import React from 'react'

export default function Footer(){
  return (
    <footer className="bg-slate-50 border-t">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-slate-500">
        <div>© {new Date().getFullYear()} Manual Portal</div>
        <div className="space-x-4">
          <a className="hover:underline" href="#">Privacy</a>
          <a className="hover:underline" href="#">Terms</a>
        </div>
      </div>
    </footer>
  )
}
