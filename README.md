# Newsletter Studio — SOLARbytes & BESSNEWS

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
| `/` or `/?mode=sb` | SOLARbytes Daily Digest |
| `/?mode=bess` | BESSNEWS Executive Briefing |

## BESS workflow

1. Load `https://bessnews.com/rss`, or upload an RSS/XML file.
2. Select stories; NL-tagged stories are selected by default. If the feed has no NL picks, the latest 24 hours are selected.
3. Write the Today summary and set the edition date and issue number.
4. Choose the hero, review its two paragraphs, and add in-depth bullet highlights. Article paragraphs/takeaways are extracted from RSS content when available. Missing editorial text is flagged rather than invented.
5. Choose two distinct secondary features, each with one paragraph and exactly two quick bullets. Defaults use the next two selected stories.
6. Remaining stories become compact text-only Quick Signals, grouped by category. Edit any story's title, summary, tag, section, or image.
7. Configure optional top, middle, and footer banner advertisements and the native partner spotlight. All placements are labelled. Ads require an HTTPS/HTTP image and destination; disabled or incomplete banners are omitted from export.
8. Inspect desktop and mobile previews, then Download or Copy HTML for the email platform.

Hero and secondary stories are removed from the signal list to avoid duplication. Each secondary slot can contain only one distinct story. BESSNEWS and SOLARbytes have independent saved drafts, selections, overrides and last-exported issue numbers. Parsed feed content is saved with the draft so file-upload editions can be recovered. Drafts are local to the browser; there is no account or cross-device synchronization.

The UI flags missing hero paragraphs/highlights, secondary feature copy, and incomplete ads. It permits draft exports so editors can work on partial editions. Review those flags before sending. No email is sent by this app.

## Categories and tags

Edit `public/bess-settings.js`. Parent topic categories take precedence over child tag pills. The inferred parent groups are Projects & Deployments; Markets & Tenders; Policy, Grid & Regulation; Technology & Manufacturing; Finance & Business; Regional & Global Signals. The screenshot's cropped right edge prevents recovery of every tag; visible tags and the HTML's categories are included, and unknown stories fall back to Regional & Global Signals. All non-NL tags remain editable, so the complete taxonomy can be applied without code changes to individual stories.

## SOLARbytes

SOLARbytes keeps its existing lead/story/metric layout and gains the same three banner slots. Existing SOLARbytes draft keys are retained.

## CLI

```sh
node cli.js tests/sample.rss sample-bess-output.html --mode bess --edition edition.bess.example.json
node cli.js feed.rss out.html --mode bess --date 2026-10-03 --issue 9 --today "Today's summary"
node cli.js feed.rss out.html --mode sb
```

The CLI defaults to SOLARbytes; `--mode bess` creates a hero and the next two features. `edition.bess.example.json` illustrates explicit feature overrides, hero paragraphs, sponsored copy and ads. Arrays of bullet strings are supported. Sample files contain clearly marked illustrative copy, not verified current news. Replace every sample sponsor image, link and fact before publication.

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
