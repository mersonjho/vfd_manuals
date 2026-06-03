"use client";
import { useMemo, useState } from 'react';

/**
 * PDF viewer using browser's native PDF engine via <object> tag.
 * Falls back to iframe for browsers that don't support <object> PDF embedding.
 * No sandbox — same-origin PDFs from /public/ and /api/pdf proxy work natively.
 */
export default function PDFViewer({ url, title }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Normalize URL
  const src = useMemo(() => {
    if (typeof window === 'undefined') return url;
    const isAbs = /^https?:\/\//i.test(url);
    const absolute = isAbs ? url : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
    try {
      const u = new URL(absolute);
      if (u.origin !== window.location.origin) {
        return `/api/pdf?url=${encodeURIComponent(absolute)}`;
      }
    } catch {}
    return absolute;
  }, [url]);

  // Lock body scroll in fullscreen
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
  }

  const btn = 'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 dark:bg-gray-950 flex flex-col' : 'flex flex-col'}>
      {/* ---- Toolbar ---- */}
      <div className={`flex flex-wrap items-center justify-between gap-2 ${isFullscreen ? 'px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0' : 'mb-2'}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {title && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[40vw] sm:max-w-[30vw]" title={title}>{title}</span>}
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded hidden sm:inline">PDF</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className={btn} onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
            {isFullscreen ? '✕ Close' : '⛶ Fullscreen'}
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer" className={btn} title="Open in new tab">↗ New Tab</a>
          <a href={src} download className={`${btn} !bg-blue-100 dark:!bg-blue-900/40 !text-blue-700 dark:!text-blue-300 hover:!bg-blue-200 dark:hover:!bg-blue-900/60`} title="Download">⬇ Download</a>
        </div>
      </div>

      {/* ---- Viewer area ---- */}
      <div className={
        isFullscreen
          ? 'flex-1 w-full bg-white'
          : 'h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[75vh] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white'
      }>
        {loadError ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cannot preview in-browser</p>
              <p className="text-xs text-gray-500 mb-4">Your browser may block embedded PDFs. Use the options below.</p>
              <div className="flex gap-2 justify-center">
                <a href={src} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Open in New Tab ↗</a>
                <a href={src} download className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">Download ⬇</a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* <object> is the most reliable cross-browser way to embed PDFs.
                 Falls back gracefully — if the browser can't render PDF inline,
                 it shows the fallback content. No sandbox, no CSP issues. */}
            <object
              data={src}
              type="application/pdf"
              className="w-full h-full"
              onError={() => setLoadError(true)}
            >
              {/* Fallback: iframe (works in Chrome/Edge/Safari) */}
              <iframe
                src={src}
                className="w-full h-full"
                style={{ border: 'none' }}
                title={title || 'PDF Document'}
                onError={() => setLoadError(true)}
              />
            </object>
          </>
        )}
      </div>

      {!isFullscreen && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          💡 Ctrl+F to search &middot; Pinch to zoom on mobile &middot; Use Fullscreen for best reading
        </p>
      )}
    </div>
  );
}

