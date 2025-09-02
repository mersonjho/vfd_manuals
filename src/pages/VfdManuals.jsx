import React, { useState, useMemo, useRef } from 'react'
import models from '../data/models'

function SearchBar({value, onChange}){
  return (
    <div className="mb-4">
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search by model, type, or notes" className="w-full border rounded-md px-3 py-2 shadow-sm" />
    </div>
  )
}

function CardList({items, onSelect, selectedId}){
  return (
    <div className="space-y-3">
      {items.map(m=> {
        const active = selectedId === m.id
        return (
          <div key={m.id} onClick={()=>onSelect(m)} className={`cursor-pointer bg-white rounded-md p-4 hover:shadow-md transition ${active ? 'border-l-4 border-indigo-600 bg-indigo-50' : 'border'} `}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{m.model}</div>
                <div className="text-sm text-slate-500">{m.type} • {m.power}</div>
              </div>
              <div className="text-sm text-slate-400">{active ? 'Open' : 'View'}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailPane({model}){
  const [imgIndex, setImgIndex] = useState(0)
  const pdfRef = useRef(null)
  const imgWrapperRef = useRef(null)

  if(!model) return <div className="text-slate-500">Select a model to view details</div>

  const openPdfFullscreen = async () => {
    const el = pdfRef.current
    if(!el) return
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    }
  }

  const openImageFullscreen = async () => {
    const el = imgWrapperRef.current
    if(!el) return
    if (el.requestFullscreen) {
      await el.requestFullscreen()
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    }
  }

  const prevImage = () => setImgIndex(i => (i - 1 + model.images.length) % model.images.length)
  const nextImage = () => setImgIndex(i => (i + 1) % model.images.length)

  // keyboard navigation
  React.useEffect(()=>{
    const onKey = (e)=>{
      if(e.key === 'ArrowLeft') prevImage()
      if(e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[model])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-md p-6 shadow">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="relative bg-slate-100 rounded-md p-2 mb-4 flex items-center justify-center" style={{height: 'calc(100vh - 260px)'}}>
              <div ref={imgWrapperRef} className="w-full h-full flex items-center justify-center">
                <img src={model.images[imgIndex]} alt={model.model} className="max-h-full max-w-full object-contain" />
              </div>

              <button onClick={prevImage} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white px-3 py-2 rounded-md shadow">
                ‹
              </button>
              <button onClick={nextImage} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white px-3 py-2 rounded-md shadow">
                ›
              </button>

              <div className="absolute right-3 top-3 flex gap-2">
                <button onClick={openImageFullscreen} className="text-sm px-3 py-1 rounded-md border bg-white/90">Image Fullscreen</button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto">
              {model.images.map((src,i)=> (
                <button key={i} onClick={()=>setImgIndex(i)} className={`flex-shrink-0 w-32 h-20 overflow-hidden rounded-md ${i===imgIndex ? 'ring-2 ring-indigo-300' : 'bg-slate-50'}`}>
                  <img src={src} alt={`${model.model}-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-96 flex-shrink-0">
            <h3 className="text-2xl font-semibold text-slate-900">{model.model}</h3>
            <p className="text-slate-600 mt-2">{model.description}</p>

            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700">
              <div><strong>Type:</strong> {model.type}</div>
              <div><strong>Power:</strong> {model.power}</div>
              <div><strong>Voltage:</strong> {model.voltage}</div>
              <div><strong>Current:</strong> {model.current}</div>
              <div><strong>Notes:</strong> {model.notes}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Manual</h4>
          <div className="flex items-center gap-2">
            <button onClick={openPdfFullscreen} className="text-sm px-3 py-1 rounded-md border hover:bg-slate-50">Manual Fullscreen</button>
          </div>
        </div>

  <div ref={pdfRef} className="w-full border rounded overflow-hidden" style={{height: 'calc(100vh - 180px)'}}>
          <iframe src={model.pdf} title="manual" className="w-full h-full" />
        </div>
      </div>
    </div>
  )
}

export default function VfdManuals(){
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(models[0])

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if(!q) return models
    return models.filter(m=> [m.model,m.type,m.power,m.notes].join(' ').toLowerCase().includes(q))
  },[query])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-28">
        <div className="mb-4">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        <div className="mt-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <CardList items={filtered} onSelect={setSelected} selectedId={selected?.id} />
        </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <DetailPane model={selected} />
      </div>
    </div>
  )
}
