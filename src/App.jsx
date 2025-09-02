import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import VfdManuals from './pages/VfdManuals'
import Header from './components/Header'
import Footer from './components/Footer'

export default function App(){
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/vfd" element={<VfdManuals/>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
