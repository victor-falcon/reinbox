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
  clearSelection: "Clear selection",
  filters: "Filters",
  selectedCount: "{n} selected",
  today: "Today",
  yesterday: "Yesterday",
  thisMonth: "This month",
  popupEnable: "Enable Reinbox",
  popupEnableHint: "Restyle Gmail with the Focus design",
  popupTheme: "Theme",
  popupThemeAuto: "Auto",
  popupThemeLight: "Light",
  popupThemeDark: "Dark",
  popupSource: "Source code on GitHub",
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
  clearSelection: "Quitar selección",
  filters: "Filtros",
  selectedCount: "{n} seleccionados",
  today: "Hoy",
  yesterday: "Ayer",
  thisMonth: "Este mes",
  popupEnable: "Activar Reinbox",
  popupEnableHint: "Aplica el diseño Focus a Gmail",
  popupTheme: "Tema",
  popupThemeAuto: "Auto",
  popupThemeLight: "Claro",
  popupThemeDark: "Oscuro",
  popupSource: "Código fuente en GitHub",
};

const dictionaries: Record<string, Record<MessageKey, string>> = { en, es };

// Gmail sets <html lang> to its UI language, which may differ from the browser's.
export function language(): string {
  for (const tag of [document.documentElement.lang, navigator.language]) {
    const base = tag?.toLowerCase().split("-")[0];
    if (base && Object.hasOwn(dictionaries, base)) return base;
  }
  return "en";
}

export function t(key: MessageKey): string {
  return dictionaries[language()][key];
}
