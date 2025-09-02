# Manual Portal

A minimal, modern React + Vite + Tailwind scaffold for hosting VFD manuals.

Features included:

- React + Vite project scaffold
- Tailwind CSS setup
- Two tabs: Home and VFD Manuals (React Router)
- VFD Manuals page: list of models, detail pane with images and PDF viewer embedded
- Scalable directory structure for future features/modules

Local development

Prerequisites:
- Node.js 18+ installed

Install dependencies:

```powershell
cd c:\Users\jhom\Desktop\bits_ref_manuals\manual-portal
npm install
```

Run locally:

```powershell
npm run dev

Note: `npm run dev` is configured to bind to all network interfaces (0.0.0.0) and uses port 5137 by default so you can access the dev server from other devices on your LAN.

If you cannot reach it from your phone, open the development port in Windows Firewall (run PowerShell as Administrator):

```powershell
# open port 5137
.\scripts\open-firewall.ps1 -Port 5137
```

Or manually:

```powershell
New-NetFirewallRule -DisplayName "Vite Dev 5137" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5137
```
```

Build for production:

```powershell
npm run build
npm run preview
```

Deploy to GitHub Pages (recommended flow):
1. Create a new GitHub repo and push this project.
2. Enable GitHub Pages from the repository settings (use the `gh-pages` branch or `docs/` folder if you prefer). Alternatively, use GitHub Actions to deploy `dist/` after `npm run build`.

Example using GitHub Actions (simple):

1. Create a workflow that runs `npm ci && npm run build` and uploads `dist/` to `gh-pages` or uses a deploy action.

This repository includes a minimal scaffold; for production you should add CI and a proper deploy action.

Notes

- This scaffold embeds sample PDF files in `public/` for demonstration. Replace with your real manuals.
- Next steps: add API/backend, authentication, search, filters, and notifications on Home.
