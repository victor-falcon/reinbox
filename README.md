# Reinbox

Open source browser extension that brings the spirit of Google Inbox back to
Gmail: a calm, minimal inbox with mail grouped by date, bundles, pin, snooze
and "Done".

Reinbox only restyles and enhances the Gmail web app in your browser. It sends
no data anywhere and has no analytics.

> Status: early development. The first version implements the **Focus** design
> (see [`docs/design`](docs/design/README.md)).

## Development

```bash
npm install
npm run build      # outputs the unpacked extension to dist/
npm run dev        # rebuilds on change
npm run typecheck
npm run icons      # regenerates public/icons/*.png
```

Load `dist/` in `chrome://extensions` with "Developer mode" → "Load unpacked",
then open https://mail.google.com. After a rebuild, press the reload button on
the extension card and refresh Gmail.

### QA harness

`npm run preview` builds and serves saved Gmail DOM snapshots with the content
script and CSS injected, so styles can be checked without a logged-in Gmail:

```bash
REINBOX_FIXTURES=~/reinbox-fixtures PORT=8766 npm run preview
```

- Pages: `/inbox`, `/conversation`, `/compose` (from `gmail-inbox.html`,
  `gmail-conversation.html` and `gmail-compose.html` in `REINBOX_FIXTURES`).
- `?theme=light|dark|auto` sets the theme, `?enabled=0` turns Reinbox off.

The snapshots are real mailboxes: keep them outside the repo and never commit
them or screenshots of them.

## How it works

- `src/content/index.ts` is the content script. It runs at `document_start`,
  adds `reinbox` (and `ri-dark` for the dark theme) to `<html>` and starts the
  features in `src/content/features/`.
- `src/content/prefs.ts` stores `{ enabled, theme }` in `chrome.storage.sync`.
- `src/content/gmail.ts` holds every Gmail selector plus a shared, throttled
  DOM observer (`onDomChange`, `whenElement`).
- `src/styles/` holds all the CSS, scoped to `html.reinbox` so disabling the
  extension restores Gmail's original look. Design tokens are `--ri-*` custom
  properties in `tokens.css`.

Plus Jakarta Sans is bundled under the SIL Open Font License
(`dist/fonts/OFL.txt`).

Reinbox is an independent project, not affiliated with Google. Gmail is a
trademark of Google LLC.

## License

[MIT](LICENSE)
