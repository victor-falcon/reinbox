/*
 * Gmail DOM hooks. Gmail's class names are obfuscated and change over time,
 * so every one of them lives here and nowhere else. Prefer the structural
 * hooks (roles, ids, attributes) when they exist.
 */
export const SELECTORS = {
  // App chrome
  header: "header#gb",
  // Hamburger button; the only `div[role=button]` in the header with aria-expanded.
  menuButton: "header#gb div[role=button][aria-expanded]",
  search: "form[role=search]",
  leftNav: ".aeN[role=navigation]",
  // The left nav collapsed to an icon rail (`.bym` while hover-expanded).
  leftNavCollapsed: ".aeN.bhZ",
  composeButton: ".T-I.T-I-KE.L3",
  main: "[role=main]",
  toolbar: "[gh=tm]",
  rightPanel: ".bAw",
  // Page footer: storage meter, terms and last account activity.
  footer: ".aeG",
  // Gmail's white rounded panel around the list/conversation, and its scroller
  appPanel: ".bkK > .nH",
  scroller: ".Tm",

  // Thread list
  row: "tr.zA",
  rowUnread: "tr.zA.zE",
  rowRead: "tr.zA.yO",
  rowSelected: "tr.zA.x7",
  rowCheckbox: "td.oZ-x3",
  // The star is drawn with ::before; `.T-KT-Jp` marks it as starred.
  rowStar: "td.apU .T-KT",
  rowStarred: "td.apU .T-KT.T-KT-Jp",
  rowImportance: "td.WA",
  // Carries `email` and `name` attributes.
  rowSender: "td.yX .yW [email]",
  rowSubjectCell: "td.a4W",
  rowSubject: "td.a4W .bog",
  rowSnippet: "td.a4W .y2",
  // `title` holds the full localized date, e.g. "mié, 14 oct 2026, 16:20".
  rowDate: "td.xW span[title]",
  rowHoverActions: "td.bq4 li.bqX",
  rowArchive: "td.bq4 li.bqX.brq",
  rowDelete: "td.bq4 li.bqX.bru",
  rowMarkRead: "td.bq4 li.bqX.brr",
  rowMarkUnread: "td.bq4 li.bqX.SHFPQe",
  rowSnooze: "td.bq4 li.bqX.brv",

  // Conversation view. `act` ids are Gmail's toolbar command ids: 19 is
  // "Back to <label>", which only the thread toolbar has; 7 is Archive.
  // conversation.css mirrors these and also styles the thread's inner parts
  // (.aHU message list, .gE header, .gD sender, .g3 date, .amn reply bar).
  threadToolbar: "[gh=mtb]",
  threadBack: "[gh=mtb] [act='19']",
  threadArchive: "[act='7']",
  thread: "[role=main] .a98",
  threadSubject: "h2.hP",

  // Compose: the floating dialog and the inline reply share `.aoI`; the dialog
  // is the `[role=dialog]` around it. `.aoO` is Send.
  compose: ".aoI",
  composeSend: ".aoO[role=button]",

  // Rendered email content: never restyle fonts inside these.
  messageBody: ".a3s",
  composeBody: ".editable",
} as const;

type Callback = () => void;

const callbacks = new Set<Callback>();
let observer: MutationObserver | undefined;
let frame = 0;

function flush(): void {
  frame = 0;
  for (const cb of [...callbacks]) {
    // One broken feature must not starve the others.
    try {
      cb();
    } catch (error) {
      console.error("[reinbox]", error);
    }
  }
}

/**
 * Runs `cb` after nodes are added or removed anywhere in the page, at most
 * once per animation frame. One MutationObserver is shared by every feature.
 * Attribute changes are not observed. Callbacks must be idempotent: DOM they
 * change themselves schedules another frame. Returns an unsubscribe.
 */
export function onDomChange(cb: Callback): () => void {
  callbacks.add(cb);
  if (!observer) {
    observer = new MutationObserver(() => {
      frame ||= requestAnimationFrame(flush);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0 && observer) {
      observer.disconnect();
      observer = undefined;
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/**
 * Resolves with the first element matching `selector`. Rejects with the
 * signal's reason when `signal` aborts, so callers that abort must catch.
 */
export function whenElement<T extends Element = Element>(selector: string, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const found = document.querySelector<T>(selector);
    if (found) return resolve(found);
    if (signal?.aborted) return reject(signal.reason);

    const onAbort = () => {
      stop();
      reject(signal?.reason);
    };
    const stop = onDomChange(() => {
      const el = document.querySelector<T>(selector);
      if (!el) return;
      stop();
      signal?.removeEventListener("abort", onAbort);
      resolve(el);
    });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
