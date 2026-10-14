/*
 * Sender avatars: initials in a tinted circle, rendered inside Gmail's
 * checkbox cell. The checkbox itself is stretched transparently over the
 * avatar (list.css), so clicking the avatar is a real click on Gmail's
 * checkbox and selection keeps working without synthetic events.
 */
import { SELECTORS } from "../../gmail";

export const AVATAR_CLASS = "ri-avatar";
// Number of tones defined in list.css (`[data-ri-tone]`).
const TONES = 8;

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string): string {
  const words: string[] = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked
    .map((word) => [...word][0])
    .join("")
    .toLocaleUpperCase();
}

/** Adds or updates the avatar of `row`. A no-op when it is already current. */
export function renderAvatar(row: Element): void {
  const cell = row.querySelector(SELECTORS.rowCheckbox);
  // First sender when the thread has several.
  const sender = row.querySelector(SELECTORS.rowSender);
  if (!cell || !sender) return;

  const email = (sender.getAttribute("email") ?? "").toLowerCase();
  const name = sender.getAttribute("name") || sender.textContent || email;
  const key = `${email}\n${name}`;

  let avatar = cell.querySelector<HTMLElement>(`:scope > .${AVATAR_CLASS}`);
  if (avatar?.dataset.riKey === key) return;
  if (!avatar) {
    avatar = document.createElement("div");
    avatar.className = AVATAR_CLASS;
    avatar.setAttribute("aria-hidden", "true");
    cell.append(avatar);
  }
  avatar.dataset.riKey = key;
  avatar.dataset.riTone = String(hash(email || name) % TONES);
  avatar.textContent = initials(name);
}
