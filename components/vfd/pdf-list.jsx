'use client';
import { useState } from 'react';
import PDFViewer from '../manuals/pdf-viewer';

export default function PdfList({ model }) {
  const pdfs = model.pdfs || [];
  const images = model.images || [];
  const wiring = model.rs485Wiring;
  const [activePdfIdx, setActivePdfIdx] = useState(0);

  const wiringImages = [
    ...(wiring?.terminationImages || []),
    wiring?.pinoutImage,
    wiring?.notesImage
  ].filter(Boolean);

  const allImages = [...new Set([...images, ...wiringImages])];
  const currentPdf = pdfs[activePdfIdx];

  return (
    <div className="space-y-6">
      {/* PDF Viewer */}
      {pdfs.length > 0 && currentPdf ? (
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className="text-sm text-gray-600 dark:text-gray-300 font-medium flex-shrink-0">Document:</label>
            <select
              value={activePdfIdx}
              onChange={(e) => setActivePdfIdx(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 flex-1 min-w-0"
            >
              {pdfs.map((pdf, i) => (
                <option key={i} value={i}>{pdf.label || `PDF ${i + 1}`}</option>
              ))}
            </select>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <PDFViewer
              key={currentPdf.url}
              url={currentPdf.url}
              title={currentPdf.label || model.title}
            />
          </div>

          <details className="mt-3">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              📄 All {pdfs.length} PDFs — quick links
            </summary>
            <div className="mt-2 space-y-1">
              {pdfs.map((pdf, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setActivePdfIdx(i)}
                    className={`hover:underline text-left truncate ${i === activePdfIdx ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    {i + 1}. {pdf.label || `PDF ${i + 1}`}
                  </button>
                  <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex-shrink-0 ml-auto">
                    ↗ Open
                  </a>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <div className="card p-4 text-sm text-gray-500">No PDFs available for this model.</div>
      )}

      {/* Images Gallery */}
      {allImages.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            🖼️ Wiring & Reference Images ({allImages.length})
          </h3>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allImages.map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <a href={img} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img}
                    alt={`Reference image ${i + 1}`}
                    className="w-full h-auto object-contain max-h-64"
                    loading="lazy"
                  />
                </a>
                <p className="text-[10px] text-gray-400 p-2 truncate">{img.split('/').pop()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
