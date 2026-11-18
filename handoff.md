# Project Handoff

## 1. Goal
Maintain and stabilize the **Islamic Studies Management System** (`الدراسات الإسلامية`) web application so that:
- Archived class/student management supports multi-select deletion, "Select All", and cascading deletion of students and all linked records.
- Top bar smart notifications automatically clear once viewed (`dismissedNotificationIds`).
- Public **Privacy Policy** (`سياسة الخصوصية العامة`) and **Terms of Service** (`شروط الخدمة العامة`) pages and links work reliably both inside the app and when deployed to GitHub Pages (via `dist/` or `docs/`).
- The Vite development server starts and resolves all dependencies cleanly without scanning prebuilt deployment bundles.

## 2. Current State
- **Production Build (`npm run build` / `compile_applet`):** Passing.
- **GitHub Pages Docs Build (`npm run build:docs`):** Passing; `/docs` contains the updated bundle along with static legal pages (`privacy.html`, `terms.html`, `privacy/index.html`, `terms/index.html`), updated `404.html`, and `.nojekyll`.
- **TypeScript Typecheck (`tsc --noEmit` / `lint_applet`):** Passing with exit code 0.
- **Dev Server (`tsx server.ts` on port `3000`):** Running and verified (`http://localhost:3000/` and `/src/main.tsx` return HTTP 200 without unresolved dependency errors).
- **Firebase / Storage:** Provisioned via `firebase-applet-config.json` (Firestore DB `ai-studio-f7d9e778-8689-4a60-83cb-596bffe10d72`), with local disk cache fallback (`AcademicAtelierData.json`) and optional client-side Google Drive sync.

## 3. Active Files
- `/vite.config.ts` — Vite configuration (`base: './'`, `@` alias, `optimizeDeps.entries: ['index.html']`, HMR disabled via env).
- `/tsconfig.json` — TypeScript configuration excluding `node_modules`, `dist`, and `docs`.
- `/index.html` — Root HTML entry point with `<noscript>` fallback links to `./privacy.html` and `./terms.html`.
- `/src/App.tsx` — Root router/layout managing auth gate (`LoginGate`), student portal mode, public legal page routing, and app-wide legal footer.
- `/src/lib/publicRoutes.ts` — Shared URL/base-path utilities (`getBasePathname`, `getPublicLegalUrl`, `getPublicLegalPageFromUrl`) preserving GitHub Pages repository subpaths.
- `/src/pages/LoginGate.tsx` — Teacher PIN gate displaying prominent Privacy Policy and Terms of Service links inside the card footer.
- `/src/pages/PrivacyPolicyPage.tsx` & `/src/pages/TermsOfServicePage.tsx` — Public RTL Arabic legal pages using `getPublicLegalUrl`.
- `/src/pages/SettingsPage.tsx` — System settings including legal page cards and copy-link actions using `getPublicLegalUrl`.
- `/src/pages/StudentPortalPage.tsx` & `/src/components/Sidebar.tsx` — Include public Privacy Policy and Terms of Service links.
- `/public/404.html` — GitHub Pages SPA redirector preserving repository subpaths and mapping `/privacy`, `/terms`, and `/student` routes to query params.
- `/public/privacy.html`, `/public/terms.html`, `/public/privacy/index.html`, `/public/terms/index.html` — Standalone static HTML legal pages returning HTTP 200 on GitHub Pages without requiring JS execution.
- `/docs/` — Prebuilt GitHub Pages output directory generated via `npm run build:docs`.
- `/.github/workflows/deploy.yml` — GitHub Actions workflow building and deploying `./dist` to GitHub Pages.

## 4. Changes Made
1. **GitHub Pages Routing & Legal Pages Support:**
   - Created `/src/lib/publicRoutes.ts` to normalize repository subpaths and generate clean public URLs (`?page=privacy` / `?page=terms`).
   - Updated `/src/App.tsx` so closing a public legal page strips only the legal suffix instead of resetting `url.pathname = '/'`, and added a global legal footer inside `<main>` so links remain accessible even in bottom-bar/mobile layouts.
   - Updated `/src/pages/PrivacyPolicyPage.tsx`, `/src/pages/TermsOfServicePage.tsx`, and `/src/pages/SettingsPage.tsx` to use `getPublicLegalUrl`.
   - Updated `/src/pages/LoginGate.tsx` to surface Privacy Policy and Terms of Service links directly inside the login card footer.
   - Updated `/public/404.html` to preserve GitHub Pages repo base paths and route clean legal/student paths properly.
   - Added static HTML pages (`/public/privacy.html`, `/public/terms.html`, `/public/privacy/index.html`, `/public/terms/index.html`) and `<noscript>` links in `/index.html`.
   - Rebuilt `/docs` via `npm run build:docs`.
2. **TypeScript Exclude Fix:**
   - Added `"exclude": ["node_modules", "dist", "docs"]` in `/tsconfig.json` so `tsc --noEmit` does not scan generated bundle files.
3. **Vite Dependency Scan Fix:**
   - Updated `/vite.config.ts` to add `optimizeDeps: { entries: ['index.html'] }`, preventing Vite dev server from scanning `/docs/index.html` and `/docs/assets/*.js` (which had triggered an unresolved `@emotion/is-prop-valid` import error inside the prebuilt `motion` bundle).

## 5. Failed Attempts
- **Concurrent `compile_applet` + `lint_applet` (prior to `tsconfig.json` update):** Running Vite build and `tsc --noEmit` concurrently initially failed with `TS6053` referencing deleted chunk files in `dist/assets/`. Resolved by excluding `node_modules`, `dist`, and `docs` in `/tsconfig.json`.
- **First edit attempt on `/vite.config.ts`:** `replace_file_content` failed to match the target block because line 21 contained an encoding-corrupted em-dash (`â€”`) in a comment. Resolved by targeting only lines 14–19 (`resolve` block) cleanly.

## 6. Specific Next Steps
1. **Commit and push to GitHub:** Push all updated files (especially `/public/*`, `/docs/*`, `/src/*`, `/index.html`, `/vite.config.ts`, `/tsconfig.json`) to the repository so GitHub Pages updates live (whether configured to deploy from `/docs` or via `/.github/workflows/deploy.yml`).
2. **Verify live GitHub Pages URLs after push:**
   - Confirm Privacy Policy and Terms of Service links appear on the login gate and app footer.
   - Confirm direct URLs (`/<repo>/?page=privacy`, `/<repo>/privacy`, `/<repo>/privacy.html`, `/<repo>/?page=terms`, `/<repo>/terms`, `/<repo>/terms.html`) load directly with HTTP 200 / valid content.
3. **Remember on future UI builds:** Whenever source code changes and `/docs` is used for GitHub Pages deployment, re-run `npm run build:docs` before pushing so `/docs` stays in sync with `src/`.
