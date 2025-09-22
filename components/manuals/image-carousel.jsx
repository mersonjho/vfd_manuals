"use client";
import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

export default function ImageCarousel({ images }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0); // lightbox index
  const [current, setCurrent] = useState(0); // carousel index
  const viewportRef = useRef(null);

  // keep current in sync with scroll position
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setCurrent(Math.max(0, Math.min(images.length - 1, i)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [images.length]);

  const scrollToIndex = (i) => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: w * i, behavior: 'smooth' });
  };

  const prev = () => scrollToIndex(Math.max(0, current - 1));
  const next = () => scrollToIndex(Math.min(images.length - 1, current + 1));

  return (
    <>
      <div className="relative">
        <div ref={viewportRef} className="overflow-x-auto snap-x snap-mandatory">
          <div className="flex">
            {images.map((src, i) => (
              <button
                key={i}
                className="snap-center shrink-0 grow-0 basis-full"
                onClick={() => { setIndex(i); setOpen(true); }}
                aria-label={`Open image ${i+1}`}
              >
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="manual" className="h-full w-full object-contain" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 btn"
              onClick={prev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 btn"
              onClick={next}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={images.map((src) => ({ src, width: 1920, height: 1080 }))}
        plugins={[Zoom, Fullscreen]}
        carousel={{ imageFit: 'contain' }}
        zoom={{
          maxZoomPixelRatio: 5,
          zoomInMultiplier: 2,
          doubleTapDelay: 250,
          doubleClickDelay: 250,
          doubleClickMaxStops: 3,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 50,
          pinchZoomDistanceFactor: 50,
          scrollToZoom: true,
        }}
      />
    </>
  );
}
