# ArchiTech Demo — Project Context

## What This Repo Is
- **Purpose:** Static deployment repo for live sales demos at `architechdemo.com`
- **Repo:** `https://github.com/ArchiTechGit/architechdemo.git`
- **Branch:** `master`
- **Structure:** No build tooling here — only compiled/exported static files ready for deployment

## Deployed Demos

| # | Path | Description | Source |
|---|------|-------------|--------|
| 01 | `/wxcc/` | Webex CC Workflow Demo | `thesenate/projects/wxccworkflowdemo` |
| 02 | `/wxccroi/` | Webex CC ROI Calculator | `thesenate/projects/wxccroi` |

## How to Update a Demo

### wxccroi (Next.js app)
Source: `h:/My Drive/thesenate/projects/wxccroi`

**Build steps (must build locally, NOT on Google Drive — symlink issues):**
```bash
# 1. Copy source to local temp (exclude node_modules, .next, out)
find "h:/My Drive/thesenate/projects/wxccroi" -maxdepth 1 \
  -not -name 'node_modules' -not -name '.next' -not -name 'out' \
  -not -wholename "h:/My Drive/thesenate/projects/wxccroi" \
  | xargs -I{} cp -r {} C:/Users/senate/temp/wxccroi-build/

# 2. Install and build
cd C:/Users/senate/temp/wxccroi-build
npm install --legacy-peer-deps
npm run build

# 3. Copy output to this repo
cp -r C:/Users/senate/temp/wxccroi-build/out/. C:/Users/senate/repos/architechdemo/wxccroi/
```

**next.config.mjs must have:**
```js
output: 'export',
basePath: '/wxccroi',
```

### wxcc (Vite/React app)
- Built as a single-bundle static app
- Copy compiled `index.html` + `assets/` into `/wxcc/`

## Adding a New Demo
1. Build the static export with the correct `basePath` (e.g. `/newdemo`)
2. Copy output into a new folder at the repo root: `/newdemo/`
3. Add a TOC entry in `index.html` with the next sequential number

## Key Notes
- pnpm fails on Google Drive paths (Windows symlink issue) — always use `npm --legacy-peer-deps` for builds
- The `index.html` at root is the TOC/landing page only
- No server-side rendering — everything must be static export
