# VFD Manuals Portal (Next.js + Tailwind)

A simple, mobile-friendly portal to browse VFD manuals with an image gallery and a reliable PDF viewer.

## What lives where (plain-English)

- app/
  - layout.jsx – Page shell (theme + header) and global CSS import
  - page.jsx – Home page
  - manuals/page.jsx – Manuals route
  - api/pdf/route.js – Proxy for external PDF URLs (fixes CORS)

- components/
  - site-header.jsx – Top navigation + theme toggle
  - manuals/
    - manuals-view.jsx – Left list + right details layout
    - manuals.details.jsx – Renders one manual (title, specs, images, PDF)
    - image-carousel.jsx – One-at-a-time images, tap to fullscreen/zoom
    - pdf-viewer.jsx – Simple, dependable PDF viewer (uses iframe on desktop; opens in new tab on phones)

- data/
  - manuals.json – The single source of truth. The UI reads this file to know what to show.
  - manuals.schema.json – Reference schema showing field meanings (optional helper)

- public/
  - manuals/<slug>/ – Put each manual’s assets here (images and PDF)

- app/globals.css – Tailwind base/utilities and small design tokens

## The data model (manuals.json)

This file drives the entire Manuals page. Keep it short and consistent:

```
{
  "manuals": [
    {
      "id": "abb-acs880",            // folder name under public/manuals/
      "title": "ABB ACS880",          // visible name in the list and details
      "description": "Short summary.", // appears under the title
      "images": [                      // relative URLs under /public
        "/manuals/abb-acs880/img-1.svg",
        "/manuals/abb-acs880/img-2.svg"
      ],
      "details": [                     // key facts shown in a two-column list
        { "label": "Manufacturer", "value": "ABB" },
        { "label": "Model", "value": "ACS880" },
        { "label": "Voltage", "value": "400V" }
      ],
      "installation": [                // ordered steps (optional)
        "Mount in a ventilated cabinet.",
        "Ensure proper grounding."
      ],
      "remarks": "Any notes for technicians.",
      "pdf": "/manuals/abb-acs880/manual1.pdf"   // a local file or a full URL
    }
  ]
}
```

Add more manuals by appending more objects to the `manuals` array.

Pro tip: Keep paths under `/public/manuals/<slug>/` so you can copy/paste a whole folder.

## How to add a new manual (fast)

1) Create a folder: `public/manuals/<your-slug>/`
   - Drop images as `img-1.svg`, `img-2.svg`, … (any image formats work)
   - Drop the PDF as `manual.pdf` or `manual1.pdf`

2) Edit `data/manuals.json` and add an entry:

```
{
  "id": "<your-slug>",
  "title": "<Display Title>",
  "description": "<One-line summary>",
  "images": [
    "/manuals/<your-slug>/img-1.svg"
  ],
  "details": [ { "label": "Manufacturer", "value": "<Brand>" } ],
  "installation": [ "<Step 1>", "<Step 2>" ],
  "remarks": "<Optional notes>",
  "pdf": "/manuals/<your-slug>/manual.pdf"
}
```

3) Save. The Manuals page updates automatically in dev.

## Run locally

```powershell
npm install
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

1) Push to a GitHub repo
2) In Vercel, Import Project → Framework: Next.js → Deploy
3) Done. Future pushes auto‑deploy

## Why manuals.json and not a JS file?

- JSON is easy to read/edit for anyone (even non-developers)
- No imports or code needed—just data
- Safer in builds and CI (no execution, just a blob)

## Notes

- Dark mode uses class-based theming via `next-themes`
- The PDF viewer avoids mobile iframe scrolling issues by opening in a new tab on phones
- You can extend the schema later (e.g., add tags or links) without changing component code much
