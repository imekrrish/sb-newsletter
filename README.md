# SOLARbytes Newsletter Generator

Builds the **SOLARbytes Daily Digest** email from the solarbytes.info RSS feed. It works the same way as the TaiyangNews generator (`tn-newsletter`): a form on the left and a live email preview on the right, with Download, Copy and Open buttons.

The email layout is a refined version of `nl_sb_9.html`.

## Run

```
npm start            # http://localhost:4400  (Node 18+, no npm install needed)
```

The page loads `https://solarbytes.info/rss` on open. Stories tagged **NL** in the feed are pre-selected.

## Form

| Step | Field | Email output |
|---|---|---|
| 1 | RSS URL or uploaded `.rss` file | Story source |
| 2 | Newsletter date, Issue # | Header date and issue badge |
| 2 | Summary | "Today:" bar and the inbox preview text |
| 3 | Include THE LEAD BYTE checkbox, lead story, bullet points | Hero image, title, summary and a key-figures box |
| 4 | Sponsored content checkbox, headline, text, link, button, image | Partner block under the lead |
| 5 | Metric of the day checkbox, metric, text, link to story | Navy metric band with a "Go to story" button |
| 6 | Story list | Section blocks with a thumbnail, tag, title and summary |

Bullet points take one line each. Write `Label: text` to make the label bold.

Each story has an **Edit** button for its title, summary, tag, section and image URL. Edited stories show an "Edited" badge and can be reverted to the feed version.

The draft saves in the browser as you type. Reopening the page restores it for the same or a future date. When a new edition starts, the daily copy is cleared and the issue number moves one past the last downloaded issue.

Download names follow `SB_2Oct2026.html`.

## Images

Every story uses its feed image. Publive CDN images are requested at exact crop sizes, so they look right in Gmail and Outlook, which ignore CSS cropping.

| Use | Display size | Requested size |
|---|---|---|
| Lead hero | 600 × 260 | 1200 × 520 |
| Story thumbnail | 90 × 72 | 180 × 144 |

Images from other hosts are used as-is. Stories without an image fall back to `images.fallback` in the settings file. Use public image URLs, because email clients block local files and data URIs.

## Configuration

Everything that stays the same between editions lives in `public/settings.js`:

- **Brand:** logo text, title, publisher and sister sites.
- **Colors:** the navy and amber palette.
- **Sections:** the order of sections and which feed categories go into each one.
- **Labels:** "Today:", "The Lead Byte", button text and similar.
- **Footer:** feedback links, WhatsApp and Telegram links, and the Zoho unsubscribe and preferences merge tags.
- **Image sizes and the fallback image.**

A story goes into the first section whose `match` list contains one of its feed categories. Its tag is its first non-region category, so "India Bytes / Bid Bytes" shows as **Bid Bytes** under India Bytes.

## Command line

```
node cli.js https://solarbytes.info/rss out.html --edition edition.example.json
node cli.js feed.rss --date 2026-10-02 --issue 143 --today "One-line summary"
```

Without `--edition`, the CLI uses the NL-tagged stories and makes the first one the lead. `edition.example.json` shows every option. Its `stories` list takes story links, or objects with a `link` plus any fields to override.

`sample-output.html` was built from the 1 Oct 2026 feed with `edition.example.json`.

## Files

```
server.js            static server + RSS proxy (avoids browser CORS)
cli.js               command-line build
public/settings.js   brand, sections, labels, footer, image sizes
public/converter.js  RSS parsing, section and tag classification, image sizing
public/template.js   email HTML (table layout, inline styles, Outlook fixes)
public/app.js        generator UI
```
