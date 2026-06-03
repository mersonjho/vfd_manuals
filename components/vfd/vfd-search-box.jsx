'use client';

export default function VfdSearchBox() {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <input
        type="text"
        placeholder="Search VFD models... (e.g. TECO, VACON, YASKAWA)"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        onChange={(e) => {
          const q = e.target.value.toLowerCase();
          document.querySelectorAll('[data-vfd-card]').forEach(card => {
            const txt = card.getAttribute('data-search-text') || '';
            card.style.display = txt.includes(q) ? '' : 'none';
          });
        }}
      />
    </div>
  );
}
