const en = {
  inbox: "Inbox",
  snoozed: "Snoozed",
  done: "Done",
  sent: "Sent",
  compose: "Compose",
  search: "Search",
  menu: "Menu",
  views: "Views",
  pin: "Pin",
  snooze: "Snooze",
  markDone: "Mark as done",
  doneButton: "Done",
  today: "Today",
  yesterday: "Yesterday",
  thisMonth: "This month",
};

export type MessageKey = keyof typeof en;

const es: Record<MessageKey, string> = {
  inbox: "Bandeja",
  snoozed: "Pospuestos",
  done: "Hechos",
  sent: "Enviados",
  compose: "Redactar",
  search: "Buscar",
  menu: "Menú",
  views: "Vistas",
  pin: "Fijar",
  snooze: "Posponer",
  markDone: "Marcar como hecho",
  doneButton: "Hecho",
  today: "Hoy",
  yesterday: "Ayer",
  thisMonth: "Este mes",
};

const dictionaries: Record<string, Record<MessageKey, string>> = { en, es };

// Gmail sets <html lang> to its UI language, which may differ from the browser's.
function language(): string {
  for (const tag of [document.documentElement.lang, navigator.language]) {
    const base = tag?.toLowerCase().split("-")[0];
    if (base && Object.hasOwn(dictionaries, base)) return base;
  }
  return "en";
}

export function t(key: MessageKey): string {
  return dictionaries[language()][key];
}
