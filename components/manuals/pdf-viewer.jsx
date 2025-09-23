"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

// Consistent, multi-page PDF viewer using pdf.js with virtualization and responsive UI
export default function PDFViewer({ url, title }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [userScale, setUserScale] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Normalize to same-origin via API route for external URLs
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

  useEffect(() => {
    let canceled = false;
    let pdfDoc = null;
    let resizeObserver = null;
    let io = null;
    let firstPageSize = { width: 0, height: 0 }; // at scale 1
    const renderTasks = new Map(); // pageNum -> RenderTask
    let refreshing = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pdfjs = await import('pdfjs-dist');
        const { getDocument, GlobalWorkerOptions } = pdfjs;
        const isProd = process.env.NODE_ENV === 'production';
        const workerCdnUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
        if (isProd) {
          try { GlobalWorkerOptions.workerSrc = workerCdnUrl; } catch {}
        } else {
          try { GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString(); } catch {}
        }

        let loadingTask;
        try {
          loadingTask = getDocument({ url: src });
          pdfDoc = await loadingTask.promise;
        } catch (err) {
          const msg = String(err?.message || err || '');
          if (/GlobalWorkerOptions\.workerSrc/i.test(msg) || /No\s+"GlobalWorkerOptions\.workerSrc"/i.test(msg)) {
            loadingTask = getDocument({ url: src, disableWorker: true });
            pdfDoc = await loadingTask.promise;
          } else {
            throw err;
          }
        }
        if (canceled) return;
        setPageCount(pdfDoc.numPages);

        const container = containerRef.current;
        if (!container) return;

        // Measure base width/height for fit-width math
        const first = await pdfDoc.getPage(1);
        const firstViewport = first.getViewport({ scale: 1 });
        firstPageSize = { width: firstViewport.width, height: firstViewport.height };

        function fitWidthScale(hostEl) {
          const width = hostEl ? hostEl.clientWidth - 24 : 600;
          return Math.max(0.5, Math.min(3, width / firstPageSize.width));
        }

        // Create virtualization wrappers
        function ensureWrappers() {
          if (container.children.length === pdfDoc.numPages) return;
          container.innerHTML = '';
          const hostEl = container.parentElement;
          const baseScale = fitWidthScale(hostEl) * userScale;
          const estHeight = firstPageSize.height * baseScale;
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const wrapper = document.createElement('div');
            wrapper.dataset.page = String(i);
            wrapper.style.display = 'block';
            wrapper.style.marginBottom = '16px';
            wrapper.style.height = `${Math.ceil(estHeight)}px`;
            container.appendChild(wrapper);
          }
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        function cancelRender(pageNum) {
          const task = renderTasks.get(pageNum);
          if (task && typeof task.cancel === 'function') {
            try { task.cancel(); } catch {}
          }
          renderTasks.delete(pageNum);
        }

        async function renderPage(pageNum, scale) {
          const wrapper = container.children[pageNum - 1];
          if (!wrapper) return;
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          let canvas = wrapper.querySelector('canvas');
          if (!canvas) {
            canvas = document.createElement('canvas');
            wrapper.appendChild(canvas);
            canvas.style.background = '#ffffff';
            canvas.style.boxShadow = '0 0 4px rgba(0,0,0,0.12)';
          }
          const targetCssW = Math.ceil(viewport.width);
          const targetCssH = Math.ceil(viewport.height);
          const targetPxW = Math.ceil(viewport.width * dpr);
          const targetPxH = Math.ceil(viewport.height * dpr);
          canvas.style.width = `${targetCssW}px`;
          canvas.style.height = `${targetCssH}px`;
          canvas.width = targetPxW;
          canvas.height = targetPxH;
          wrapper.style.height = `${Math.ceil(viewport.height)}px`;
          const ctx = canvas.getContext('2d', { alpha: false });
          const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
          cancelRender(pageNum);
          const task = page.render({ canvasContext: ctx, viewport, transform });
          renderTasks.set(pageNum, task);
          try {
            await task.promise;
          } catch (err) {
            const msg = String(err?.message || err || '');
            if (!/cancel/i.test(msg)) throw err;
          } finally {
            const current = renderTasks.get(pageNum);
            if (current === task) renderTasks.delete(pageNum);
          }
        }

        function getTopAnchor() {
          const host = container.parentElement;
          if (!host || container.children.length === 0) return { idx: 0, frac: 0, leftRatio: 0 };
          const scrollTop = host.scrollTop;
          const children = Array.from(container.children);
          const idx = children.findIndex(el => el.offsetTop + el.offsetHeight > scrollTop);
          const topIdx = idx === -1 ? children.length - 1 : idx;
          const refEl = children[topIdx];
          const offPx = Math.max(0, scrollTop - refEl.offsetTop);
          const frac = refEl.offsetHeight > 0 ? Math.min(1, offPx / refEl.offsetHeight) : 0;
          const denom = Math.max(1, container.scrollWidth - host.clientWidth);
          const leftRatio = denom > 0 ? host.scrollLeft / denom : 0;
          return { idx: topIdx, frac, leftRatio };
        }

        function restoreAnchor(idx, frac, leftRatio) {
          const host = container.parentElement;
          if (!host) return;
          const children = Array.from(container.children);
          const safeIdx = Math.min(idx, children.length - 1);
          const el = children[safeIdx];
          if (el) {
            const targetTop = el.offsetTop + frac * el.offsetHeight;
            const maxTop = Math.max(0, container.scrollHeight - host.clientHeight);
            host.scrollTop = Math.max(0, Math.min(targetTop, maxTop));
          }
          const denomNew = Math.max(1, container.scrollWidth - host.clientWidth);
          host.scrollLeft = Math.max(0, Math.min(leftRatio * denomNew, denomNew));
        }

        function setupIO(scale) {
          const host = container.parentElement;
          if (io) io.disconnect();
          io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              const el = entry.target;
              const pageNum = Number(el.dataset.page);
              if (refreshing) return;
              if (entry.isIntersecting) {
                renderPage(pageNum, scale);
              } else {
                const visibleTop = host.scrollTop;
                const idx = pageNum - 1;
                const distance = Math.abs(idx - Math.floor(visibleTop / (el.offsetHeight + 16)));
                if (distance > 10) {
                  cancelRender(pageNum);
                  const canvas = el.querySelector('canvas');
                  if (canvas) canvas.remove();
                }
              }
            });
          }, { root: host, rootMargin: '1000px 0px 1000px 0px', threshold: [0, 0.01, 0.5, 0.99, 1] });

          Array.from(container.children).forEach(ch => io.observe(ch));
        }

        // Initialize
        ensureWrappers();
        const host = container.parentElement;
        const initialScale = fitWidthScale(host) * userScale;
        setupIO(initialScale);
        const initialCount = Math.min(5, pdfDoc.numPages);
        for (let i = 1; i <= initialCount; i++) {
          await renderPage(i, initialScale);
        }

        async function refreshScale() {
          const anchor = getTopAnchor();
          refreshing = true;
          container.style.visibility = 'hidden';
          const newScale = fitWidthScale(container.parentElement) * userScale;
          const estHeight = firstPageSize.height * newScale;
          Array.from(container.children).forEach((el, idx) => {
            el.style.height = `${Math.ceil(estHeight)}px`;
            cancelRender(idx + 1);
          });
          setupIO(newScale);
          const start = Math.max(1, anchor.idx + 1 - 2);
          const end = Math.min(pdfDoc.numPages, anchor.idx + 1 + 6);
          for (let p = start; p <= end; p++) {
            await renderPage(p, newScale);
          }
          restoreAnchor(anchor.idx, anchor.frac, anchor.leftRatio);
          container.style.visibility = 'visible';
          refreshing = false;
        }

        resizeObserver = new ResizeObserver(async () => {
          if (canceled) return;
          await refreshScale();
        });
        if (host) resizeObserver.observe(host);

      } catch (e) {
        if (!canceled) setError(e?.message || 'Failed to load PDF');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
      try { resizeObserver?.disconnect(); } catch {}
      try { io?.disconnect?.(); } catch {}
      try { renderTasks.forEach(task => { try { task.cancel?.(); } catch {} }); } catch {}
      try { pdfDoc?.destroy?.(); } catch {}
    };
  }, [src, userScale]);

  // Fullscreen: lock body scroll and allow ESC to exit
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    }
    const onKey = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev || '';
    };
  }, [isFullscreen]);

  function scrollToPage(n) {
    const container = containerRef.current;
    if (!container || pageCount <= 0) return;
    const host = container.parentElement;
    const idx = Math.max(0, Math.min(pageCount - 1, (Number(n) || 1) - 1));
    const target = container.children[idx];
    if (host && target) {
      host.scrollTop = target.offsetTop;
    }
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col p-2 md:p-3' : ''}>
      {/* Toolbar: responsive and wraps to avoid overlap on mobile */}
      <div className={`flex flex-wrap items-center justify-between mb-2 gap-2 ${isFullscreen ? 'sticky top-0 z-10 bg-white dark:bg-gray-950 pb-2' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {title && <div className="text-sm font-medium truncate max-w-[60vw] sm:max-w-[40vw]" title={title}>{title}</div>}
          {pageCount > 0 && <div className="text-xs text-gray-500 shrink-0">{pageCount} page{pageCount>1?'s':''}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-1 text-xs" onSubmit={(e) => { e.preventDefault(); scrollToPage(pageInput); }}>
            <span className="hidden sm:inline">Page</span>
            <input className="w-12 sm:w-14 px-2 py-1 border rounded bg-white dark:bg-gray-900" type="number" min={1} max={Math.max(1, pageCount)} value={pageInput} onChange={(e) => setPageInput(e.target.value)} disabled={!pageCount} />
            <button type="submit" className="px-2 py-1 border rounded md:hover:bg-gray-50 dark:md:hover:bg-gray-900" disabled={!pageCount} aria-label="Go to page">Go</button>
          </form>
          <div className="flex items-center gap-1 text-xs">
            <button className="px-2 py-1 border rounded md:hover:bg-gray-50 dark:md:hover:bg-gray-900" onClick={() => setUserScale(s => Math.max(0.5, s - 0.1))} aria-label="Zoom out">-</button>
            <div className="w-12 text-center select-none" aria-label="Zoom level">{Math.round(userScale * 100)}%</div>
            <button className="px-2 py-1 border rounded md:hover:bg-gray-50 dark:md:hover:bg-gray-900" onClick={() => setUserScale(s => Math.min(3, s + 0.1))} aria-label="Zoom in">+</button>
            <button className="ml-1 px-2 py-1 border rounded md:hover:bg-gray-50 dark:md:hover:bg-gray-900" onClick={() => setUserScale(1)} aria-label="Reset zoom">Reset</button>
            <button className="ml-1 px-2 py-1 border rounded md:hover:bg-gray-50 dark:md:hover:bg-gray-900" onClick={() => setIsFullscreen(v => !v)} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{isFullscreen ? 'Exit' : 'Fullscreen'}</button>
          </div>
        </div>
      </div>

      <div className={isFullscreen ? 'flex-1 w-full rounded-none border-0 overflow-auto bg-white dark:bg-white text-left' : 'h-[70vh] md:h-[75vh] lg:h-[80vh] xl:h-[85vh] w-full rounded-lg border border-gray-200 dark:border-gray-800 overflow-auto bg-white dark:bg-white text-left'} style={{ overflowAnchor: 'none' }}>
        {loading && <div className="p-4 text-sm text-gray-500">Loading PDF…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        <div ref={containerRef} className="px-3 py-3 min-w-max" style={{ overflowAnchor: 'none' }} />
      </div>
    </div>
  );
}
