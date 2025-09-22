"use client";
import ImageCarousel from './image-carousel';
import PDFViewer from './pdf-viewer';
import { useEffect, useMemo, useState } from 'react';

export default function ManualDetails({ manual }) {
  // Normalize PDFs: support manual.pdf (string) or manual.pdfs as array of strings or objects with url/href/path/link
  const pdfItems = useMemo(() => {
    const arr = Array.isArray(manual.pdfs) ? manual.pdfs : [];
    const items = (arr.length > 0 ? arr : (manual.pdf ? [manual.pdf] : [])).map((p, i) => {
      const type = typeof p;
      const url = type === 'string' ? p : (p?.url || p?.href || p?.path || p?.link || '');
      const label = type === 'string' ? `PDF ${i + 1}` : (p?.label || p?.name || p?.title || `PDF ${i + 1}`);
      return { key: i, label, url };
    }).filter(it => typeof it.url === 'string' && it.url.length > 0);
    return items;
  }, [manual.pdfs, manual.pdf]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Clamp/reset active index when pdfItems change (e.g., switching manuals)
  useEffect(() => {
    if (activeIdx >= pdfItems.length) setActiveIdx(0);
  }, [pdfItems.length, activeIdx]);
  const currentPdf = pdfItems.length > 0 ? (pdfItems[activeIdx] || pdfItems[0]) : null;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-lg lg:text-2xl font-semibold">{manual.title}</h2>
        {manual.description && (
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mt-1">{manual.description}</p>
        )}
      </div>

      {manual.details && manual.details.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          {manual.details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <dt className="text-sm lg:text-base text-gray-500 w-40 lg:w-48">{d.label}</dt>
              <dd className="text-sm lg:text-base font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {manual.images && manual.images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Images</h3>
          </div>
          <ImageCarousel images={manual.images} />
        </div>
      )}

      {manual.installation && manual.installation.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 lg:mb-3">Installation</h3>
          <ol className="list-decimal ml-5 space-y-1 lg:space-y-1.5 text-sm lg:text-base">
            {manual.installation.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {manual.remarks && (
        <div>
          <h3 className="font-medium mb-2 lg:mb-3">Remarks</h3>
          <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300">{manual.remarks}</p>
        </div>
      )}

      {pdfItems.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 lg:mb-3">PDF</h3>
          {pdfItems.length > 1 && (
            <div className="mb-2 flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Document:</label>
              <select
                className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                value={activeIdx}
                onChange={(e) => setActiveIdx(Number(e.target.value))}
              >
                {pdfItems.map((p, i) => (
                  <option key={p.key} value={i}>{p.label}</option>
                ))}
              </select>
            </div>
          )}
          {currentPdf && currentPdf.url && (
            // Force remount on URL change so the viewer resets scroll to top
            <PDFViewer key={currentPdf.url} url={currentPdf.url} title={manual.title} />
          )}
        </div>
      )}
    </div>
  );
}
