# Azure Static Web Apps Migration Plan (Free Tier)

This plan migrates `ai-bootcamp-pages` from GitHub Pages to Azure Static Web Apps (SWA) while keeping content editable in GitHub.

## Goals

- Host outside GitHub Pages
- Keep deployment automated from `main`
- Reduce discoverability and indexing by search engines
- Put a lightweight form in front of course links
- Stay on Azure SWA Free tier for pilot

## Architecture

```text
GitHub repo (main)
  -> GitHub Actions (.github/workflows/deploy-azure-swa.yml)
  -> Azure Static Web Apps (Free)
  -> Custom domain (optional later)

Site behavior:
Landing page -> /access/ form -> reveals bootcamp links
```

## What Is Implemented In This Repo

1. Azure SWA deployment workflow:
   - `.github/workflows/deploy-azure-swa.yml`
   - builds with `BASE_PATH=/` for root-domain URLs
2. Selective indexing controls:
   - `site/public/robots.txt`
   - `<meta name="robots" ...>` in layout
   - home page opts into indexing, all other pages default to `noindex`
3. Lightweight form gate:
   - `site/src/pages/access.astro`
   - home links now point users to `/access/`

## One-Time Setup In Azure

1. Create Azure Static Web App (Free plan).
2. Choose deployment source = `Other` (we already provide GitHub workflow here).
3. In GitHub repo settings, add secret:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Azure SWA -> Manage deployment token)
4. Push to `main` (or run workflow manually).

## Workflow Trigger Behavior

- Workflow runs on push to `main` and `feature/access-control` when `site/**` or workflow file changes.
- If `AZURE_STATIC_WEB_APPS_API_TOKEN` is missing, deploy job is skipped (no pipeline failure).
- Existing GitHub Pages workflow keeps `BASE_PATH=/ai-bootcamp-pages` for compatibility.

## DNS / Custom Domain (Optional for Pilot)

After validating Azure default URL:

1. Add custom subdomain in SWA.
2. Add required TXT verification record in DNS.
3. Add CNAME to Azure SWA hostname.

## Cutover Checklist

1. Confirm Azure URL is live and rendering correctly.
2. Confirm indexing rules are present:
   - home page HTML robots meta tag = `index,follow`
   - course/access pages HTML robots meta tag = `noindex,...`
   - `robots.txt` disallows `/access`, `/courses`, `/course-1`, `/course-2`
3. Disable GitHub Pages deployment/settings after Azure is verified.
4. Request removal of old indexed URLs in Google Search Console.

## Notes and Limitations

- The `/access/` gate is lightweight and client-side.
- It is not authentication and does not prevent link sharing.
- For real access control later, add an auth layer (e.g., Entra ID, static web app auth, or reverse proxy).

## Estimated Timeline

- Day 1: Azure resource + secrets + first deploy
- Day 2: DNS/custom domain + verification
- Day 3: Cutover and de-index validation
