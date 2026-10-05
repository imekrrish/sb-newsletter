# Newsletter Studio — SolarBytes & BESSNEWS

An extension of `imekrrish/sb-newsletter`, using its existing zero-dependency editor and converter patterns, with a separate BESSNEWS tab. BESSNEWS follows `references/BN_NL_9.html` and the supplied three-tier editorial requirements. TaiyangNews remains in its separate repository and is not included in this app.

## Run

Node 22:

```sh
npm start
# http://localhost:4400
npm test
```

No dependency install is required. Use the publication tabs:

| URL | Newsletter |
| --- | --- |
| `/` or `/?mode=sb` | SolarBytes Daily Digest |
| `/?mode=bess` | BESSNEWS Executive Briefing |

## BESS workflow

1. Load `https://bessnews.com/api/v1/collections/nl.rss`, or upload an RSS/XML file.
2. Select stories; NL-tagged stories are selected by default. If the feed has no NL picks, the latest 24 hours are selected.
3. Write the Today summary and set the edition date and issue number.
4. Choose the hero, review its two paragraphs, and add in-depth bullet highlights. Article paragraphs/takeaways are extracted from RSS content when available. Missing editorial text is flagged rather than invented.
5. Choose two distinct secondary features, each with one paragraph and exactly two quick bullets. Defaults use the next two selected stories.
6. Remaining stories become compact text-only Quick Signals, grouped by category. Edit any story's title, summary, tag, section, or image.
7. Configure optional top, middle, and footer banner advertisements and the native partner spotlight. All placements are labelled. Ads require an HTTPS/HTTP image and destination; disabled or incomplete banners are omitted from export.
8. Inspect desktop and mobile previews, then Download or Copy HTML for the email platform.

Hero and secondary stories are removed from the signal list to avoid duplication. Each secondary slot can contain only one distinct story. BESSNEWS and SolarBytes have independent saved drafts, selections, overrides and last-exported issue numbers. Parsed feed content is saved with the draft so file-upload editions can be recovered. Drafts are local to the browser; there is no account or cross-device synchronization.

The UI flags missing hero paragraphs/highlights, secondary feature copy, and incomplete ads. It permits draft exports so editors can work on partial editions. Review those flags before sending. No email is sent by this app.

## Categories and tags

Edit `public/bess-settings.js`. The supplied category table is implemented exactly:

| Newsletter header | Parent category | Child tag pills |
| --- | --- | --- |
| PROJECTS & DEPLOYMENTS | Projects | Utility, Grid-Scale, Commercial, Data Centers, EV Charging, Microgrids, Off-Grid, Residential, Under Development |
| MARKETS & TENDERS | Markets / Tender | Deployments, Outlook, Power Markets, Supply Chain, Open Tenders, Awarded, By Country |
| POLICY, GRID & REGULATION | Policy | Government, Grid, Regulation, EU Battery, Grid Interconnection, National, US & IRA |
| TECHNOLOGY & SYSTEM DESIGN | Technology | Chemistry, Manufacturing, Fire Safety, Components, System Design, Co-location, EMS & Software |
| FINANCE, DEALS & M&A | Business & Finance | Contracts, Expansion, Leadership, Strategy, Capital Raise, Infrastructure, M&A, Venture, Corporate, Hybrid Solar+BESS, Utility PPA |
| REGIONAL INTELLIGENCE | Regional Parent | Asia Pacific, Europe, Latin America, Middle East, North America |

Parent categories determine the newsletter group; child categories appear as article tag pills. Parent/header names and NL are omitted from pills. Parent grouping takes precedence over a child tag from another group. Existing heading aliases migrate saved drafts; unknown stories fall back to REGIONAL INTELLIGENCE.

## SolarBytes

SolarBytes keeps its existing lead/story/metric layout and gains the same three banner slots. Existing SolarBytes draft keys are retained.

## CLI

```sh
node cli.js tests/sample.rss sample-bess-output.html --mode bess --asset-base-url https://your-deployment-domain --edition edition.bess.example.json
node cli.js feed.rss out.html --mode bess --asset-base-url https://your-deployment-domain --date 2026-10-03 --issue 9 --today "Today's summary"
node cli.js feed.rss out.html --mode sb --asset-base-url https://your-deployment-domain
```

The CLI defaults to SolarBytes; `--mode bess` creates a hero and the next two features. `edition.bess.example.json` illustrates explicit feature overrides, hero paragraphs, sponsored copy and ads. Arrays of bullet strings are supported. Sample files contain clearly marked illustrative copy, not verified current news. Replace every sample sponsor image, link and fact before publication.

## Railway — deploy directly from GitHub

Create a Railway project with **Deploy from GitHub repo**, select `imekrrish/sb-newsletter`, and keep the root directory as `/` and branch as `main`. Railway reads `railway.json`: Railpack installs Node 22 and npm dependencies from the lockfile, builds the app, and starts `node server.js`. The server binds to `0.0.0.0` using Railway's injected `PORT`; `/health` must pass before traffic switches to the new deployment. Failed processes restart automatically, and SIGTERM drains active requests.

Under **Settings → Networking → Public Networking**, click **Generate Domain** once to expose the app. Open that HTTPS URL for SolarBytes, or add `/?mode=bess` for BESSNEWS. Keep GitHub automatic deployments enabled so future pushes redeploy the connected service.

No manually configured environment variables, database, Redis, migrations, volume, or seed command are required. All runtime code and logo assets are included in GitHub. Both the editor and RSS proxy run in this single service. Drafts remain in browser storage. Exported logo URLs automatically use the Railway domain; CLI exports still need `--asset-base-url`.

The repository configures the application service; Railway account/project creation and its public domain are one-time Railway actions. It does not provision unrelated external services.

To reproduce a clean deployment locally:

```sh
npm ci
npm run build
PORT=8080 npm start
# http://localhost:8080/health
```

## Vercel

Import this repository; Framework: Other, build command: `npm run build`, output: `public`. `vercel.json` includes the `/api/rss` serverless function. No secrets or environment variables are required. A Vercel deployment is a separate operation; this project is not deployed automatically by the build.

The proxy allows HTTPS RSS URLs only on bessnews.com and solarbytes.info (including www). Every redirect is checked, responses are capped at 5 MiB and requests time out after 20 seconds. Other feeds can be uploaded as files. Availability of the live upstream feeds depends on the publishers and hosting network.

## Email output

620px BESS table layout, inline styling, mobile rules, Outlook table fallback, hidden preheader, safe URL handling, escaped editorial text, ASCII-safe Unicode entities, and preserved Zoho unsubscribe/preferences merge tags. Validate the HTML in your actual email delivery platform; Outlook and Gmail rendering were not tested in real inboxes.

## Source provenance

- SB: `imekrrish/sb-newsletter`, main tree `fe9356414f5bd77e9bda14454ff4f8f5a383ea33`.
- BESS: supplied `BN_NL_9.html`, retained in `references/`.

## Verification

`npm test` checks feed content extraction and topic precedence; tier rendering and story deduplication; ads in SB and BESS; safe HTML/URLs/Unicode and merge tags; and proxy destination restrictions. Browser verification should also exercise drafts, downloads, tab switching, story editing and mobile preview before publishing.

## Publication logos

The supplied BESSNEWS and SolarBytes symbols appear as compact 64px badges beside the publication name inside each newsletter header, without an extra masthead row. The supplied clean white-background Wat(t) Bytes publisher logo appears in the same footer position in both. Original JPEG assets are retained; the checkerboard-background variant is not used.

Browser exports resolve logo URLs against the current deployment origin, so the deployed app produces absolute publicly hosted asset URLs. CLI exports require `--asset-base-url https://your-deployment-domain` or `NEWSLETTER_ASSET_BASE_URL`. Export from your publicly accessible deployment before sending; localhost asset URLs cannot load in recipient inboxes. The corrected BESS feed replaces the previous `/rss` URL in saved drafts automatically.

SolarBytes and BESSNEWS own independent brand and footer configurations. SolarBytes uses its solar-news tagline, Daily Digest description and solarbytes.info link. BESSNEWS uses its energy-storage tagline, Executive Briefing description and bessnews.com link. The Wat(t) Bytes publisher mark occupies the same footer position in both publications.
