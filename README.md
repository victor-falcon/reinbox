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
```

Load `dist/` in `chrome://extensions` with "Developer mode" → "Load unpacked",
then open https://mail.google.com.

## How it works

- `src/content/` is the content script. Each preference becomes a `ri-*` class
  on `<html>`; JavaScript is only used where CSS alone cannot do the job.
- `src/styles/` holds all the CSS, scoped to `html.reinbox` so disabling the
  extension restores Gmail's original look.

Reinbox is an independent project, not affiliated with Google. Gmail is a
trademark of Google LLC.

## License

[MIT](LICENSE)
