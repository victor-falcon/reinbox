# Design directions

Two design directions explored for Reinbox, kept here as the source of truth.
Both are inspired by Google Inbox (2014–2019): mail grouped by date, bundles,
pin, snooze and "Done" instead of archive.

The `.dc.html` files are Design Component mockups (Claude Design canvas
format). They need that runtime to render, so the tokens below are the part
to read when implementing.

| Direction | Status | Files |
| --- | --- | --- |
| **Focus** | Implemented first | `focus/Focus.dc.html`, `focus/FocusDark.dc.html` |
| **Paper** | Kept for later | `paper/Paper.dc.html`, `paper/PaperDark.dc.html` |

## Focus

Single centered column, no sidebar. Views (Inbox, Snoozed, Done, Sent) live in
a segmented control in the header. Large date headings ("Today", "Yesterday").
Each conversation takes three lines: sender + time, subject, snippet. Rows
have no borders; hover shows a rounded tinted background and the actions.
Bundles render expanded inside a bordered card with a "Mark all done" button.
Compose is a neutral circular floating button.

- Font: Plus Jakarta Sans (400, 500, 600, 700)
- Column max width: 700px
- Radii: rows 20px, bundle card 22px, segmented control 16px / 12px, buttons 12–14px, FAB circle
- Date heading: 28px / 700 / -0.02em, followed by a 13px secondary date

| Token | Light | Dark |
| --- | --- | --- |
| `bg` | `#FBFAF8` | `#121110` |
| `surface` | `#FFFFFF` | `#1C1B19` |
| `surface2` | `#F1EFEB` | `#1F1E1C` |
| `border` | `#E9E6E1` | `#2C2A27` |
| `text` | `#1C1A17` | `#F0EDE8` |
| `text2` | `#5E5A53` | `#B3AEA6` |
| `text3` | `#77726A` | `#8F8A82` |
| `accent` | `#C2410C` | `#F28B4B` |
| `accentSoft` | `#FCEBDF` | `#3A2416` |
| `hover` | `#F3F1ED` | `#1E1D1B` |
| `shadow` | `0 1px 2px rgba(28,26,23,.08)` | `0 1px 2px rgba(0,0,0,.4)` |
| `fabShadow` | `0 10px 24px rgba(28,26,23,.22)` | `0 10px 28px rgba(0,0,0,.55)` |

## Paper

Closest to classic Inbox. Text sidebar with views and a "Bundles" section,
search field in the header, date groups rendered as white cards (16px radius)
with thin dividers between one-line rows. Bundles are rows with a colored
square icon and a count. Blue accent, square-ish rounded FAB (20px radius).

- Font: Geist (400, 500, 600, 700)
- Column max width: 820px, sidebar 232px
- Row height: 64px, avatar 36px

| Token | Light | Dark |
| --- | --- | --- |
| `bg` | `#F5F5F3` | `#111214` |
| `surface` | `#FFFFFF` | `#18191C` |
| `surface2` | `#F1F1EE` | `#24262A` |
| `border` | `#E6E5E1` | `#2A2C30` |
| `text` | `#1B1B1A` | `#ECECEE` |
| `text2` | `#55554F` | `#B0B1B6` |
| `text3` | `#6B6B66` | `#8E9096` |
| `accent` | `#2F62E8` | `#7EA6FF` |
| `accentSoft` | `#E9EFFD` | `#1E2940` |
| `hover` | `#FAFAF8` | `#1F2125` |

## Bundle colors (shared)

| Bundle | Light | Dark |
| --- | --- | --- |
| Social | `#D9541E` | `#E8794A` |
| Promotions | `#1F7FC0` | `#4AA8E0` |
| Updates | `#B86E00` | `#E5A13A` |
| Finance | `#2E8B48` | `#4FB06A` |
| Travel | `#6E52D8` | `#9B83F0` |
